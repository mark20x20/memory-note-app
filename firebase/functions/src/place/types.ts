// Phase 12.5C: Place Intelligence — Cloud Functions 側の型定義
// firebase-admin の Timestamp を使用（クライアント SDK の firebase/firestore とは別）

import type { Timestamp } from 'firebase-admin/firestore';

export type PlaceEnrichmentStatus = 'idle' | 'fetching' | 'completed' | 'failed';

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

export type PlaceGroupSource = 'gps' | 'places_api' | 'ai_assisted' | 'manual';

export type PlaceCandidateProvider = 'google' | 'foursquare' | 'osm' | 'geocoding' | 'manual';

export type PlaceCandidateSource = 'places_api' | 'geocoding' | 'ai_ranked' | 'manual';

export type PlaceGroupDoc = {
  id: string;
  noteId: string;
  latitude: number;
  longitude: number;
  label: string;
  category: PlaceCategory;
  photoIds: string[];
  photoCount: number;
  coverPhotoURL?: string | null;
  selectedCandidateId?: string;
  selectedProviderPlaceId?: string;
  confidence: number;
  userConfirmed: boolean;
  userEditedLabel?: string;
  source: PlaceGroupSource;
  // Phase 12.5G-1: 訪問イベント時刻・順序
  startAt?: Timestamp | null;
  endAt?: Timestamp | null;
  sortOrder?: number;
  // Phase 12.5G-2: イベント内写真プレビュー（最大3枚の downloadURL）
  photoPreviewURLs?: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type PlaceCandidateDoc = {
  id: string;
  provider: PlaceCandidateProvider;
  providerPlaceId?: string;
  name: string;
  address?: string;
  types: string[];
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  rating?: number;
  confidence?: number;
  source: PlaceCandidateSource;
  fetchedAt: Timestamp;
};

// ── GPS グルーピング用の内部型 ──────────────────────────────────────────────────

export type PhotoData = {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  downloadURL?: string | null;
  // Phase 12.5G-1: 撮影時刻（ISO 8601 文字列 or Firestore Timestamp）
  takenAt?: string | null | { toDate(): Date };
  createdAt?: string | null | { toDate(): Date };
};

export type LocalPlaceGroup = {
  latitude: number;
  longitude: number;
  photoIds: string[];
  photoCount: number;
  coverPhotoURL?: string | null;
  // Phase 12.5G-1: 訪問イベント情報
  startAt?: Date | null;
  endAt?: Date | null;
  sortOrder?: number;
  // Phase 12.5G-2: イベント内写真プレビュー（最大3枚の downloadURL）
  photoPreviewURLs?: string[];
};

// ── Google Places API (New) レスポンス型 ────────────────────────────────────────

export type GooglePlacesResponse = {
  places?: GooglePlace[];
};

export type GooglePlace = {
  id?: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  types?: string[];
  location?: { latitude: number; longitude: number };
  rating?: number;
};
