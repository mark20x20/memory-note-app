// Phase 12.5H-3: Route cache utilities
//
// キャッシュの有効性判定・segmentId 生成・TTL 計算などのユーティリティ。

import type { Timestamp } from 'firebase-admin/firestore';
import type { PremiumRouteTravelMode } from './types';

// ── segmentId ─────────────────────────────────────────────────────────────────

/**
 * Firestore の route_segments ドキュメント ID を生成する。
 *
 * 命名規則: {fromPlaceGroupId}_{toPlaceGroupId}_{travelMode}
 * 例: abc123_def456_walking
 *
 * @param params - from/to の PlaceGroup ID と移動手段
 * @returns segmentId 文字列
 */
export function buildRouteSegmentId(params: {
  fromPlaceGroupId: string;
  toPlaceGroupId: string;
  travelMode: PremiumRouteTravelMode;
}): string {
  return `${params.fromPlaceGroupId}_${params.toPlaceGroupId}_${params.travelMode}`;
}

// ── TTL 計算 ──────────────────────────────────────────────────────────────────

/**
 * キャッシュの有効期限日時を計算する。
 *
 * @param baseDate - 基準日時（デフォルト: 現在時刻）
 * @param ttlDays - TTL の日数（デフォルト: 30日）
 * @returns 有効期限の Date オブジェクト
 */
export function calcRouteExpiresAt(baseDate = new Date(), ttlDays = 30): Date {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + ttlDays);
  return result;
}

// ── stale 判定 ────────────────────────────────────────────────────────────────

/**
 * route_segments ドキュメントが stale（再生成が必要）かどうかを判定する。
 *
 * stale とみなす条件:
 * 1. status が 'failed' または 'stale'
 * 2. expiresAt が現在時刻より過去
 * 3. placeGroupVersionHash が変わっている（将来実装）
 *
 * @param params - expiresAt、現在の PlaceGroup ハッシュ、キャッシュ時の PlaceGroup ハッシュ
 * @returns stale なら true
 */
export function isRouteSegmentStale(params: {
  status?: string;
  expiresAt?: Timestamp | null;
  currentPlaceGroupVersionHash?: string;
  cachedPlaceGroupVersionHash?: string;
}): boolean {
  // status が failed / stale なら常に stale
  if (params.status === 'failed' || params.status === 'stale') {
    return true;
  }

  // expiresAt を過ぎていれば stale
  if (params.expiresAt) {
    const now = new Date();
    const expires = params.expiresAt.toDate();
    if (now > expires) {
      return true;
    }
  }

  // PlaceGroup の座標ハッシュが変わっていれば stale
  // Phase 12.5H-4+ で本実装予定
  if (
    params.currentPlaceGroupVersionHash !== undefined &&
    params.cachedPlaceGroupVersionHash !== undefined &&
    params.currentPlaceGroupVersionHash !== params.cachedPlaceGroupVersionHash
  ) {
    return true;
  }

  return false;
}
