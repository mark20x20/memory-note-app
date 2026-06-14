// Phase 8: Map / Place Grouping — 型定義

import type { Timestamp } from 'firebase/firestore';

export type PhotoLocation = {
  photoId: string;
  latitude: number;
  longitude: number;
  takenAt?: string | null;
  downloadURL?: string | null;
};

/**
 * 簡易グループ化されたスポット。
 * Phase 8 では近接する写真を1つのグループとして扱う。
 * Phase 9+ で本格的な場所名推定・クラスタリングに置き換え予定。
 */
export type PlaceGroup = {
  id: string;
  /** グループの代表緯度（含まれる写真の平均） */
  latitude: number;
  /** グループの代表経度（含まれる写真の平均） */
  longitude: number;
  photoCount: number;
  photoIds: string[];
  coverPhotoURL?: string | null;
};

/** 地図表示範囲 */
export type MapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

/** ピンの表示位置（正規化済み 0〜1） */
export type NormalizedPoint = {
  x: number; // 0=左端 1=右端
  y: number; // 0=上端 1=下端
};

// ── Phase 12.5: Place Intelligence — Firestore 型定義 ────────────────────────

/** NoteDoc の場所エンリッチメント処理ステータス */
export type PlaceEnrichmentStatus = 'idle' | 'fetching' | 'completed' | 'failed';

/** 場所のカテゴリ（UI 表示・AI 日記プロンプト用） */
export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'tourist_attraction'
  | 'station'
  | 'hotel'
  | 'shopping'
  | 'park'
  | 'museum'
  | 'area'
  | 'unknown';

/** PlaceGroupDoc のデータソース */
export type PlaceGroupSource =
  | 'gps'          // GPS のみ（候補取得前）
  | 'places_api'   // Places API 候補から自動選択
  | 'ai_assisted'  // AI 補助によるスコアリング
  | 'manual';      // ユーザー手動入力

/** PlaceCandidateDoc の外部プロバイダ種別 */
export type PlaceCandidateProvider =
  | 'google'
  | 'foursquare'
  | 'osm'
  | 'geocoding'
  | 'manual';

/** PlaceCandidateDoc の取得方法 */
export type PlaceCandidateSource =
  | 'places_api'
  | 'geocoding'
  | 'ai_ranked'
  | 'manual';

/**
 * NoteDoc に付与する場所サマリー（非正規化）。
 * AI 日記生成・共有カード表示が Firestore 1回読みで場所情報を参照できるようにする。
 */
export type VisitedPlacesSummary = {
  confirmedCount: number;       // userConfirmed=true の場所数
  totalGroupCount: number;      // PlaceGroup 総数
  topPlaceLabels: string[];     // 確定場所名の先頭 3件（AI 日記・共有カード用）
  areaLabel?: string;           // エリアレベルのラベル（例: 東京 浅草）
  generatedAt: Timestamp;
};

/**
 * Firestore: memory_notes/{noteId}/place_groups/{placeGroupId}
 * Phase 8 の簡易グルーピング型（PlaceGroup）とは別物。
 * PlaceGroup は loktal/UI 専用、PlaceGroupDoc は Firestore 保存用。
 * Phase 12.5G-1: 訪問イベント単位として扱えるよう startAt/endAt/sortOrder を追加。
 */
