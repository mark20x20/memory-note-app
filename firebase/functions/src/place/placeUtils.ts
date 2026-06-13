// Phase 12.5C: GPS グルーピング・距離計算ユーティリティ
// Phase 8 の groupNearbyLocations アルゴリズムを Cloud Functions 側に移植。
// Phase 12.5G-1: 時刻 + GPS による訪問イベント分割を追加。
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

// ── Food-related ノート判定 ───────────────────────────────────────────────────

/** isFoodRelatedNote の判定に使用するノートの最小フィールド型 */
export type NoteLike = {
  title?: unknown;
  memo?: unknown;
  noteType?: unknown;
};

const FOOD_KEYWORDS_EN = [
  'restaurant', 'cafe', 'coffee', 'food', 'meal',
  'lunch', 'dinner', 'breakfast',
];
const FOOD_KEYWORDS_JA = [
  'レストラン', 'カフェ', 'ご飯', '食事', '料理',
  'ランチ', 'ディナー', '食べ', '飲み', '山葵', '日料',
];
const FOOD_NOTE_TYPES = ['restaurant', 'food', 'cafe'];

/**
 * ノートの noteType / title / memo から飲食系かを簡易判定する。
 * ヒューリスティック判定のため誤判定あり。Phase 12.5E 以降で精度を上げる。
 */
export function isFoodRelatedNote(note: NoteLike): boolean {
  const noteType = String(note.noteType ?? '').toLowerCase();
  if (FOOD_NOTE_TYPES.some((t) => noteType.includes(t))) return true;

  const text = [
    String(note.title ?? ''),
    String(note.memo ?? ''),
  ].join(' ').toLowerCase();

  return [...FOOD_KEYWORDS_EN, ...FOOD_KEYWORDS_JA].some((k) => text.includes(k));
}

// ── 時刻 + GPS による訪問イベント分割 ─────────────────────────────────────────

/**
 * 写真から takenAt を Date に変換する。
 * - string (ISO 8601) → Date
 * - Firestore Timestamp({ toDate() }) → Date
 * - null / undefined → null
 */
function resolvePhotoDate(
  val: string | null | undefined | { toDate(): Date }
): Date | null {
  if (!val) return null;
  if (typeof val === 'string') {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof (val as { toDate(): Date }).toDate === 'function') {
    return (val as { toDate(): Date }).toDate();
  }
  return null;
}

/** 距離しきい値: 80m を超えたら別イベント */
const EVENT_DISTANCE_THRESHOLD_METERS = 80;

/** 時間しきい値: 90分を超えたら別イベント */
const EVENT_TIME_THRESHOLD_MS = 90 * 60 * 1000;

/**
 * GPS 写真を takenAt + 距離でイベント分割し、LocalPlaceGroup[] を返す。
 *
 * アルゴリズム:
 * 1. takenAt がある写真を takenAt 昇順に並べる
 * 2. takenAt がない写真は末尾に createdAt 昇順で追加
 * 3. 前の写真との距離 > 80m または時間差 > 90分 → 新イベント
 * 4. 各イベントの代表座標は含まれる写真の平均
 * 5. sortOrder = 0, 1, 2, ...（最大 MAX_PLACE_GROUPS 件）
 * 6. coverPhotoURL = 最初の写真の downloadURL
 */
export function groupPhotosByTimeAndDistance(
  photos: Array<PhotoData & { latitude: number; longitude: number }>
): LocalPlaceGroup[] {
  if (photos.length === 0) return [];

  // takenAt を解決して仮 Date を付与
  type PhotoWithDate = typeof photos[0] & { _sortDate: Date | null };
  const withDates: PhotoWithDate[] = photos.map((p) => ({
    ...p,
    _sortDate:
      resolvePhotoDate(p.takenAt as string | null | { toDate(): Date }) ??
      resolvePhotoDate(p.createdAt as string | null | { toDate(): Date }),
  }));

  // takenAt ありを先（昇順）、なしを末尾
  const withTime = withDates.filter((p) => p._sortDate !== null).sort(
    (a, b) => a._sortDate!.getTime() - b._sortDate!.getTime()
  );
  const withoutTime = withDates.filter((p) => p._sortDate === null);

  const ordered = [...withTime, ...withoutTime];

  const groups: Array<{
    sumLat: number;
    sumLng: number;
    count: number;
    photoIds: string[];
    coverPhotoURL: string | null;
    startAt: Date | null;
    endAt: Date | null;
    lastLat: number;
    lastLng: number;
    lastDate: Date | null;
  }> = [];

  for (const photo of ordered) {
    const date = photo._sortDate;
    let placed = false;

    if (groups.length > 0) {
      const last = groups[groups.length - 1];
      const distM = haversineDistance(last.lastLat, last.lastLng, photo.latitude, photo.longitude);
      const timeDiffMs = date && last.lastDate
        ? Math.abs(date.getTime() - last.lastDate.getTime())
        : 0;

      const tooFar = distM > EVENT_DISTANCE_THRESHOLD_METERS;
      const tooLong = date && last.lastDate
        ? timeDiffMs > EVENT_TIME_THRESHOLD_MS
        : false;

      if (!tooFar && !tooLong) {
        // 同じグループに追加
        last.count++;
        last.sumLat += photo.latitude;
        last.sumLng += photo.longitude;
        last.photoIds.push(photo.id);
        last.lastLat = photo.latitude;
        last.lastLng = photo.longitude;
        if (date) last.endAt = date;
        if (date && !last.lastDate) last.lastDate = date;
        else if (date) last.lastDate = date;
        placed = true;
      }
    }

    if (!placed) {
      groups.push({
        sumLat: photo.latitude,
        sumLng: photo.longitude,
        count: 1,
        photoIds: [photo.id],
        coverPhotoURL: photo.downloadURL ?? null,
        startAt: date,
        endAt: date,
        lastLat: photo.latitude,
        lastLng: photo.longitude,
        lastDate: date,
      });
    }
  }

  // LocalPlaceGroup に変換して sortOrder を付与、最大 MAX_PLACE_GROUPS 件に絞る
  return groups.slice(0, MAX_PLACE_GROUPS).map((g, idx) => ({
    latitude: g.sumLat / g.count,
    longitude: g.sumLng / g.count,
    photoIds: g.photoIds,
    photoCount: g.photoIds.length,
    coverPhotoURL: g.coverPhotoURL,
    startAt: g.startAt,
    endAt: g.endAt,
    sortOrder: idx,
  }));
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
