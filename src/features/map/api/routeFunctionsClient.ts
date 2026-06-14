// Phase 12.5H-5: Route Functions — Cloud Functions Callable Client
//
// このファイルはクライアント SDK から Cloud Functions の route callable を呼び出す。
// - GOOGLE_ROUTES_API_KEY はクライアントでは扱わない（Secret Manager 経由）
// - region: asia-northeast1（既存の callable と統一）

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/core/firebase/client';
import type { PremiumRouteTravelMode, RouteSegmentSummary, SegmentTravelModeInput } from '../types';

// ── エラー整形ヘルパー ────────────────────────────────────────────────────────

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

// ── generateNoteRoutes ────────────────────────────────────────────────────────

export type GenerateNoteRoutesInput = {
  noteId: string;
  /** 全区間に適用する移動手段。segmentTravelModes と排他的。どちらか一方が必須 */
  travelMode?: PremiumRouteTravelMode;
  /** 区間別移動手段（Phase 12.5H-5.5 mixed route mode） */
  segmentTravelModes?: SegmentTravelModeInput[];
  forceRefresh?: boolean;
};

export type GenerateNoteRoutesResult = {
  noteId: string;
  travelMode?: PremiumRouteTravelMode;
  segmentCount: number;
  cacheHitCount: number;
  generatedCount: number;
  skippedCount: number;
};

export async function generateNoteRoutesCallable(
  input: GenerateNoteRoutesInput
): Promise<GenerateNoteRoutesResult> {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const fn = httpsCallable<GenerateNoteRoutesInput, GenerateNoteRoutesResult>(
    functions,
    'generateNoteRoutes'
  );
  try {
    const result = await fn(input);
    return result.data;
  } catch (err) {
    throw toCallableError(err);
  }
}

// ── getNoteRouteSegments ──────────────────────────────────────────────────────

export type GetNoteRouteSegmentsInput = {
  noteId: string;
  /** 省略すると全 travelMode のセグメントを返す（mixed mode 対応） */
  travelMode?: PremiumRouteTravelMode;
};

export type GetNoteRouteSegmentsResult = {
  noteId: string;
  travelMode?: PremiumRouteTravelMode;
  segments: RouteSegmentSummary[];
};

export async function getNoteRouteSegmentsCallable(
  input: GetNoteRouteSegmentsInput
): Promise<GetNoteRouteSegmentsResult> {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const fn = httpsCallable<GetNoteRouteSegmentsInput, GetNoteRouteSegmentsResult>(
    functions,
    'getNoteRouteSegments'
  );
  try {
    const result = await fn(input);
    return result.data;
  } catch (err) {
    throw toCallableError(err);
  }
}

// ── deleteNoteRouteCache ──────────────────────────────────────────────────────

export type DeleteNoteRouteCacheInput = {
  noteId: string;
  travelMode: PremiumRouteTravelMode | 'all';
};

export type DeleteNoteRouteCacheResult = {
  deletedCount: number;
};

export async function deleteNoteRouteCacheCallable(
  input: DeleteNoteRouteCacheInput
): Promise<DeleteNoteRouteCacheResult> {
  if (!functions) throw new Error('Firebase Functions not initialized');
  const fn = httpsCallable<DeleteNoteRouteCacheInput, DeleteNoteRouteCacheResult>(
    functions,
    'deleteNoteRouteCache'
  );
  try {
    const result = await fn(input);
    return result.data;
  } catch (err) {
    throw toCallableError(err);
  }
}
