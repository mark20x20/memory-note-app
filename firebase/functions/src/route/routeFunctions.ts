// Phase 12.5H-3: Google Routes API — Callable Functions skeleton
// Phase 12.5H-4: route_segments Firestore read/delete 本実装
//
// セキュリティ方針:
// - GOOGLE_ROUTES_API_KEY は Secret Manager の defineSecret() 経由でのみ参照する
// - Google Routes API 呼び出しはこのファイル（Cloud Functions）からのみ行う
// - 座標・ルート情報はログに出力しない
// - uid はログに末尾4文字のみ出力する
//
// Phase 12.5H-4 実装状態:
//   - generateNoteRoutes: auth/validation/権限確認まで実装、API 本呼び出し未実装
//   - getNoteRouteSegments: Firestore read 本実装
//   - deleteNoteRouteCache: Firestore batch delete 本実装

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
} from './types';
import { getRouteSegmentsCollectionPath } from './routeCache';

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

// ── 1. generateNoteRoutes ─────────────────────────────────────────────────────

/**
 * ノートの PlaceGroup 間のルートを Google Routes API で生成し、
 * Firestore の route_segments サブコレクションにキャッシュする。
 *
 * Phase 12.5H-3/H-4: skeleton のみ。
 * - auth チェック・バリデーション・権限確認までは実装済み
 * - Premium 判定・Routes API 本呼び出し・Firestore 保存は未実装
 * - 0件の skeleton 結果を返す
 *
 * Phase 12.5H-5 で以下を実装する:
 * - PlaceGroup を sortOrder 昇順で取得
 * - 隣接 PlaceGroup ペアでセグメント一覧を構築
 * - キャッシュ確認（isRouteSegmentStale）
 * - computeRouteSegment で Google Routes API 呼び出し
 * - RouteSegmentDoc を Firestore に保存（expiresAt = 30日後）
 */
export const generateNoteRoutes = onCall(
  {
    region: REGION,
    secrets: [googleRoutesApiKey],
    memory: '256MiB',
    timeoutSeconds: 60,
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

    const db = admin.firestore();

    // 3. ノート取得 + owner/editor 権限確認
    await assertOwnerOrEditor(db, noteId, uid);

    // 4. TODO Phase 12.5H-5: Premium 判定を本実装に差し替える。
    //    現在は isPremiumUser = false のハードコードのため、
    //    このフェーズでは skeleton として続行する（実生成はしない）。
    //
    //    将来の実装例:
    //    const isPremiumUser = await checkPremiumStatus(uid);
    //    if (!isPremiumUser) {
    //      throw new HttpsError('permission-denied', 'ルート生成はプレミアムプランのみ利用可能です');
    //    }

    // 5. TODO Phase 12.5H-5: ルート生成回数クォータチェックを実装する。
    //    1日 10回 / forceRefresh は 1日 3回の上限を設ける。
    //    await assertRouteGenerationQuota(db, uid, forceRefresh);

    // 6. TODO Phase 12.5H-5: 以下を実装する。
    //    a. PlaceGroup を sortOrder 昇順で取得
    //       const groupsSnap = await db
    //         .collection(`memory_notes/${noteId}/place_groups`)
    //         .orderBy('sortOrder', 'asc')
    //         .get();
    //    b. 有効座標を持つグループのみ抽出
    //       const groups = groupsSnap.docs
    //         .map(d => ({ id: d.id, ...d.data() }))
    //         .filter(g => g.latitude && g.longitude && g.latitude !== 0 && g.longitude !== 0);
    //    c. 隣接ペアのセグメント一覧を構築
    //       const segments = [];
    //       for (let i = 0; i < groups.length - 1; i++) {
    //         segments.push({ from: groups[i], to: groups[i + 1] });
    //       }
    //    d. 各セグメントについて:
    //       - buildRouteSegmentId で segmentId を生成
    //       - forceRefresh=false なら Firestore キャッシュ確認（isRouteSegmentStale）
    //       - キャッシュなし → computeRouteSegment で Google Routes API 呼び出し
    //       - デコード: decodePolyline(encodedPolyline)
    //       - Firestore に RouteSegmentDoc として set（expiresAt = calcRouteExpiresAt(new Date(), 30)）
    //    e. 生成回数カウンタ更新
    //       await incrementRouteGenerationUsage(db, uid);

    // Phase 12.5H-4 skeleton: Routes API 本呼び出しは未実装。
    // 0件の結果を返す。
    console.log(
      `[generateNoteRoutes] skeleton only — noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} travelMode=${travelMode} forceRefresh=${forceRefresh}`
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
