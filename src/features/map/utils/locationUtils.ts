// Phase 8: Map / Place Grouping — 位置情報ユーティリティ
// NOTE: Phase 8 では外部地図 SDK を使わず、React Native View ベースの地図風プレビューを実装する。
//       本格的な地図表示・場所名推定は Phase 9 以降で対応予定。

import type { PhotoDoc } from '@/core/repositories/photoRepository';
import type { MapBounds, NormalizedPoint, PhotoLocation, PlaceGroup } from '../types';

/**
 * 簡易グルーピングの閾値（度）。
 * 約 0.002 度 ≈ 220m 以内の写真を同じスポットとみなす。
 * Phase 9+ で Haversine 距離や住所ベースに置き換え可能。
 */
const PLACE_GROUP_THRESHOLD_DEGREES = 0.002;

/**
 * ピンが端に寄りすぎないよう、表示範囲にパディングを加える係数。
 * 0.1 = 10% のマージン
 */
const BOUNDS_PADDING_RATIO = 0.1;

/** 1点のみの場合に使う仮の表示範囲（度） */
const SINGLE_POINT_EXTENT = 0.005;

// ────────────────────────────────────────────────────────────────────────────

/**
 * PhotoDoc 配列から位置情報付きの PhotoLocation を抽出する。
 * latitude / longitude が null / undefined / NaN の写真は除外する。
 */
export function getPhotoLocationsFromPhotos(photos: PhotoDoc[]): PhotoLocation[] {
  return photos
    .filter(
      (p): p is PhotoDoc & { latitude: number; longitude: number } =>
        p.latitude != null &&
        p.longitude != null &&
        !Number.isNaN(p.latitude) &&
        !Number.isNaN(p.longitude)
    )
    .map((p) => ({
      photoId: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      takenAt: p.takenAt ?? null,
      downloadURL: p.downloadURL ?? null,
    }));
}

/**
 * 位置情報一覧から地図表示範囲（MapBounds）を計算する。
 * 1点のみの場合は固定幅の範囲を返す。
 * ピンが端に貼り付かないよう BOUNDS_PADDING_RATIO のパディングを付加する。
 */
export function getMapBounds(locations: PhotoLocation[]): MapBounds {
  if (locations.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  }

  const lats = locations.map((l) => l.latitude);
  const lngs = locations.map((l) => l.longitude);

  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  // 1点のみ → 最小幅を確保
  if (maxLat - minLat < SINGLE_POINT_EXTENT) {
    const mid = (minLat + maxLat) / 2;
    minLat = mid - SINGLE_POINT_EXTENT / 2;
    maxLat = mid + SINGLE_POINT_EXTENT / 2;
  }
  if (maxLng - minLng < SINGLE_POINT_EXTENT) {
    const mid = (minLng + maxLng) / 2;
    minLng = mid - SINGLE_POINT_EXTENT / 2;
    maxLng = mid + SINGLE_POINT_EXTENT / 2;
  }

  // パディングを加算
  const latPad = (maxLat - minLat) * BOUNDS_PADDING_RATIO;
  const lngPad = (maxLng - minLng) * BOUNDS_PADDING_RATIO;

  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
  };
}

/**
 * 緯度経度を正規化してピンの表示位置（0〜1）に変換する。
 * - x: 経度 → 左右（west=0, east=1）
 * - y: 緯度 → 上下（north=0, south=1） ※スクリーン座標は上が 0 なので反転
 */
export function normalizeLocationToPoint(location: PhotoLocation, bounds: MapBounds): NormalizedPoint {
  const { minLat, maxLat, minLng, maxLng } = bounds;

  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  const x = latRange === 0 ? 0.5 : (location.longitude - minLng) / lngRange;
  // 緯度はスクリーン上方が大きい値なので反転
  const y = lngRange === 0 ? 0.5 : 1 - (location.latitude - minLat) / latRange;

  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/**
 * 近接する写真をスポットとして簡易グループ化する。
 *
 * アルゴリズム（Phase 8 簡易版）:
 * 1. 写真を順番に処理する。
 * 2. 既存グループの中心から PLACE_GROUP_THRESHOLD_DEGREES 以内なら同グループに追加。
 * 3. 近いグループがなければ新規グループを作成。
 * 4. グループの中心は含まれる写真の平均緯度経度で更新。
 *
 * Phase 9+ で Haversine 距離・住所ベース・ML クラスタリングに置き換え可能。
 */
export function groupNearbyLocations(locations: PhotoLocation[]): PlaceGroup[] {
  const groups: PlaceGroup[] = [];

  for (const loc of locations) {
    let matched = false;

    for (const group of groups) {
      const dLat = Math.abs(group.latitude - loc.latitude);
      const dLng = Math.abs(group.longitude - loc.longitude);

      if (dLat <= PLACE_GROUP_THRESHOLD_DEGREES && dLng <= PLACE_GROUP_THRESHOLD_DEGREES) {
        // グループに追加し、中心を再計算
        group.photoIds.push(loc.photoId);
        group.photoCount = group.photoIds.length;

        const n = group.photoCount;
        group.latitude = (group.latitude * (n - 1) + loc.latitude) / n;
        group.longitude = (group.longitude * (n - 1) + loc.longitude) / n;

        // 代表写真は最初に追加されたものを維持
        if (!group.coverPhotoURL && loc.downloadURL) {
          group.coverPhotoURL = loc.downloadURL;
        }

        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.push({
        id: `group_${loc.photoId}`,
        latitude: loc.latitude,
        longitude: loc.longitude,
        photoCount: 1,
        photoIds: [loc.photoId],
        coverPhotoURL: loc.downloadURL ?? null,
      });
    }
  }

  return groups;
}
