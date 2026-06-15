// Phase 12.5H-5: Google Routes API HTTP クライアント 本実装
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

// ── ヘルパー ──────────────────────────────────────────────────────────────────

/**
 * Google Routes API の duration フィールド（"123s" 形式）を秒数に変換する。
 * 形式が不正な場合は undefined を返す。
 */
function parseDurationSeconds(duration: unknown): number | undefined {
  if (typeof duration !== 'string') return undefined;
  const match = duration.match(/^(\d+)s$/);
  if (!match) return undefined;
  return parseInt(match[1], 10);
}

// ── computeRouteSegment ───────────────────────────────────────────────────────

/**
 * Google Routes API (v2:computeRoutes) を呼び出して1区間のルートを取得する。
 *
 * Phase 12.5H-5: walking / driving 本実装。
 * Phase 12.5H-6: transit 対応（departureTime=now、encodedPolyline のみ取得）。
 *
 * @param params - APIキー、origin/destination 座標、移動手段
 * @returns encodedPolyline、距離、所要時間などのルート情報
 * @throws API キーが空の場合は Error
 * @throws Routes API がエラーを返した場合は Error
 * @throws encodedPolyline が取得できなかった場合は Error
 */
export async function computeRouteSegment(
  params: ComputeRouteSegmentParams
): Promise<ComputeRouteSegmentResult> {
  const { apiKey, origin, destination, travelMode } = params;

  // API キー検証
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('[computeRouteSegment] GOOGLE_ROUTES_API_KEY is empty');
  }

  const apiTravelMode = TRAVEL_MODE_MAP[travelMode];

  // transit は departureTime を現在時刻に設定（指定しないと ZERO_RESULTS になる場合がある）
  const requestBody: Record<string, unknown> = {
    origin: {
      location: {
        latLng: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      },
    },
    travelMode: apiTravelMode,
    computeAlternativeRoutes: false,
    languageCode: 'ja',
    units: 'METRIC',
  };

  if (travelMode === 'transit') {
    requestBody.departureTime = new Date().toISOString();
  }

  // transit は routes.description を返さない場合があるため FieldMask に含めない
  const fieldMask =
    travelMode === 'transit'
      ? 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.warnings'
      : 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.warnings';

  const response = await fetch(ROUTES_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = (await response.json()) as { error?: { message?: string; status?: string } };
      errorDetail = errJson?.error?.message ?? '';
      const errStatus = errJson?.error?.status ?? '';
      if (errStatus) errorDetail = `${errStatus}: ${errorDetail}`;
    } catch {
      errorDetail = await response.text().catch(() => '');
    }
    throw new Error(
      `[computeRouteSegment] Google Routes API error ${response.status}: ${errorDetail}`
    );
  }

  const json = (await response.json()) as {
    routes?: Array<{
      polyline?: { encodedPolyline?: string };
      distanceMeters?: number;
      duration?: string;
      description?: string;
      warnings?: string[];
    }>;
  };

  const route = json.routes?.[0];

  if (!route) {
    throw new Error(
      '[computeRouteSegment] Google Routes API returned no routes'
    );
  }

  const encodedPolyline = route.polyline?.encodedPolyline;
  if (!encodedPolyline) {
    throw new Error(
      '[computeRouteSegment] Google Routes API returned empty encodedPolyline'
    );
  }

  const result: ComputeRouteSegmentResult = {
    encodedPolyline,
    warnings: Array.isArray(route.warnings) ? route.warnings : [],
  };

  const distanceMeters = route.distanceMeters;
  if (distanceMeters !== undefined) result.distanceMeters = distanceMeters;

  const durationSeconds = parseDurationSeconds(route.duration);
  if (durationSeconds !== undefined) result.durationSeconds = durationSeconds;

  // description は driving/walking のみ返される。transit では undefined になるため条件付き設定。
  if (route.description !== undefined) result.routeSummary = route.description;

  return result;
}
