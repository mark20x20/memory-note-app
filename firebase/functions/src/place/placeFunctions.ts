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
  haversineDistance,
  isCacheValid,
} from './placeUtils';
import type { PhotoData, PlaceCategory, PlaceGroupSource, PlaceGroupDoc } from './types';

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

/**
 * 1グループの候補を Places API から取得して candidates サブコレクションに保存する。
 * - 半径 200m で検索。0件なら 500m で再試行。
 * - 既存 candidates を削除してから保存する（forceRefresh 相当）。
 * - 候補は confidence 降順でソートして上位10件保存する。
 */
async function fetchAndSaveCandidates(
  db: admin.firestore.Firestore,
  apiKey: string,
  noteId: string,
  placeGroupId: string,
  groupLat: number,
  groupLng: number
): Promise<Array<{ id: string; name: string; category: string; distanceMeters: number; confidence: number }>> {
  // Google Places API 呼び出し (200m, 0件なら500mで再試行)
  let places = await searchNearbyPlaces(apiKey, groupLat, groupLng, 200);
  if (places.length === 0) {
    places = await searchNearbyPlaces(apiKey, groupLat, groupLng, 500);
  }

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

  // distanceMeters 昇順ソート → 上位10件
  // confidence は表示用の参考値として残すが、ソートには使わない（距離が同じ場合のみ tie-breaker）
  scored.sort((a, b) => {
    const dA = a.distMeters;
    const dB = b.distMeters;
    if (dA !== dB) return dA - dB;
    return b.confidence - a.confidence;
  });
  const top5 = scored.slice(0, 10);

  // 既存 candidates を削除
  const candidatesRef = db.collection(
    `memory_notes/${noteId}/place_groups/${placeGroupId}/candidates`
  );
  const existingSnap = await candidatesRef.get();
  await Promise.all(existingSnap.docs.map((d) => d.ref.delete()));

  // Firestore に保存
  const savedIds = await Promise.all(
    top5.map(({ place, distMeters, confidence }) => {
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

  return top5.map(({ place, distMeters, confidence }, i) => ({
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
 * - 最大 5 グループまで処理（1グループ = 1 Places API リクエスト）
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
    const data = request.data as { noteId?: unknown; forceRefresh?: unknown };
    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    const noteId = data.noteId.trim();
    const forceRefresh = data.forceRefresh === true;

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

      // 8. GPS 写真をグループ化（最大 MAX_PLACE_GROUPS 件）
      const localGroups = groupNearbyLocations(gpsPhotos);

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

      // 11. グループごとに Places API を呼び出して PlaceGroupDoc + candidates を保存
      for (const localGroup of localGroups) {
        // Places API で候補取得
        let places = await searchNearbyPlaces(apiKey, localGroup.latitude, localGroup.longitude, 200);
        if (places.length === 0) {
          places = await searchNearbyPlaces(apiKey, localGroup.latitude, localGroup.longitude, 500);
        }

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
        // distanceMeters 昇順ソート → 上位10件
        // confidence は表示用の参考値として残すが、ソートには使わない（距離が同じ場合のみ tie-breaker）
        scored.sort((a, b) => {
          const dA = a.distMeters;
          const dB = b.distMeters;
          if (dA !== dB) return dA - dB;
          return b.confidence - a.confidence;
        });
        const top5 = scored.slice(0, 10);

        // PlaceGroupDoc のラベル・カテゴリ・confidence は最上位候補（最近傍）から設定
        let label = '場所不明';
        let category: PlaceCategory = 'unknown';
        let topConfidence = 0;
        let topProviderPlaceId: string | undefined;
        const source: PlaceGroupSource = top5.length > 0 ? 'places_api' : 'gps';

        if (top5.length > 0) {
          const top = top5[0];
          label = top.place.displayName?.text ?? '場所不明';
          category = mapToPlaceCategory(top.place.types ?? []);
          topConfidence = top.confidence;
          topProviderPlaceId = top.place.id;
        }

        // PlaceGroupDoc を作成
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (topProviderPlaceId) {
          groupDocData.selectedProviderPlaceId = topProviderPlaceId;
        }

        const groupRef = await placeGroupsRef.add(groupDocData);
        placeGroupsCreated++;

        // candidates サブコレクションに保存（上位10件）
        const candidatesRef = groupRef.collection('candidates');
        await Promise.all(
          top5.map(({ place, distMeters, confidence }) => {
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
    await assertOwnerOrEditor(db, noteId, uid);

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
        groupLng
      );
    } catch (e) {
      console.error(`[getPlaceCandidatesForGroup] Places API error`);
      throw new HttpsError('unavailable', 'Places API の呼び出しに失敗しました');
    }

    console.log(
      `[getPlaceCandidatesForGroup] cacheHit=false candidatesCount=${freshCandidates.length}`
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
    await assertOwnerOrEditor(db, noteId, uid);

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
        groupData.longitude as number
      );
    } catch (e) {
      console.error(`[refreshPlaceCandidates] Places API error`);
      throw new HttpsError('unavailable', 'Places API の呼び出しに失敗しました');
    }

    console.log(
      `[refreshPlaceCandidates] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} candidatesCount=${freshCandidates.length}`
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
    };
    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が不正です');
    }
    if (typeof data.placeGroupId !== 'string' || !data.placeGroupId.trim()) {
      throw new HttpsError('invalid-argument', 'placeGroupId が不正です');
    }
    if (typeof data.label !== 'string') {
      throw new HttpsError('invalid-argument', 'label が不正です');
    }
    const noteId = data.noteId.trim();
    const placeGroupId = data.placeGroupId.trim();
    const label = data.label.trim();

    // label バリデーション（1〜50文字）
    if (label.length === 0 || label.length > 50) {
      throw new HttpsError('invalid-argument', 'label は1〜50文字で入力してください');
    }

    // category バリデーション
    let category: PlaceCategory = 'unknown';
    if (data.category !== undefined && data.category !== null) {
      if (typeof data.category !== 'string' || !VALID_CATEGORIES.includes(data.category as PlaceCategory)) {
        throw new HttpsError('invalid-argument', '不正な category です');
      }
      category = data.category as PlaceCategory;
    }

    const db = admin.firestore();
    await assertOwnerOrEditor(db, noteId, uid);

    const groupRef = db.doc(`memory_notes/${noteId}/place_groups/${placeGroupId}`);
    const groupSnap = await groupRef.get();
    if (!groupSnap.exists) {
      throw new HttpsError('not-found', 'PlaceGroup が見つかりません');
    }

    // PlaceGroup を更新（selectedCandidateId / selectedProviderPlaceId は削除）
    await groupRef.update({
      userEditedLabel: label,
      label,
      category,
      userConfirmed: true,
      source: 'manual' as PlaceGroupSource,
      selectedCandidateId: admin.firestore.FieldValue.delete(),
      selectedProviderPlaceId: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // visitedPlacesSummary を再計算
    await recalculateVisitedPlacesSummary(db, noteId);

    console.log(
      `[updatePlaceGroupManually] noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} placeGroupId=${placeGroupId.slice(0, 8)}`
    );

    return { success: true };
  }
);
