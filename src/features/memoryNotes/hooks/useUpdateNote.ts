// Phase 10: useUpdateNote — ノート編集フック
// タイトル・メモ・種別・AI日記を更新する。

import { useState } from 'react';
import { noteRepository } from '@/core/repositories/noteRepository';
import type { NoteUpdateInput } from '@/core/repositories/noteRepository';

export interface UseUpdateNoteResult {
  update: (noteId: string, input: NoteUpdateInput) => Promise<void>;
  isUpdating: boolean;
  error: string | null;
}

export function useUpdateNote(): UseUpdateNoteResult {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (noteId: string, input: NoteUpdateInput): Promise<void> => {
    if (!input.title.trim()) {
      setError('タイトルを入力してください');
      return;
    }
    setIsUpdating(true);
    setError(null);
    try {
      await noteRepository.updateNote(noteId, input);
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
      throw new Error('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsUpdating(false);
    }
  };

  return { update, isUpdating, error };
}
