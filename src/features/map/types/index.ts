// Phase 8: Map / Place Grouping — 型定義

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