export type PlaceGroupDoc = {
  id: string;
  noteId: string;

  // 場所の位置（代表点）
  latitude: number;
  longitude: number;

  // ラベルとカテゴリ
  label: string;       // 例: "浅草寺"、"代官山 蔦屋書店"
  category: PlaceCategory;

  // この場所グループに属する写真
  photoIds: string[];
  photoCount: number;
  coverPhotoURL?: string | null;

  // 選択された候補
  selectedCandidateId?: string;       // candidates サブコレクションの ID
  selectedProviderPlaceId?: string;   // 外部 API の placeId（重複確認用）

  // スコア・信頼度
  confidence: number;  // 0.0 〜 1.0

  // ユーザー確認状態
  userConfirmed: boolean;      // true: ユーザーが確認・選択した
  userEditedLabel?: string;    // 手動入力ラベル（selectedCandidateId がない場合）

  // データソース
  source: PlaceGroupSource;

  // Phase 12.5G-1: 訪問イベント時刻・順序
  startAt?: Timestamp | null;   // イベント開始時刻（最初の写真の takenAt）
  endAt?: Timestamp | null;     // イベント終了時刻（最後の写真の takenAt）
  sortOrder?: number;           // 時系列順（0, 1, 2, ...）
  // Phase 12.5G-2: イベント内写真プレビュー（最大3枚の downloadURL）
  photoPreviewURLs?: string[];
  // Phase 12.5G-3: イベントメモ
  eventMemo?: string | null;

  // タイムスタンプ
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

// ── Phase 12.5H-1: Route Plan Mode — 型定義 ─────────────────────────────────

/**
 * ルート表示モード。
 * - 'straight': 訪問順を直線の破線でつなぐ（無料プラン）
 * - 'premium': 実際の移動ルートを表示（有料プラン・将来実装）
 */
export type RouteDisplayMode = 'straight' | 'premium';

/**
 * プレミアムルートの移動手段。
 * 将来 Google Routes API 呼び出し時に使用する。
 */
export type PremiumRouteTravelMode = 'walking' | 'driving' | 'transit';

/**
 * ルートプランの利用可能状態。
 * - 'free': 無料プラン（直線ルートのみ）
 * - 'premium_locked': プレミアム機能だがロック中
 * - 'premium_available': プレミアム機能が使用可能
 * - 'not_generated': プレミアムルートはまだ生成されていない
 */
export type RoutePlanAvailability = 'free' | 'premium_locked' | 'premium_available' | 'not_generated';

/**
 * 訪問イベント間のルートセグメント（将来のデータモデル）。
 * Phase 12.5H-1 では Firestore に保存しない。
 * Google Routes API でルートを生成した際のキャッシュ用型として定義しておく。
 *
 * @future
 * - Cloud Functions 側でルートを生成し Firestore にキャッシュする
 * - サブコレクション: memory_notes/{noteId}/route_segments/{segmentId}
 */
export type VisitRouteSegment = {
  id: string;
  fromPlaceGroupId: string;
  toPlaceGroupId: string;
  displayMode: RouteDisplayMode;
  travelMode?: PremiumRouteTravelMode;
  /** 直線距離または実ルート距離（メートル） */
  distanceMeters?: number;
  /** 移動時間（秒） */
  durationSeconds?: number;
  /** Google Routes API の encoded polyline（将来使用） */
  encodedPolyline?: string;
  /** ルートプロバイダ */
  provider?: 'google_routes' | 'manual' | 'straight';
  /** ルート生成日時 */
  generatedAt?: unknown; // Firestore Timestamp（将来使用）
};

// ── Phase 12.5H-5: Route Segments — クライアント型定義 ───────────────────────

/**
 * 区間別移動手段指定（Phase 12.5H-5.5 mixed route mode）。
 * generateNoteRoutes に segmentTravelModes として渡す。
 * transit を指定した場合、Cloud Functions 側でスキップされる。
 */
export type SegmentTravelModeInput = {
  fromPlaceGroupId: string;
  toPlaceGroupId: string;
  travelMode: PremiumRouteTravelMode;
};

/**
 * Firestore の route_segments ドキュメントのサマリー型（クライアント用）。
 * Cloud Functions の getNoteRouteSegments が返す型と対応する。
 */
export type RouteSegmentSummary = {
  id: string;
  fromPlaceGroupId: string;
  toPlaceGroupId: string;
  travelMode?: PremiumRouteTravelMode;
  distanceMeters?: number;
  durationSeconds?: number;
  decodedPolyline?: { latitude: number; longitude: number }[];
  routeSummary?: string;
  warnings?: string[];
  status: 'generated' | 'failed' | 'stale';
};

/**
 * ルート生成の状態（map.tsx で使用）。
 * - 'idle': 未生成
 * - 'loading': 生成中
 * - 'success': 生成済み
 * - 'error': 生成失敗
 */
export type RouteGenerationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Firestore: memory_notes/{noteId}/place_groups/{placeGroupId}/candidates/{candidateId}
 * 外部 API から取得した場所候補。API レスポンス全文は保存しない。
 */
export type PlaceCandidateDoc = {
  id: string;

  // 外部プロバイダ情報
  provider: PlaceCandidateProvider;
  providerPlaceId?: string;   // 外部 API の place_id（再取得・重複確認用）

  // 場所情報
  name: string;
  address?: string;            // 住所（表示用）
  types: string[];             // 外部 API のカテゴリ（例: ["tourist_attraction"]）
  latitude: number;
  longitude: number;

  // スコア
  distanceMeters?: number;    // PlaceGroup 代表点からの距離
  rating?: number;            // 外部 API の評価（0.0〜5.0）
  confidence?: number;        // このアプリでのスコアリング結果

  // 取得方法
  source: PlaceCandidateSource;

  // タイムスタンプ
  fetchedAt: Timestamp;
};
