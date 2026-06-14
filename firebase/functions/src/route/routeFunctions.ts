// Phase 12.5H-3: Google Routes API — Callable Functions skeleton
//
// セキュリティ方針:
// - GOOGLE_ROUTES_API_KEY は Secret Manager の defineSecret() 経由でのみ参照する
// - Google Routes API 呼び出しはこのファイル（Cloud Functions）からのみ行う
// - 座標・ルート情報はログに出力しない
// - uid はログに末尾4文字のみ出力する
//
// Phase 12.5H-3: skeleton のみ。Routes API 本呼び出し・Firestore 書き込みは未実装。
//   - generateNoteRoutes: auth/validation 後に skeleton 結果を返す
//   - getNoteRouteSegments: auth/validation 後に空配列を返す
//   - deleteNoteRouteCache: auth/validation 後に 0 を返す

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

import type {
  GenerateNoteRoutesInput,
  GenerateNoteRoutesResult,
  GetNoteRouteSegmentsInput,
  GetNoteRouteSegmentsResult,
  DeleteNoteRouteCacheInput,
  DeleteNoteRouteCacheResult,
  PremiumRouteTravelMode,
} from './types';

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
 * Phase 12.5H-3: skeleton のみ。
 * - auth チェック・バリデーション・権限確認までは実装済み
 * - Premium 判定・Routes API 本呼び出し・Firestore 保存は未実装
 * - 0件の skeleton 結果を返す
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

    // 4. TODO Phase 12.5H-4/H-5: Premium 判定を本実装に差し替える。
    //    現在は isPremiumUser = false のハードコードのため、
    //    このフェーズでは skeleton として続行する（実生成はしない）。
    //
    //    将来の実装例:
    //    const isPremiumUser = await checkPremiumStatus(uid);
    //    if (!isPremiumUser) {
    //      throw new HttpsError('permission-denied', 'ルート生成はプレミアムプランのみ利用可能です');
    //    }

    // 5. TODO Phase 12.5H-4/H-5: ルート生成回数クォータチェックを実装する。
    //    1日 10回 / forceRefresh は 1日 3回の上限を設ける。
    //    await assertRouteGenerationQuota(db, uid, forceRefresh);

    // 6. Phase 12.5H-3 skeleton: Routes API 本呼び出しは未実装。
    //    0件の結果を返す。
    //    Phase 12.5H-5 で walking/driving のルート生成を実装する。
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
 * Phase 12.5H-3: skeleton のみ。
 * - auth チェック・バリデーション・権限確認までは実装済み
 * - Firestore route_segments 読み取りは未実装
 * - 空配列の skeleton 結果を返す
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
    if (!VALID_TRAVEL_MODES.includes(data.travelMode as PremiumRouteTravelMode)) {
      throw new HttpsError('invalid-argument', 'travelMode が不正です（walking / driving / transit）');
    }

    const noteId = data.noteId.trim();
    const travelMode = data.travelMode as PremiumRouteTravelMode;

    const db = admin.firestore();

    // 3. ノートメンバー確認（viewer も閲覧可）
    // TODO Phase 12.5H-4/H-5: check note permission and premium entitlement.
    await assertNoteMember(db, noteId, uid);

    // 4. Phase 12.5H-3 skeleton: Firestore route_segments 読み取りは未実装。
    //    Phase 12.5H-4 で実装する。
    console.log(
      `[getNoteRouteSegments] skeleton only — noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} travelMode=${travelMode}`
    );

    return {
      noteId,
      travelMode,
      segments: [],
    };
  }
);

// ── 3. deleteNoteRouteCache ───────────────────────────────────────────────────

/**
 * ノートの route_segments キャッシュを削除する。
 * owner/editor のみ削除可能。
 *
 * Phase 12.5H-3: skeleton のみ。
 * - auth チェック・バリデーション・権限確認までは実装済み
 * - Firestore route_segments 削除は未実装
 * - deletedCount: 0 の skeleton 結果を返す
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
    if (!validDeleteModes.includes(data.travelMode as typeof validDeleteModes[number])) {
      throw new HttpsError('invalid-argument', 'travelMode が不正です（walking / driving / transit / all）');
    }

    const noteId = data.noteId.trim();
    const travelMode = data.travelMode as DeleteNoteRouteCacheInput['travelMode'];

    const db = admin.firestore();

    // 3. owner/editor 権限確認
    // TODO Phase 12.5H-4/H-5: check note permission and premium entitlement.
    await assertOwnerOrEditor(db, noteId, uid);

    // 4. Phase 12.5H-3 skeleton: Firestore route_segments 削除は未実装。
    //    Phase 12.5H-4 で実装する。
    console.log(
      `[deleteNoteRouteCache] skeleton only — noteId=${noteId.slice(0, 8)} uid=***${uid.slice(-4)} travelMode=${travelMode}`
    );

    return {
      deletedCount: 0,
    };
  }
);
