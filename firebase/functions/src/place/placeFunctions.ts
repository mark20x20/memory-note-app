// Phase 12.5C: Place Intelligence Cloud Functions
//
// セキュリティ方針:
// - GOOGLE_PLACES_API_KEY は Secret Manager の defineSecret() 経由でのみ参照する
// - Google Places API 呼び出しはこのファイル（Cloud Functions）からのみ行う
// - 座標・場所名・住所はログに出力しない
// - uid はログに末尾4文字のみ出力する

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

import { searchNearbyPlaces } from './placesClient';
import { calculatePreliminaryConfidence, mapToPlaceCategory } from './placeScoring';
import {
  extractGpsPhotos,
  groupNearbyLocations,
  groupPhotosByTimeAndDistance,
  haversineDistance,
  isCacheValid,
  isFoodRelatedNote,
} from './placeUtils';
import type { GooglePlace, PhotoData, PlaceCategory, PlaceGroupSource, PlaceGroupDoc } from './types';

// ── 定数 ─────────────────────────────────────────────────────────────────────

/** 1 PlaceGroup に保存する候補の最大件数 */
const MAX_SAVED_CANDIDATES = 20;

/**
 * 飲食系検索に使用する includedTypes。
 * 将来候補: bar, bakery, meal_takeaway など（API サポート状況を確認してから追加）
 */
const FOOD_INCLUDED_TYPES = ['restaurant', 'cafe'];

// ── Secret Manager ────────────────────────────────────────────────────────────

export const googlePlacesApiKey = defineSecret('GOOGLE_PLACES_API_KEY');

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
 * ノートに紐づく全 PlaceGroupDoc を取得して visitedPlacesSummary を再計算し、NoteDoc を更新する。
 */
