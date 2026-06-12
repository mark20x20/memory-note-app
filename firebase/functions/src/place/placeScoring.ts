// Phase 12.5C: 候補スコアリング（簡易版）
// Phase 12.5D で 7 因子スコアリング + OpenAI AI ランキングに置き換える。
// 今回はdistance / category / rating の 3 因子のみ実装する。

import type { PlaceCategory } from './types';

// ── カテゴリ優先度テーブル（Phase 12.5D で拡張予定）────────────────────────────

const CATEGORY_PRIORITY: Record<string, number> = {
  tourist_attraction: 1.0,
  landmark: 1.0,
  historical_landmark: 0.95,
  museum: 0.9,
  amusement_park: 0.9,
  zoo: 0.85,
  aquarium: 0.85,
  park: 0.85,
  restaurant: 0.85,
  cafe: 0.80,
  shopping_mall: 0.75,
  department_store: 0.75,
  store: 0.70,
  clothing_store: 0.70,
  lodging: 0.70,
  train_station: 0.65,
  subway_station: 0.65,
  transit_station: 0.65,
  bus_station: 0.60,
  natural_feature: 0.60,
  campground: 0.55,
  bar: 0.50,
  bank: 0.10,
  atm: 0.05,
  gas_station: 0.05,
  parking: 0.05,
};
const DEFAULT_CATEGORY_SCORE = 0.30;

function distanceScore(distanceMeters: number, maxRadius = 200): number {
  if (distanceMeters >= maxRadius) return 0;
  return 1.0 - distanceMeters / maxRadius;
}

function categoryScore(types: string[]): number {
  if (types.length === 0) return DEFAULT_CATEGORY_SCORE;
  const scores = types.map((t) => CATEGORY_PRIORITY[t] ?? DEFAULT_CATEGORY_SCORE);
  return Math.max(...scores);
}

function ratingScore(rating?: number): number {
  if (rating == null) return 0.5; // neutral if unknown
  return Math.min(rating / 5.0, 1.0);
}

/**
 * 簡易 confidence スコアを計算する（0.0〜1.0）。
 * Phase 12.5D で 7 因子スコアリングに置き換える予定。
 *
 * weights: distance=0.6, category=0.3, rating=0.1
 */
export function calculatePreliminaryConfidence(
  distanceMeters: number,
  types: string[],
  rating?: number
): number {
  const dist = distanceScore(distanceMeters);
  const cat = categoryScore(types);
  const rat = ratingScore(rating);
  const score = dist * 0.6 + cat * 0.3 + rat * 0.1;
  return Math.max(0, Math.min(1, score));
}

/**
 * Google Places の types 配列をアプリ内 PlaceCategory にマッピングする。
 * 複数 types がある場合は最初にマッチしたカテゴリを返す。
 */
export function mapToPlaceCategory(types: string[]): PlaceCategory {
  if (
    types.some((t) =>
      ['tourist_attraction', 'landmark', 'historical_landmark', 'amusement_park', 'zoo', 'aquarium'].includes(t)
    )
  )
    return 'tourist_attraction';
  if (
    types.some((t) =>
      ['restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'bakery'].includes(t)
    )
  )
    return 'restaurant';
  if (types.includes('cafe')) return 'cafe';
  if (
    types.some((t) =>
      ['train_station', 'subway_station', 'transit_station', 'bus_station', 'light_rail_station'].includes(t)
    )
  )
    return 'station';
  if (types.some((t) => ['lodging', 'hotel'].includes(t))) return 'hotel';
  if (
    types.some((t) =>
      ['shopping_mall', 'store', 'clothing_store', 'department_store', 'convenience_store'].includes(t)
    )
  )
    return 'shopping';
  if (
    types.some((t) =>
      ['park', 'natural_feature', 'campground', 'national_park'].includes(t)
    )
  )
    return 'park';
  if (types.some((t) => ['museum', 'art_gallery'].includes(t))) return 'museum';
  return 'unknown';
}
