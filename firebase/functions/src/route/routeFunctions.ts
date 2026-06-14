// Phase 12.5H-3: Google Routes API — Callable Functions skeleton
// Phase 12.5H-4: route_segments Firestore read/delete 本実装
// Phase 12.5H-5: generateNoteRoutes walking/driving 本実装
//
// セキュリティ方針:
// - GOOGLE_ROUTES_API_KEY は Secret Manager の defineSecret() 経由でのみ参照する
// - Google Routes API 呼び出しはこのファイル（Cloud Functions）からのみ行う
// - 座標・ルート情報はログに出力しない
// - uid はログに末尾4文字のみ出力する

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

import type {
  GenerateNoteRoutesInput,
  GenerateNoteRoutesResult,
  GetNoteRouteSegmentsInput,
  GetNoteRouteSegmentsResult,
  RouteSegmentSummary,
  DeleteNoteRouteCacheInput,
  DeleteNoteRouteCacheResult,
  PremiumRouteTravelMode,
  RouteSegmentDoc,
  RouteSegmentStatus,
} from './types';
import {
  getRouteSegmentsCollectionPath,
  buildRouteSegmentId,
  calcRouteExpiresAt,
  isRouteSegmentStale,
} from './routeCache';
import { computeRouteSegment } from './routesClient';
import { decodePolyline } from './polylineUtils';

// ── 定数 ──────────────────────────────────────────────────────────────────────

const REGION = 'asia-northeast1';

const VALID_TRAVEL_MODES: PremiumRouteTravelMode[] = ['walking', 'driving', 'transit'];

// ── Secret Manager ────────────────────────────────────────────────────────────

const googleRoutesApiKey = defineSecret('GOOGLE_ROUTES_API_KEY');

// ── 共通ヘルパー ──────────────────────────────────────────────────────────────

type MemberRole = 'owner' | 'editor' | 'viewer';

/**
 * ノートを取得し、呼び出し元が owner または editor であることを確認する。
 * - ノートが存在しない → not-found
 * - viewer / メンバー外 → permission-denied
 */
async function assertOwnerOrEditor(
  db: admin.firestore.Firestore,
  noteId: string,
  uid: string
): Promise<admin.firestore.DocumentSnapshot> {
  const noteRef = db.doc(`memory_notes/${noteId}`);
  const noteSnap = await noteRef.get();

  if (!noteSnap.exists) {
    throw new HttpsError('not-found', 'ノートが見つかりません');
  }

  const noteData = noteSnap.data()!;
  const members = noteData.members as Record<string, string> | undefined;
  const role = members?.[uid] as MemberRole | undefined;

  if (!role || !['owner', 'editor'].includes(role)) {
    throw new HttpsError('permission-denied', 'owner または editor のみ実行できます');
  }

  return noteSnap;
}

/**
 * ノートに所属するメンバー（owner / editor / viewer）であることを確認する。
 * getNoteRouteSegments など viewer にも開放する操作で使用する。
 */
async function assertNoteMember(
  db: admin.firestore.Firestore,
  noteId: string,
  uid: string
): Promise<void> {
  const noteRef = db.doc(`memory_notes/${noteId}`);
  const noteSnap = await noteRef.get();

  if (!noteSnap.exists) {
    throw new HttpsError('not-found', 'ノートが見つかりません');
  }

  const noteData = noteSnap.data()!;
  const members = noteData.members as Record<string, string> | undefined;
  const role = members?.[uid] as MemberRole | undefined;

  if (!role) {
    throw new HttpsError('permission-denied', 'このノートへのアクセス権がありません');
  }
}

// ── PlaceGroup 型（Firestore ドキュメントから取得） ────────────────────────────

type PlaceGroupData = {
  id: string;
  latitude: number;
  longitude: number;
  sortOrder?: number;
  startAt?: admin.firestore.Timestamp | null;
  label?: string;
};

// ── 1. generateNoteRoutes ─────────────────────────────────────────────────────

/**
 * ノートの PlaceGroup 間のルートを Google Routes API で生成し、
 * Firestore の route_segments サブコレクションにキャッシュする。
 *
 * Phase 12.5H-5: walking / driving 本実装。
 * - PlaceGroup を sortOrder 昇順で取得
 * - 隣接 PlaceGroup ペアでセグメントを生成
 * - キャッシュ確認（isRouteSegmentStale）
 * - computeRouteSegment で Google Routes API 呼び出し
 * - decodedPolyline を Firestore に保存（expiresAt = 30日後）
 * - transit は未対応（Phase 12.5H-6 で実装予定）
 *
 * Premium判定:
 * - TODO Phase 12.5H-7: isPremiumUser = true のハードコードを RevenueCat 本実装に差し替える。
 *   本番リリース前に必ず置き換えること。
 */
