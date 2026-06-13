// Phase 12.5C: Place Intelligence — Cloud Functions Callable Client
//
// このファイルはクライアント SDK から Cloud Functions の callable を呼び出す。
// - Google Places API キーをクライアントでは扱わない
// - API キーは Cloud Functions の Secret Manager 経由でのみ参照する
// - region: asia-northeast1

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/core/firebase/client';

// ── エラー整形ヘルパー ──────────────────────────────────────────────────────────

export type CallableError = {
  code: string;
  message: string;
};

function toCallableError(err: unknown): CallableError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    return {
      code: String((err as { code: unknown }).code),
      message: String((err as { message: unknown }).message),
    };
  }
  if (err instanceof Error) {
    return { code: 'unknown', message: err.message };
  }
  return { code: 'unknown', message: String(err) };
}

// ── enrichNotePlaces ──────────────────────────────────────────────────────────

// Phase 12.5G-2: イベント分割プリセット
export type GroupingPreset = 'compact' | 'standard' | 'relaxed';

export const GROUPING_PRESETS = {
  compact:  { timeGapMinutes: 30,  distanceGapMeters: 50  },
  standard: { timeGapMinutes: 90,  distanceGapMeters: 80  },
  relaxed:  { timeGapMinutes: 180, distanceGapMeters: 120 },
} as const;

export type EnrichNotePlacesInput = {
  noteId: string;
  forceRefresh?: boolean;
  /** Phase 12.5G-2: イベント分割しきい値（省略時はサーバーデフォルト 90分/80m） */
  grouping?: { timeGapMinutes?: number; distanceGapMeters?: number };
};

export type EnrichNotePlacesResult = {
  success: boolean;
  status: string;
  placeGroupsCreated?: number;
  message?: string;
};

export async function enrichNotePlacesCallable(
  input: EnrichNotePlacesInput
): Promise<EnrichNotePlacesResult> {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const fn = httpsCallable<EnrichNotePlacesInput, EnrichNotePlacesResult>(
    functions,
    'enrichNotePlaces'
  );
  try {
    const result = await fn(input);
    return result.data;
  } catch (err) {
    throw toCallableError(err);
  }
}

// ── getPlaceCandidatesForGroup ────────────────────────────────────────────────

export type GetPlaceCandidatesInput = {
  noteId: string;
  placeGroupId: string;
};

export type PlaceCandidateResult = {
  candidateId: string;
  name: string;
  address?: string;
  types: string[];
  distanceMeters?: number;
  rating?: number;
  confidence?: number;
};

export type GetPlaceCandidatesResult = {
  candidates: PlaceCandidateResult[];
  cacheHit: boolean;
};

export async function getPlaceCandidatesForGroupCallable(
  input: GetPlaceCandidatesInput
): Promise<GetPlaceCandidatesResult> {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const fn = httpsCallable<GetPlaceCandidatesInput, GetPlaceCandidatesResult>(
    functions,
    'getPlaceCandidatesForGroup'
  );
  try {
    const result = await fn(input);
    return result.data;
  } catch (err) {
    throw toCallableError(err);
  }
}

// ── refreshPlaceCandidates ────────────────────────────────────────────────────

export type RefreshPlaceCandidatesInput = {
  noteId: string;
  placeGroupId: string;
};

export type RefreshPlaceCandidatesResult = {
  candidatesCount: number;
  refreshedAt: string;
};

export async function refreshPlaceCandidatesCallable(
  input: RefreshPlaceCandidatesInput
): Promise<RefreshPlaceCandidatesResult> {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const fn = httpsCallable<RefreshPlaceCandidatesInput, RefreshPlaceCandidatesResult>(
    functions,
    'refreshPlaceCandidates'
  );
  try {
    const result = await fn(input);
    return result.data;
  } catch (err) {
    throw toCallableError(err);
  }
}

// ── selectPlaceCandidate ──────────────────────────────────────────────────────

export type SelectPlaceCandidateInput = {
  noteId: string;
  placeGroupId: string;
  candidateId: string;
};

export type SelectPlaceCandidateResult = {
  success: boolean;
  updatedLabel: string;
  updatedCategory: string;
};

export async function selectPlaceCandidateCallable(
  input: SelectPlaceCandidateInput
): Promise<SelectPlaceCandidateResult> {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const fn = httpsCallable<SelectPlaceCandidateInput, SelectPlaceCandidateResult>(
    functions,
    'selectPlaceCandidate'
  );
  try {
    const result = await fn(input);
    return result.data;
  } catch (err) {
    throw toCallableError(err);
  }
}

// ── updatePlaceGroupManually ──────────────────────────────────────────────────

export type UpdatePlaceGroupManuallyInput = {
  noteId: string;
  placeGroupId: string;
  label: string;
  category: string;
};

export type UpdatePlaceGroupManuallyResult = {
  success: boolean;
};

export async function updatePlaceGroupManuallyCallable(
  input: UpdatePlaceGroupManuallyInput
): Promise<UpdatePlaceGroupManuallyResult> {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const fn = httpsCallable<UpdatePlaceGroupManuallyInput, UpdatePlaceGroupManuallyResult>(
    functions,
    'updatePlaceGroupManually'
  );
  try {
    const result = await fn(input);
    return result.data;
  } catch (err) {
    throw toCallableError(err);
  }
}