async function recalculateVisitedPlacesSummary(
  db: admin.firestore.Firestore,
  noteId: string
): Promise<void> {
  const groupsSnap = await db.collection(`memory_notes/${noteId}/place_groups`).get();
  const groups = groupsSnap.docs.map((d) => d.data() as Partial<PlaceGroupDoc>);

  const confirmedGroups = groups.filter((g) => g.userConfirmed === true);
  const topPlaceLabels = confirmedGroups
    .map((g) => g.label ?? '')
    .filter(Boolean)
    .slice(0, 3);

  await db.doc(`memory_notes/${noteId}`).update({
    visitedPlacesSummary: {
      confirmedCount: confirmedGroups.length,
      totalGroupCount: groups.length,
      topPlaceLabels,
      // areaLabel: 未実装（Phase 12.5E 以降で追加）
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ── 検索ヘルパー ──────────────────────────────────────────────────────────────

/**
 * providerPlaceId（place.id）で重複排除して結合する。
 * primary が優先される（先に追加されるため）。
 */
function mergeDedupe(primary: GooglePlace[], secondary: GooglePlace[]): GooglePlace[] {
  const seen = new Set<string>();
  const result: GooglePlace[] = [];
  for (const p of [...primary, ...secondary]) {
    const key = p.id ?? '';
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    result.push(p);
  }
  return result;
}

/**
 * 1 PlaceGroup の Nearby Search を実行し、重複排除済み GooglePlace 配列を返す。
 *
 * food-related の場合:
 *   1. restaurant/cafe に絞った Nearby Search（200m）
 *   2. general Nearby Search（200m）
 *   3. providerPlaceId で重複排除して統合
 *   [COST NOTE] 2 API calls / PlaceGroup（最大 5 グループ × 2 = 最大 10 calls / note）
 *
 * food-related でない場合:
 *   1. general Nearby Search（200m）
 *   2. 0件なら 500m で再試行
 *
 * どちらの場合も 0件なら general 500m fallback を実行する。
 */
async function searchPlacesForGroup(
  apiKey: string,
  lat: number,
  lng: number,
  isFoodRelated: boolean
): Promise<GooglePlace[]> {
  if (isFoodRelated) {
    const [foodPlaces, generalPlaces] = await Promise.all([
      searchNearbyPlaces(apiKey, lat, lng, 200, FOOD_INCLUDED_TYPES),
      searchNearbyPlaces(apiKey, lat, lng, 200),
    ]);
    const merged = mergeDedupe(foodPlaces, generalPlaces);
    if (merged.length > 0) return merged;
    // food + general どちらも 0件 → 500m general fallback
    return searchNearbyPlaces(apiKey, lat, lng, 500);
  } else {
    let places = await searchNearbyPlaces(apiKey, lat, lng, 200);
    if (places.length === 0) {
      places = await searchNearbyPlaces(apiKey, lat, lng, 500);
    }
    return places;
  }
}

/**
 * 1グループの候補を Places API から取得して candidates サブコレクションに保存する。
 * - isFoodRelated=true の場合: restaurant/cafe Nearby + general Nearby を統合（最大2コール）
 * - isFoodRelated=false の場合: general Nearby のみ（0件なら500mで再試行）
 * - 既存 candidates を削除してから保存する（forceRefresh 相当）。
 * - 候補は distanceMeters 昇順でソートして最大 MAX_SAVED_CANDIDATES 件保存する。
 */
async function fetchAndSaveCandidates(
  db: admin.firestore.Firestore,
  apiKey: string,
  noteId: string,
  placeGroupId: string,
  groupLat: number,
  groupLng: number,
  isFoodRelated = false
): Promise<Array<{ id: string; name: string; category: string; distanceMeters: number; confidence: number }>> {
  // Places API 呼び出し（food-related なら food+general の2コール、それ以外は1コール）
  const places = await searchPlacesForGroup(apiKey, groupLat, groupLng, isFoodRelated);

  if (places.length === 0) {
    return [];
  }

  // スコアリング
  const scored = places.map((place) => {
    const loc = place.location;
    const distMeters = loc
      ? haversineDistance(groupLat, groupLng, loc.latitude, loc.longitude)
      : 999;
    const types = place.types ?? [];
    const confidence = calculatePreliminaryConfidence(distMeters, types, place.rating);
    return { place, distMeters, confidence };
  });

  // distanceMeters 昇順ソート。confidence は tie-breaker のみ
  scored.sort((a, b) => {
    if (a.distMeters !== b.distMeters) return a.distMeters - b.distMeters;
    return b.confidence - a.confidence;
  });
  const topCandidates = scored.slice(0, MAX_SAVED_CANDIDATES);

  // 既存 candidates を削除
  const candidatesRef = db.collection(
    `memory_notes/${noteId}/place_groups/${placeGroupId}/candidates`
  );
  const existingSnap = await candidatesRef.get();
  await Promise.all(existingSnap.docs.map((d) => d.ref.delete()));

  // Firestore に保存
  const savedIds = await Promise.all(
    topCandidates.map(({ place, distMeters, confidence }) => {
      const data: Record<string, unknown> = {
        provider: 'google',
        name: place.displayName?.text ?? '',
        types: place.types ?? [],
        latitude: place.location?.latitude ?? groupLat,
        longitude: place.location?.longitude ?? groupLng,
        distanceMeters: distMeters,
        confidence,
        source: 'places_api',
        fetchedAt: admin.firestore.Timestamp.now(),
      };
      if (place.id) data.providerPlaceId = place.id;
      if (place.formattedAddress) data.address = place.formattedAddress;
      if (place.rating != null) data.rating = place.rating;
      return candidatesRef.add(data).then((ref) => ref.id);
    })
  );

  return topCandidates.map(({ place, distMeters, confidence }, i) => ({
    id: savedIds[i],
    name: place.displayName?.text ?? '',
    category: mapToPlaceCategory(place.types ?? []),
    distanceMeters: distMeters,
    confidence,
  }));
}

// ── 1. enrichNotePlaces ───────────────────────────────────────────────────────

/**
 * ノート全体の写真 GPS から場所グループを作成し、候補を取得して Firestore に保存する。
 *
 * - owner / editor のみ実行可能
 * - 同時実行防止: status=fetching なら already-exists エラー
 * - forceRefresh: false かつ 24時間以内の completed なら早期リターン
 * - 最大 5 グループまで処理
 * - food-related ノートでは restaurant/cafe Nearby + general Nearby を統合（最大2コール/グループ）
 * - それ以外は general Nearby のみ（最大1コール/グループ）
 */
export const enrichNotePlaces = onCall(
  { region: 'asia-northeast1', secrets: [googlePlacesApiKey] },
  async (request) => {
    // 1. 認証チェック
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    const uid = request.auth.uid;

    // 2. バリデーション
    const data = request.data as {
      noteId?: unknown;
      forceRefresh?: unknown;
      grouping?: { timeGapMinutes?: unknown; distanceGapMeters?: unknown };
    };
    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    const noteId = data.noteId.trim();
    const forceRefresh = data.forceRefresh === true;

    // Phase 12.5G-2: grouping パラメータを読み取り、安全な範囲に clamp する
    // timeGapMinutes: 15〜360, distanceGapMeters: 20〜500
    const rawGrouping = data.grouping;
    const timeGapMinutes = rawGrouping?.timeGapMinutes != null && typeof rawGrouping.timeGapMinutes === 'number'
      ? Math.min(360, Math.max(15, rawGrouping.timeGapMinutes))
      : 90;
    const distanceGapMeters = rawGrouping?.distanceGapMeters != null && typeof rawGrouping.distanceGapMeters === 'number'
      ? Math.min(500, Math.max(20, rawGrouping.distanceGapMeters))
      : 80;
    const groupingOptions = {
      timeGapMs: timeGapMinutes * 60 * 1000,
      distanceGapMeters,
    };

    const db = admin.firestore();
    const noteSnap = await assertOwnerOrEditor(db, noteId, uid);
    const noteData = noteSnap.data()!;
    const noteRef = db.doc(`memory_notes/${noteId}`);

    // 3. 二重実行防止
    if (noteData.placeEnrichmentStatus === 'fetching') {
      throw new HttpsError('already-exists', '場所取得が進行中です。しばらくお待ちください');
    }

    // 4. キャッシュチェック（forceRefresh: false の場合）
    if (!forceRefresh && noteData.placeEnrichmentStatus === 'completed') {
      const updatedAt = noteData.placeEnrichmentUpdatedAt as
        | admin.firestore.Timestamp
        | null
        | undefined;
      if (updatedAt && isCacheValid(updatedAt.toDate())) {
        const groupsSnap = await db.collection(`memory_notes/${noteId}/place_groups`).get();
        console.log(
          `[enrichNotePlaces] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} status=cached groups=${groupsSnap.size}`
        );
        return {
          success: true,
          placeGroupsCreated: groupsSnap.size,
          status: 'completed',
          message: 'キャッシュから返しました',
        };
      }
    }

    // 5. status を fetching に更新
    await noteRef.update({
      placeEnrichmentStatus: 'fetching',
      placeEnrichmentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      // 6. 写真一覧を取得
      const photosSnap = await db
        .collection(`memory_notes/${noteId}/photos`)
        .get();

      const photos: PhotoData[] = photosSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PhotoData, 'id'>),
      }));

      const gpsPhotos = extractGpsPhotos(photos);

      // 7. GPS なし → 早期完了
      if (gpsPhotos.length === 0) {
        await noteRef.update({
          placeEnrichmentStatus: 'completed',
          placeEnrichmentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          visitedPlacesSummary: {
            confirmedCount: 0,
            totalGroupCount: 0,
            topPlaceLabels: [],
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(
          `[enrichNotePlaces] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} status=no_gps_data`
        );
        return {
          success: true,
          placeGroupsCreated: 0,
          status: 'no_gps_data',
          message: 'GPS情報のある写真がありませんでした',
        };
      }

      // 8. GPS 写真を時刻 + 距離でイベント分割（最大 MAX_PLACE_GROUPS 件）
      // Phase 12.5G-1: groupNearbyLocations から groupPhotosByTimeAndDistance に変更
      // Phase 12.5G-2: groupingOptions でしきい値を指定可能
      const localGroups = groupPhotosByTimeAndDistance(gpsPhotos, groupingOptions);
      console.log(
        `[enrichNotePlaces] noteId=${noteId.slice(0, 8)} eventGroups=${localGroups.length} timeGapMin=${timeGapMinutes} distGapM=${distanceGapMeters}`
      );

      // 9. APIキー取得
      const apiKey = googlePlacesApiKey.value();
      if (!apiKey) {
        throw new Error('GOOGLE_PLACES_API_KEY が設定されていません');
      }

      // 10. forceRefresh の場合は既存 place_groups を削除
      const placeGroupsRef = db.collection(`memory_notes/${noteId}/place_groups`);
      if (forceRefresh) {
        const existingSnap = await placeGroupsRef.get();
        await Promise.all(existingSnap.docs.map((d) => d.ref.delete()));
      }

      let placeGroupsCreated = 0;

      // 11. food-related 判定（noteType / title / memo のヒューリスティック）
      const isFoodRelated = isFoodRelatedNote({
        title: noteData.title,
        memo: noteData.memo,
        noteType: noteData.noteType,
      });
      console.log(
        `[enrichNotePlaces] noteId=${noteId.slice(0, 8)} isFoodRelated=${isFoodRelated} strategy=${isFoodRelated ? 'food+general' : 'general'}`
      );

      // 12. グループごとに Places API を呼び出して PlaceGroupDoc + candidates を保存
      for (const localGroup of localGroups) {
        // Places API で候補取得（food-related なら restaurant/cafe + general を統合）
        const places = await searchPlacesForGroup(apiKey, localGroup.latitude, localGroup.longitude, isFoodRelated);

        // 候補スコアリング
        const scored = places.map((place) => {
          const loc = place.location;
          const distMeters = loc
            ? haversineDistance(localGroup.latitude, localGroup.longitude, loc.latitude, loc.longitude)
            : 999;
          const types = place.types ?? [];
          const confidence = calculatePreliminaryConfidence(distMeters, types, place.rating);
          return { place, distMeters, confidence };
        });
        // distanceMeters 昇順ソート。confidence は tie-breaker のみ
        scored.sort((a, b) => {
          if (a.distMeters !== b.distMeters) return a.distMeters - b.distMeters;
          return b.confidence - a.confidence;
        });
        const topCandidates = scored.slice(0, MAX_SAVED_CANDIDATES);

        // PlaceGroupDoc のラベル・カテゴリ・confidence は最上位候補（最近傍）から設定
        let label = '場所不明';
        let category: PlaceCategory = 'unknown';
        let topConfidence = 0;
        let topProviderPlaceId: string | undefined;
        const source: PlaceGroupSource = topCandidates.length > 0 ? 'places_api' : 'gps';

        if (topCandidates.length > 0) {
          const top = topCandidates[0];
          label = top.place.displayName?.text ?? '場所不明';
          category = mapToPlaceCategory(top.place.types ?? []);
          topConfidence = top.confidence;
          topProviderPlaceId = top.place.id;
        }

        // PlaceGroupDoc を作成（userConfirmed=false を維持）
        const groupDocData: Record<string, unknown> = {
          noteId,
          latitude: localGroup.latitude,
          longitude: localGroup.longitude,
          label,
          category,
          photoIds: localGroup.photoIds,
          photoCount: localGroup.photoCount,
          coverPhotoURL: localGroup.coverPhotoURL ?? null,
          confidence: topConfidence,
          userConfirmed: false,
          source,
          // Phase 12.5G-1: 訪問イベント時刻・順序
          sortOrder: localGroup.sortOrder ?? 0,
          startAt: localGroup.startAt
            ? admin.firestore.Timestamp.fromDate(localGroup.startAt)
            : null,
          endAt: localGroup.endAt
            ? admin.firestore.Timestamp.fromDate(localGroup.endAt)
            : null,
          // Phase 12.5G-2: 写真プレビューURL（最大3枚）
          photoPreviewURLs: localGroup.photoPreviewURLs ?? [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (topProviderPlaceId) {
          groupDocData.selectedProviderPlaceId = topProviderPlaceId;
        }

        const groupRef = await placeGroupsRef.add(groupDocData);
        placeGroupsCreated++;

        // candidates サブコレクションに保存（最大 MAX_SAVED_CANDIDATES 件、distanceMeters 昇順）
        const candidatesRef = groupRef.collection('candidates');
        await Promise.all(
          topCandidates.map(({ place, distMeters, confidence }) => {
            const candidateData: Record<string, unknown> = {
              provider: 'google',
              name: place.displayName?.text ?? '',
              types: place.types ?? [],
              latitude: place.location?.latitude ?? localGroup.latitude,
              longitude: place.location?.longitude ?? localGroup.longitude,
              distanceMeters: distMeters,
              confidence,
              source: 'places_api',
              fetchedAt: admin.firestore.Timestamp.now(),
            };
            if (place.id) candidateData.providerPlaceId = place.id;
            if (place.formattedAddress) candidateData.address = place.formattedAddress;
            if (place.rating != null) candidateData.rating = place.rating;
            return candidatesRef.add(candidateData);
          })
        );
      }

      // 12. visitedPlacesSummary を更新
      await recalculateVisitedPlacesSummary(db, noteId);

      // 13. status を completed に更新
      await noteRef.update({
        placeEnrichmentStatus: 'completed',
        placeEnrichmentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `[enrichNotePlaces] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} groups=${placeGroupsCreated} status=completed`
      );

      return {
        success: true,
        placeGroupsCreated,
        status: 'completed',
      };
    } catch (e) {
      // 失敗時: status を failed に更新してエラーを返す
      console.error(
        `[enrichNotePlaces] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} status=failed`
      );
      await noteRef.update({
        placeEnrichmentStatus: 'failed',
        placeEnrichmentError: '場所情報の取得に失敗しました。もう一度お試しください',
        placeEnrichmentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      if (e instanceof HttpsError) throw e;
      throw new HttpsError('internal', '場所情報の取得に失敗しました');
    }
  }
);

// ── 2. getPlaceCandidatesForGroup ─────────────────────────────────────────────

/**
 * 特定の PlaceGroup に対して候補を取得して返す。
 * 24時間以内のキャッシュがある場合は再取得せず cacheHit=true で返す。
 */
export const getPlaceCandidatesForGroup = onCall(
  { region: 'asia-northeast1', secrets: [googlePlacesApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    const uid = request.auth.uid;

    const data = request.data as {
      noteId?: unknown;
      placeGroupId?: unknown;
      forceRefresh?: unknown;
    };
    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    if (typeof data.placeGroupId !== 'string' || !data.placeGroupId.trim()) {
      throw new HttpsError('invalid-argument', 'placeGroupId が不正です');
    }
    const noteId = data.noteId.trim();
    const placeGroupId = data.placeGroupId.trim();
    const forceRefresh = data.forceRefresh === true;

    const db = admin.firestore();
    const noteSnap = await assertOwnerOrEditor(db, noteId, uid);
    const noteData = noteSnap.data()!;
    const isFoodRelated = isFoodRelatedNote({
      title: noteData.title,
      memo: noteData.memo,
      noteType: noteData.noteType,
    });

    // PlaceGroup を取得
    const groupSnap = await db.doc(`memory_notes/${noteId}/place_groups/${placeGroupId}`).get();
    if (!groupSnap.exists) {
      throw new HttpsError('not-found', 'PlaceGroup が見つかりません');
    }
    const groupData = groupSnap.data()!;

    // 既存 candidates を取得してキャッシュ確認（distanceMeters 昇順 — 近い順）
    const candidatesSnap = await db
      .collection(`memory_notes/${noteId}/place_groups/${placeGroupId}/candidates`)
      .orderBy('distanceMeters', 'asc')
      .get();

    if (!forceRefresh && !candidatesSnap.empty) {
      const firstFetchedAt = candidatesSnap.docs[0].data().fetchedAt as
        | admin.firestore.Timestamp
        | undefined;
      if (firstFetchedAt && isCacheValid(firstFetchedAt.toDate())) {
        const candidates = candidatesSnap.docs.map((d) => {
          const cd = d.data();
          return {
            id: d.id,
            name: cd.name as string,
            category: mapToPlaceCategory((cd.types as string[]) ?? []),
            distanceMeters: cd.distanceMeters as number | undefined,
            confidence: cd.confidence as number | undefined,
          };
        });
        console.log(
          `[getPlaceCandidatesForGroup] cacheHit=true candidatesCount=${candidates.length}`
        );
        return { candidates, cacheHit: true };
      }
    }

    // Places API を呼び出す
    const apiKey = googlePlacesApiKey.value();
    if (!apiKey) throw new HttpsError('internal', 'GOOGLE_PLACES_API_KEY が設定されていません');

    const groupLat = groupData.latitude as number;
    const groupLng = groupData.longitude as number;

    let freshCandidates: Awaited<ReturnType<typeof fetchAndSaveCandidates>>;
    try {
      freshCandidates = await fetchAndSaveCandidates(
        db,
        apiKey,
        noteId,
        placeGroupId,
        groupLat,
        groupLng,
        isFoodRelated
      );
    } catch (e) {
      console.error(`[getPlaceCandidatesForGroup] Places API error`);
      throw new HttpsError('unavailable', 'Places API の呼び出しに失敗しました');
    }

    console.log(
      `[getPlaceCandidatesForGroup] cacheHit=false candidatesCount=${freshCandidates.length} isFoodRelated=${isFoodRelated}`
    );

    return {
      candidates: freshCandidates,
      cacheHit: false,
    };
  }
);

// ── 3. refreshPlaceCandidates ─────────────────────────────────────────────────

/**
 * 候補を強制再取得する。内部的には fetchAndSaveCandidates を直接呼ぶ。
 * TODO (Phase 12.5D): 1グループあたり1日3回のレート制限を追加する。
 */
export const refreshPlaceCandidates = onCall(
  { region: 'asia-northeast1', secrets: [googlePlacesApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    const uid = request.auth.uid;

    const data = request.data as { noteId?: unknown; placeGroupId?: unknown };
    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    if (typeof data.placeGroupId !== 'string' || !data.placeGroupId.trim()) {
      throw new HttpsError('invalid-argument', 'placeGroupId が不正です');
    }
    const noteId = data.noteId.trim();
    const placeGroupId = data.placeGroupId.trim();

    const db = admin.firestore();
    const noteSnap = await assertOwnerOrEditor(db, noteId, uid);
    const noteData = noteSnap.data()!;
    const isFoodRelated = isFoodRelatedNote({
      title: noteData.title,
      memo: noteData.memo,
      noteType: noteData.noteType,
    });

    const groupSnap = await db.doc(`memory_notes/${noteId}/place_groups/${placeGroupId}`).get();
    if (!groupSnap.exists) {
      throw new HttpsError('not-found', 'PlaceGroup が見つかりません');
    }
    const groupData = groupSnap.data()!;

    const apiKey = googlePlacesApiKey.value();
    if (!apiKey) throw new HttpsError('internal', 'GOOGLE_PLACES_API_KEY が設定されていません');

    let freshCandidates: Awaited<ReturnType<typeof fetchAndSaveCandidates>>;
    try {
      freshCandidates = await fetchAndSaveCandidates(
        db,
        apiKey,
        noteId,
        placeGroupId,
        groupData.latitude as number,
        groupData.longitude as number,
        isFoodRelated
      );
    } catch (e) {
      console.error(`[refreshPlaceCandidates] Places API error`);
      throw new HttpsError('unavailable', 'Places API の呼び出しに失敗しました');
    }

    console.log(
      `[refreshPlaceCandidates] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} candidatesCount=${freshCandidates.length} isFoodRelated=${isFoodRelated}`
    );

    return {
      candidatesCount: freshCandidates.length,
      refreshedAt: new Date().toISOString(),
    };
  }
);

// ── 4. selectPlaceCandidate ───────────────────────────────────────────────────

/**
 * ユーザーが候補を選択して PlaceGroup を確定する。
 * 選択後 visitedPlacesSummary を再計算する。
 */
export const selectPlaceCandidate = onCall(
  { region: 'asia-northeast1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    const uid = request.auth.uid;

    const data = request.data as {
      noteId?: unknown;
      placeGroupId?: unknown;
      candidateId?: unknown;
    };
    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    if (typeof data.placeGroupId !== 'string' || !data.placeGroupId.trim()) {
      throw new HttpsError('invalid-argument', 'placeGroupId が不正です');
    }
    if (typeof data.candidateId !== 'string' || !data.candidateId.trim()) {
      throw new HttpsError('invalid-argument', 'candidateId が不正です');
    }
    const noteId = data.noteId.trim();
    const placeGroupId = data.placeGroupId.trim();
    const candidateId = data.candidateId.trim();

    const db = admin.firestore();
    await assertOwnerOrEditor(db, noteId, uid);

    // PlaceGroup の存在確認
    const groupRef = db.doc(`memory_notes/${noteId}/place_groups/${placeGroupId}`);
    const groupSnap = await groupRef.get();
    if (!groupSnap.exists) {
      throw new HttpsError('not-found', 'PlaceGroup が見つかりません');
    }

    // candidate の取得
    const candidateRef = db.doc(
      `memory_notes/${noteId}/place_groups/${placeGroupId}/candidates/${candidateId}`
    );
    const candidateSnap = await candidateRef.get();
    if (!candidateSnap.exists) {
      throw new HttpsError('not-found', '候補が見つかりません');
    }
    const candidateData = candidateSnap.data()!;

    const updatedLabel = candidateData.name as string;
    const updatedCategory = mapToPlaceCategory((candidateData.types as string[]) ?? []);

    // PlaceGroup を更新
    const groupUpdate: Record<string, unknown> = {
      selectedCandidateId: candidateId,
      label: updatedLabel,
      category: updatedCategory,
      confidence: candidateData.confidence ?? 0,
      userConfirmed: true,
      source: 'places_api',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (candidateData.providerPlaceId) {
      groupUpdate.selectedProviderPlaceId = candidateData.providerPlaceId;
    }
    await groupRef.update(groupUpdate);

    // visitedPlacesSummary を再計算
    await recalculateVisitedPlacesSummary(db, noteId);

    console.log(
      `[selectPlaceCandidate] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} placeGroupId=${placeGroupId.slice(0, 8)}`
    );

    return {
      success: true,
      updatedLabel,
      updatedCategory,
    };
  }
);

// ── 5. updatePlaceGroupManually ───────────────────────────────────────────────

const VALID_CATEGORIES: PlaceCategory[] = [
  'restaurant', 'cafe', 'tourist_attraction', 'station',
  'hotel', 'shopping', 'park', 'museum', 'area', 'unknown',
];

/**
 * ユーザーが場所名・カテゴリを手動入力で設定する。
 * 候補から選ばなかった場合や候補がない場合に使用する。
 */
export const updatePlaceGroupManually = onCall(
  { region: 'asia-northeast1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '認証が必要です');
    }
    const uid = request.auth.uid;

    const data = request.data as {
      noteId?: unknown;
      placeGroupId?: unknown;
      label?: unknown;
      category?: unknown;
      eventMemo?: unknown;
    };
    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    if (typeof data.placeGroupId !== 'string' || !data.placeGroupId.trim()) {
      throw new HttpsError('invalid-argument', 'placeGroupId が不正です');
    }
    const noteId = data.noteId.trim();
    const placeGroupId = data.placeGroupId.trim();

    // Phase 12.5G-3: eventMemo のみの更新パス（label が省略可能になった）
    const hasLabel = data.label !== undefined && data.label !== null;
    const hasEventMemo = data.eventMemo !== undefined;

    if (!hasLabel && !hasEventMemo) {
      throw new HttpsError('invalid-argument', 'label または eventMemo のいずれかが必要です');
    }

    const db = admin.firestore();
    await assertOwnerOrEditor(db, noteId, uid);

    const groupRef = db.doc(`memory_notes/${noteId}/place_groups/${placeGroupId}`);
    const groupSnap = await groupRef.get();
    if (!groupSnap.exists) {
      throw new HttpsError('not-found', 'PlaceGroup が見つかりません');
    }

    const groupUpdate: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // label/category を更新する場合（手動場所入力）
    if (hasLabel) {
      if (typeof data.label !== 'string') {
        throw new HttpsError('invalid-argument', 'label が不正です');
      }
      const label = data.label.trim();
      if (label.length === 0 || label.length > 50) {
        throw new HttpsError('invalid-argument', 'label は1〜50文字で入力してください');
      }

      let category: PlaceCategory = 'unknown';
      if (data.category !== undefined && data.category !== null) {
        if (typeof data.category !== 'string' || !VALID_CATEGORIES.includes(data.category as PlaceCategory)) {
          throw new HttpsError('invalid-argument', '不正な category です');
        }
        category = data.category as PlaceCategory;
      }

      groupUpdate.userEditedLabel = label;
      groupUpdate.label = label;
      groupUpdate.category = category;
      groupUpdate.userConfirmed = true;
      groupUpdate.source = 'manual' as PlaceGroupSource;
      groupUpdate.selectedCandidateId = admin.firestore.FieldValue.delete();
      groupUpdate.selectedProviderPlaceId = admin.firestore.FieldValue.delete();
    }

    // Phase 12.5G-3: eventMemo 更新（userConfirmed に影響しない）
    if (hasEventMemo) {
      const memo = data.eventMemo;
      if (memo !== null && typeof memo !== 'string') {
        throw new HttpsError('invalid-argument', 'eventMemo は文字列か null である必要があります');
      }
      if (typeof memo === 'string' && memo.length > 200) {
        throw new HttpsError('invalid-argument', 'eventMemo は200文字以内で入力してください');
      }
      groupUpdate.eventMemo = memo ?? null;
    }

    await groupRef.update(groupUpdate);

    // visitedPlacesSummary を再計算（label 更新時のみ）
    if (hasLabel) {
      await recalculateVisitedPlacesSummary(db, noteId);
    }

    console.log(
      `[updatePlaceGroupManually] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} placeGroupId=${placeGroupId.slice(0, 8)} hasLabel=${hasLabel} hasEventMemo=${hasEventMemo}`
    );

    return { success: true };
  }
);
