// Phase 12.5H-3: Google Routes API HTTP クライアント skeleton
//
// Phase 12.5H-5 で実際の API 呼び出しを実装する。
// 現時点では型・インターフェースを定義するのみ。
//
// セキュリティ方針:
// - GOOGLE_ROUTES_API_KEY は Secret Manager 経由でのみ使用する
// - 座標・ルート情報はログに出力しない
// - API キーをログに出力しない

import type { PremiumRouteTravelMode } from './types';

// ── Google Routes API のエンドポイント ────────────────────────────────────────

const ROUTES_API_ENDPOINT =
  'https://routes.googleapis.com/directions/v2:computeRoutes';

// ── travelMode マッピング ─────────────────────────────────────────────────────

const TRAVEL_MODE_MAP: Record<PremiumRouteTravelMode, string> = {
  walking: 'WALK',
  driving: 'DRIVE',
  transit: 'TRANSIT',
};

// ── 型定義 ────────────────────────────────────────────────────────────────────

export type ComputeRouteSegmentParams = {
  apiKey: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  travelMode: PremiumRouteTravelMode;
};

export type ComputeRouteSegmentResult = {
  encodedPolyline?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  routeSummary?: string;
  warnings?: string[];
};

// ── Google Routes API リクエスト body 型（将来の実装参照用）──────────────────

type RoutesApiRequestBody = {
  origin: {
    location: {
      latLng: { latitude: number; longitude: number };
    };
  };
  destination: {
    location: {
      latLng: { latitude: number; longitude: number };
    };
  };
  travelMode: string;
  computeAlternativeRoutes: boolean;
  routeModifiers: Record<string, unknown>;
  polylineQuality: string;
};

// ── computeRouteSegment ───────────────────────────────────────────────────────

/**
 * Google Routes API (v2:computeRoutes) を呼び出して1区間のルートを取得する。
 *
 * Phase 12.5H-3: skeleton only — 実装は Phase 12.5H-5 で行う。
 *
 * @param params - APIキー、origin/destination 座標、移動手段
 * @returns encodedPolyline、距離、所要時間などのルート情報
 * @throws 未実装エラー（Phase 12.5H-5 で実装予定）
 */
export async function computeRouteSegment(
  params: ComputeRouteSegmentParams
): Promise<ComputeRouteSegmentResult> {
  // Phase 12.5H-3: skeleton only.
  // Phase 12.5H-5 で実際の fetch 呼び出しを実装する。
  // 参考: ROUTES_API_ENDPOINT, TRAVEL_MODE_MAP, RoutesApiRequestBody を使用する予定。
  void ROUTES_API_ENDPOINT;
  void TRAVEL_MODE_MAP;
  void params;

  throw new Error(
    '[computeRouteSegment] Not implemented yet. Will be implemented in Phase 12.5H-5.'
  );
}
