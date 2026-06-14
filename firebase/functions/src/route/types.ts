// Phase 12.5H-3: Google Routes API — 型定義
// firebase-admin の Timestamp を使用（クライアント SDK の firebase/firestore とは別）

import type { Timestamp } from 'firebase-admin/firestore';

// ── 移動手段 ──────────────────────────────────────────────────────────────────

export type PremiumRouteTravelMode = 'walking' | 'driving' | 'transit';

// ── ルートセグメントのステータス ──────────────────────────────────────────────

export type RouteSegmentStatus = 'generated' | 'failed' | 'stale';

// ── Callable 関数の入出力型 ───────────────────────────────────────────────────

/**
 * 区間別移動手段指定（Phase 12.5H-5.5 mixed route mode）。
 * travelMode に 'transit' を指定しても、generateNoteRoutes 側でスキップされる。
 */
export type SegmentTravelModeInput = {
  fromPlaceGroupId: string;
  toPlaceGroupId: string;
  travelMode: PremiumRouteTravelMode;
};

export type GenerateNoteRoutesInput = {
  noteId: string;
  /**
   * 全区間に適用する移動手段。
   * segmentTravelModes と排他的に使用。
   * どちらか一方が必須。
   */
  travelMode?: PremiumRouteTravelMode;
  /**
   * 区間別移動手段指定（Phase 12.5H-5.5 mixed route mode）。
   * 指定した場合は travelMode を無視して区間ごとの手段を使う。
   * transit 区間はスキップされる。
   */
  segmentTravelModes?: SegmentTravelModeInput[];
  /** true にするとキャッシュを無視して再生成。Premium でも1日上限あり */
  forceRefresh?: boolean;
};

export type GenerateNoteRoutesResult = {
  noteId: string;
  /** 全体モードの移動手段（segmentTravelModes 使用時は undefined） */
  travelMode?: PremiumRouteTravelMode;
  /** 処理したセグメント総数 */
  segmentCount: number;
  /** キャッシュから返したセグメント数 */
  cacheHitCount: number;
  /** 新たに Routes API で生成したセグメント数 */
  generatedCount: number;
  /** 座標不明など理由でスキップしたセグメント数 */
  skippedCount: number;
};

export type GetNoteRouteSegmentsInput = {
  noteId: string;
  /** 指定すると travelMode でフィルタ。省略すると全セグメントを返す */
  travelMode?: PremiumRouteTravelMode;
};

export type RouteSegmentSummary = {
  id: string;
  fromPlaceGroupId: string;
  toPlaceGroupId: string;
  /** セグメントの移動手段（mixed mode で色分けに使用） */
  travelMode?: PremiumRouteTravelMode;
  distanceMeters?: number;
  durationSeconds?: number;
  decodedPolyline?: RouteLatLng[];
  status: RouteSegmentStatus;
};

export type GetNoteRouteSegmentsResult = {
  noteId: string;
  /** フィルタに使用した移動手段。全件取得時は undefined */
  travelMode?: PremiumRouteTravelMode;
  segments: RouteSegmentSummary[];
};

export type DeleteNoteRouteCacheInput = {
  noteId: string;
  travelMode: PremiumRouteTravelMode | 'all';
};

export type DeleteNoteRouteCacheResult = {
  deletedCount: number;
};

// ── Firestore ドキュメント型 ───────────────────────────────────────────────────

export type RouteLatLng = {
  latitude: number;
  longitude: number;
};

export type RouteSegmentDoc = {
  // ── ドキュメント識別 ────────────────────────────────
  id: string;                        // = segmentId: {fromPlaceGroupId}_{toPlaceGroupId}_{travelMode}
  noteId: string;

  // ── 区間の端点 ─────────────────────────────────────
  fromPlaceGroupId: string;
  toPlaceGroupId: string;

  // ── 移動手段・プロバイダ ────────────────────────────
  travelMode: PremiumRouteTravelMode;
  provider: 'google_routes';

  // ── 端点座標（キャッシュ無効化検出に使う） ────────────
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;

  // ── ルート情報 ─────────────────────────────────────
  distanceMeters?: number;           // 区間距離（メートル, 例: 850）
  durationSeconds?: number;          // 所要時間（秒, 例: 720 = 12分）

  // ── Polyline ───────────────────────────────────────
  /**
   * Google Routes API が返す encoded polyline 文字列。
   * decode して decodedPolyline を生成するが、元データも保持する。
   */
  encodedPolyline?: string;
  /**
   * encodedPolyline を decode した座標配列。
   * Firestore からそのまま読んで MapView の Polyline に渡せる形式。
   * decode は Cloud Functions 側で実施（モバイル側での計算を省略）。
   */
  decodedPolyline?: RouteLatLng[];

  // ── 補足情報 ───────────────────────────────────────
  routeSummary?: string;             // 例: "国道14号" （driving の場合）
  warnings?: string[];               // Routes API からの警告

  // ── ステータス ─────────────────────────────────────
  /**
   * - 'generated': 正常に生成済み
   * - 'failed': API 呼び出し失敗（フォールバック: 直線ルートを使う）
   * - 'stale': 座標変更などにより無効化済み（再生成が必要）
   */
  status: RouteSegmentStatus;

  // ── タイムスタンプ ─────────────────────────────────
  generatedAt: Timestamp;
  updatedAt: Timestamp;
  /**
   * この日時を過ぎたらキャッシュを無効とみなす。
   * 初期 TTL: 30日
   */
  expiresAt?: Timestamp;

  // ── バージョン管理（将来用） ───────────────────────
  /**
   * PlaceGroup の座標ハッシュ。
   * 座標変更を検出するために使う（Phase 12.5H-4+ で実装予定）。
   */
  apiRequestHash?: string;
  placeGroupVersionHash?: string;
};
