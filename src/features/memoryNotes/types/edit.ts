// UI-1: Edit screen type definitions
// UI-2: NoteEditDraft extended with noteType
// UI-26: NoteEditDraft extended with memoryDate

import type { NoteType } from '@/core/repositories/noteRepository';

export type EditTabKey = 'overview' | 'photos' | 'flows' | 'places' | 'memo';

export type NoteEditDraft = {
  title: string;
  memo: string;
  aiDiary: string;
  noteType: NoteType;
  /** UI-26: 思い出の日付。既存ノートは null（createdAt fallback で表示）*/
  memoryDate: Date | null;
};
