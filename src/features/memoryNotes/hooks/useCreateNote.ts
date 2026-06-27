import { useState } from 'react';
import { noteRepository } from '@/core/repositories/noteRepository';
import type { NoteType } from '@/core/repositories/noteRepository';

export interface UseCreateNoteResult {
  title: string;
  setTitle: (v: string) => void;
  memo: string;
  setMemo: (v: string) => void;
  noteType: NoteType;
  setNoteType: (v: NoteType) => void;
  /** UI-26: 思い出の日付。初期値は今日 */
  memoryDate: Date;
  setMemoryDate: (d: Date) => void;
  isSaving: boolean;
  error: string | null;
  validate: () => boolean;
  saveNote: (uid: string) => Promise<string | null>;
}

export function useCreateNote(): UseCreateNoteResult {
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('personal');
  // UI-26: 思い出の日付（初期値: 今日の深夜0時）
  const [memoryDate, setMemoryDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return false;
    }
    setError(null);
    return true;
  }

  async function saveNote(uid: string): Promise<string | null> {
    if (!validate()) return null;
    setIsSaving(true);
    setError(null);
    try {
      const noteId = await noteRepository.createNote(uid, { title, memo, noteType, memoryDate });
      return noteId;
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return { title, setTitle, memo, setMemo, noteType, setNoteType, memoryDate, setMemoryDate, isSaving, error, validate, saveNote };
}
