// Phase 12.5C: GPS グルーピング・距離計算ユーティリティ
// Phase 8 の groupNearbyLocations アルゴリズムを Cloud Functions 側に移植。
// クライアント SDK への依存なし。

import type { PhotoData, LocalPlaceGroup } from './types';

/** Phase 8 と同じ閾値: 約 220m を同一グループとみなす */
const PLACE_GROUP_THRESHOLD_DEGREES = 0.002;

/** 1 ノートあたりに作成する PlaceGroup の上限 */
export const MAX_PLACE_GROUPS = 5;

// ── GPS フィルタリング ─────────────────────────────────────────────────────────

/**
 * 写真データから latitude / longitude が有効なもののみ抽出する。
 */
export function extractGpsPhotos(
  photos: PhotoData[]
): Array<PhotoData & { latitude: number; longitude: number }> {
  return photos.filter(
    (p): p is PhotoData & { latitude: number; longitude: number } =>
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number' &&
      !Number.isNaN(p.latitude) &&
      !Number.isNaN(p.longitude)
  );
}

// ── GPS グルーピング ───────────────────────────────────────────────────────────

/**
 * 近接する写真を場所グループに集約する。
 * Phase 8 の groupNearbyLocations と同じアルゴリズム。
 *
 * 1. 写真を順番に処理
 * 2. 既存グループの中心から THRESHOLD 以内なら同グループに追加（中心を平均更新）
 * 3. 近いグループがなければ新規グループを作成
 * 4. 写真枚数降順にソートして最大 MAX_PLACE_GROUPS 件に絞る
 */
export function groupNearbyLocations(
  photos: Array<PhotoData & { latitude: number; longitude: number }>
): LocalPlaceGroup[] {
  const groups: LocalPlaceGroup[] = [];

  for (const p of photos) {
    let matched = false;

    for (const g of groups) {
      const dLat = Math.abs(g.latitude - p.latitude);
      const dLng = Math.abs(g.longitude - p.longitude);

      if (dLat <= PLACE_GROUP_THRESHOLD_DEGREES && dLng <= PLACE_GROUP_THRESHOLD_DEGREES) {
        g.photoIds.push(p.id);
        g.photoCount = g.photoIds.length;
        const n = g.photoCount;
        g.latitude = (g.latitude * (n - 1) + p.latitude) / n;
        g.longitude = (g.longitude * (n - 1) + p.longitude) / n;
        if (!g.coverPhotoURL && p.downloadURL) {
          g.coverPhotoURL = p.downloadURL;
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.push({
        latitude: p.latitude,
        longitude: p.longitude,
        photoIds: [p.id],
        photoCount: 1,
        coverPhotoURL: p.downloadURL ?? null,
      });
    }
  }

  // 写真枚数が多い（より多く滞在した）グループを優先し、上限に絞る
  return groups
    .sort((a, b) => b.photoCount - a.photoCount)
    .slice(0, MAX_PLACE_GROUPS);
}

// ── 距離計算 ──────────────────────────────────────────────────────────────────

/**
 * 2点間の Haversine 距離をメートルで返す。
 * GPS 精度が低い場合でも候補スコアリングの参考値として使用する。
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 地球半径 (m)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── キャッシュ有効期限チェック ────────────────────────────────────────────────

/** Places API キャッシュを 24時間で有効とみなす */
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * fetchedAt タイムスタンプが 24時間以内かどうかを確認する。
 */
export function isCacheValid(fetchedAtDate: Date): boolean {
  return Date.now() - fetchedAtDate.getTime() < CACHE_DURATION_MS;
}
