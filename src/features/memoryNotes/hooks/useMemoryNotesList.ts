import { MemoryNote } from '../../../types';

// Phase 1 で Firestore から取得する
// Phase 0 は空配列を返す

export interface UseMemoryNotesListResult {
  notes: MemoryNote[];
  isLoading: boolean;
  error: Error | null;
}

export function useMemoryNotesList(): UseMemoryNotesListResult {
  return {
    notes: [],
    isLoading: false,
    error: null,
  };
}