export const generateNoteRoutes = onCall(
  {
    region: REGION,
    secrets: [googleRoutesApiKey],
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async (request): Promise<GenerateNoteRoutesResult> => {
    // 1. 認証チェック
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    const uid = request.auth.uid;

    // 2. input バリデーション
    const data = request.data as Partial<GenerateNoteRoutesInput>;

    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    if (!VALID_TRAVEL_MODES.includes(data.travelMode as PremiumRouteTravelMode)) {
      throw new HttpsError('invalid-argument', 'travelMode が不正です（walking / driving / transit）');
    }

    const noteId = data.noteId.trim();
    const travelMode = data.travelMode as PremiumRouteTravelMode;
    const forceRefresh = data.forceRefresh === true;

    // transit は未実装
    if (travelMode === 'transit') {
      throw new HttpsError(
        'unimplemented',
        '公共交通ルートは次のフェーズで対応予定です（Phase 12.5H-6）'
      );
    }

    const db = admin.firestore();

    // 3. ノート取得 + owner/editor 権限確認
    await assertOwnerOrEditor(db, noteId, uid);

    // 4. Premium 判定（仮実装）
    // TODO Phase 12.5H-7: この isPremiumUser = true のハードコードを
    //   RevenueCat または Firestore entitlement による本実装に差し替えること。
    //   本番リリース前に必ず置き換えること。
    const isPremiumUser = true;
    if (!isPremiumUser) {
      throw new HttpsError('permission-denied', 'ルート生成はプレミアムプランのみ利用可能です');
    }

    // 5. TODO Phase 12.5H-7: ルート生成回数クォータチェックを実装する。
    //    1日 10回 / forceRefresh は 1日 3回の上限を設ける。
    //    await assertRouteGenerationQuota(db, uid, forceRefresh);

    // 6. PlaceGroup を sortOrder 昇順で取得
    let groupsQuery: admin.firestore.Query = db
      .collection(`memory_notes/${noteId}/place_groups`)
      .orderBy('sortOrder', 'asc');

    const groupsSnap = await groupsQuery.get();
    const groups: PlaceGroupData[] = groupsSnap.docs
      .map((d) => {
        const gd = d.data() as Partial<PlaceGroupData>;
        return {
          id: d.id,
          latitude: gd.latitude ?? 0,
          longitude: gd.longitude ?? 0,
          sortOrder: gd.sortOrder,
          startAt: gd.startAt,
          label: gd.label,
        };
      })
      .filter(
        (g) =>
          g.latitude !== 0 &&
          g.longitude !== 0 &&
          g.latitude != null &&
          g.longitude != null
      );

    if (groups.length < 2) {
      console.log(
        `[generateNoteRoutes] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} travelMode=${travelMode} groups=${groups.length} — not enough groups`
      );
      return {
        noteId,
        travelMode,
        segmentCount: 0,
        cacheHitCount: 0,
        generatedCount: 0,
        skippedCount: 0,
      };
    }

    // 7. 隣接ペアのセグメント一覧を構築
    const segmentPairs: Array<{ from: PlaceGroupData; to: PlaceGroupData }> = [];
    for (let i = 0; i < groups.length - 1; i++) {
      segmentPairs.push({ from: groups[i], to: groups[i + 1] });
    }

    // 8. 各セグメントを処理
    let cacheHitCount = 0;
    let generatedCount = 0;
    let skippedCount = 0;

    const apiKey = googleRoutesApiKey.value();
    const collectionPath = getRouteSegmentsCollectionPath(noteId);

    for (const { from, to } of segmentPairs) {
      const segmentId = buildRouteSegmentId({
        fromPlaceGroupId: from.id,
        toPlaceGroupId: to.id,
        travelMode,
      });
      const segRef = db.doc(`${collectionPath}/${segmentId}`);

      // キャッシュ確認
      if (!forceRefresh) {
        const existing = await segRef.get();
        if (existing.exists) {
          const existingData = existing.data() as Partial<RouteSegmentDoc>;
          const placeGroupVersionHash = `${from.id}:${from.latitude},${from.longitude}->${to.id}:${to.latitude},${to.longitude}`;
          const stale = isRouteSegmentStale({
            status: existingData.status,
            expiresAt: existingData.expiresAt ?? null,
            currentPlaceGroupVersionHash: placeGroupVersionHash,
            cachedPlaceGroupVersionHash: existingData.placeGroupVersionHash,
          });
          if (!stale) {
            cacheHitCount++;
            continue;
          }
        }
      }

      // Google Routes API 呼び出し
      try {
        const routeResult = await computeRouteSegment({
          apiKey,
          origin: { latitude: from.latitude, longitude: from.longitude },
          destination: { latitude: to.latitude, longitude: to.longitude },
          travelMode,
        });

        const decodedPolyline =
          routeResult.encodedPolyline
            ? decodePolyline(routeResult.encodedPolyline)
            : [];

        const placeGroupVersionHash = `${from.id}:${from.latitude},${from.longitude}->${to.id}:${to.latitude},${to.longitude}`;
        const apiRequestHash = `${travelMode}:${placeGroupVersionHash}`;

        const docData: Omit<RouteSegmentDoc, 'generatedAt' | 'updatedAt'> & {
          generatedAt: admin.firestore.FieldValue;
          updatedAt: admin.firestore.FieldValue;
          expiresAt: admin.firestore.Timestamp;
        } = {
          id: segmentId,
          noteId,
          fromPlaceGroupId: from.id,
          toPlaceGroupId: to.id,
          travelMode,
          provider: 'google_routes',
          fromLatitude: from.latitude,
          fromLongitude: from.longitude,
          toLatitude: to.latitude,
          toLongitude: to.longitude,
          distanceMeters: routeResult.distanceMeters,
          durationSeconds: routeResult.durationSeconds,
          encodedPolyline: routeResult.encodedPolyline,
          decodedPolyline,
          routeSummary: routeResult.routeSummary,
          warnings: routeResult.warnings ?? [],
          status: 'generated' as RouteSegmentStatus,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(calcRouteExpiresAt()),
          apiRequestHash,
          placeGroupVersionHash,
        };

        await segRef.set(docData);
        generatedCount++;
      } catch (err) {
        console.error(
          `[generateNoteRoutes] segment=${segmentId} failed:`,
          err instanceof Error ? err.message : String(err)
        );

        // 失敗してもセグメントレコードを残す（次回 stale として再生成を試みる）
        await segRef.set(
          {
            id: segmentId,
            noteId,
            fromPlaceGroupId: from.id,
            toPlaceGroupId: to.id,
            travelMode,
            provider: 'google_routes',
            fromLatitude: from.latitude,
            fromLongitude: from.longitude,
            toLatitude: to.latitude,
            toLongitude: to.longitude,
            status: 'failed' as RouteSegmentStatus,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        skippedCount++;
      }
    }

    console.log(
      `[generateNoteRoutes] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} travelMode=${travelMode} segmentCount=${segmentPairs.length} cacheHit=${cacheHitCount} generated=${generatedCount} skipped=${skippedCount}`
    );

    return {
      noteId,
      travelMode,
      segmentCount: segmentPairs.length,
      cacheHitCount,
      generatedCount,
      skippedCount,
    };
  }
);

// ── 2. getNoteRouteSegments ───────────────────────────────────────────────────

/**
 * ノートの Firestore キャッシュからルートセグメントを取得する。
 * viewer を含む全ノートメンバーが閲覧可能（生成はできない）。
 *
 * Phase 12.5H-4: Firestore read 本実装。
 * - travelMode 指定あり → travelMode でフィルタ
 * - travelMode 指定なし → 全セグメントを返す
 * - generatedAt 降順でソート
 */
export const getNoteRouteSegments = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (request): Promise<GetNoteRouteSegmentsResult> => {
    // 1. 認証チェック
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    const uid = request.auth.uid;

    // 2. input バリデーション
    const data = request.data as Partial<GetNoteRouteSegmentsInput>;

    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    // travelMode は任意だが、指定する場合は有効な値であること
    if (
      data.travelMode !== undefined &&
      !VALID_TRAVEL_MODES.includes(data.travelMode as PremiumRouteTravelMode)
    ) {
      throw new HttpsError('invalid-argument', 'travelMode が不正です（walking / driving / transit）');
    }

    const noteId = data.noteId.trim();
    const travelMode = data.travelMode as PremiumRouteTravelMode | undefined;

    const db = admin.firestore();

    // 3. ノートメンバー確認（viewer も閲覧可）
    await assertNoteMember(db, noteId, uid);

    // 4. route_segments を取得
    const collectionPath = getRouteSegmentsCollectionPath(noteId);
    let query: admin.firestore.Query = db.collection(collectionPath);

    // travelMode フィルタ
    if (travelMode) {
      query = query.where('travelMode', '==', travelMode);
    }

    // generatedAt 降順（新しいものが先）
    query = query.orderBy('generatedAt', 'desc');

    const segsSnap = await query.get();

    // 5. RouteSegmentSummary[] に変換
    const segments: RouteSegmentSummary[] = segsSnap.docs.map((d) => {
      const data = d.data() as Partial<RouteSegmentDoc>;
      return {
        id: d.id,
        fromPlaceGroupId: data.fromPlaceGroupId ?? '',
        toPlaceGroupId: data.toPlaceGroupId ?? '',
        distanceMeters: data.distanceMeters,
        durationSeconds: data.durationSeconds,
        decodedPolyline: data.decodedPolyline,
        status: data.status ?? 'failed',
      };
    });

    console.log(
      `[getNoteRouteSegments] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} travelMode=${travelMode ?? 'all'} count=${segments.length}`
    );

    return {
      noteId,
      travelMode: travelMode ?? 'walking', // travelMode 未指定時は walking をデフォルト値として返す
      segments,
    };
  }
);

// ── 3. deleteNoteRouteCache ───────────────────────────────────────────────────

/**
 * ノートの route_segments キャッシュを削除する。
 * owner/editor のみ削除可能。
 *
 * Phase 12.5H-4: Firestore batch delete 本実装。
 * - travelMode 指定あり → そのモードのセグメントのみ削除
 * - travelMode = 'all' または省略 → 全セグメントを削除
 *
 * TODO: 500件超えの場合は複数バッチに分割が必要（現状は件数が少ないため問題なし）。
 *       Firestore WriteBatch の上限は 500 オペレーション。
 *       将来的に件数が増えた場合は bulkWriter または分割バッチを使用すること。
 */
export const deleteNoteRouteCache = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (request): Promise<DeleteNoteRouteCacheResult> => {
    // 1. 認証チェック
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    const uid = request.auth.uid;

    // 2. input バリデーション
    const data = request.data as Partial<DeleteNoteRouteCacheInput>;

    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    const validDeleteModes = [...VALID_TRAVEL_MODES, 'all'] as const;
    // travelMode は任意。指定する場合は有効な値であること。
    if (
      data.travelMode !== undefined &&
      !validDeleteModes.includes(data.travelMode as typeof validDeleteModes[number])
    ) {
      throw new HttpsError('invalid-argument', 'travelMode が不正です（walking / driving / transit / all）');
    }

    const noteId = data.noteId.trim();
    const travelMode = data.travelMode as DeleteNoteRouteCacheInput['travelMode'] | undefined;

    const db = admin.firestore();

    // 3. owner/editor 権限確認
    await assertOwnerOrEditor(db, noteId, uid);

    // 4. route_segments を取得
    const collectionPath = getRouteSegmentsCollectionPath(noteId);
    let query: admin.firestore.Query = db.collection(collectionPath);

    // travelMode が指定されていて 'all' でなければフィルタ
    if (travelMode && travelMode !== 'all') {
      query = query.where('travelMode', '==', travelMode);
    }

    const segsSnap = await query.get();

    if (segsSnap.empty) {
      console.log(
        `[deleteNoteRouteCache] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} travelMode=${travelMode ?? 'all'} deletedCount=0 (empty)`
      );
      return { deletedCount: 0 };
    }

    // 5. batch delete
    // TODO: 500件超えの場合は複数バッチに分割すること（Firestore WriteBatch 上限 = 500 ops）。
    //       現状の route_segments 件数は (PlaceGroup数 - 1) × travelMode数（最大 ~30件）のため問題なし。
    const batch = db.batch();
    segsSnap.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();

    const deletedCount = segsSnap.size;

    console.log(
      `[deleteNoteRouteCache] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} travelMode=${travelMode ?? 'all'} deletedCount=${deletedCount}`
    );

    return { deletedCount };
  }
);
