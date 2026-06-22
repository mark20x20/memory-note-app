// UI-1: Edit screen type definitions
// UI-2: NoteEditDraft extended with noteType

import type { NoteType } from '@/core/repositories/noteRepository';

export type EditTabKey = 'overview' | 'photos' | 'flows' | 'places' | 'memo';

export type NoteEditDraft = {
  title: string;
  memo: string;
  aiDiary: string;
  noteType: NoteType;
};
