// UI-1: Edit screen type definitions
// UI-2 will extend NoteEditDraft with flowEdits and placeEdits

export type EditTabKey = 'overview' | 'photos' | 'flows' | 'places' | 'memo';

export type NoteEditDraft = {
  title: string;
  memo: string;
  aiDiary: string;
};
