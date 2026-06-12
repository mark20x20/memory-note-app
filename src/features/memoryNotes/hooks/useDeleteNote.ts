// Phase 10: useDeleteNote — ノート削除フック
// photos（Storage + Firestore）を削除してからノートドキュメントを削除し、Home へ戻る。

import { useState } from 'react';
import { router } from 'expo-router';
import { noteRepository } from '@/core/repositories/noteRepository';
import { photoRepository } from '@/core/repositories/photoRepository';

export interface UseDeleteNoteResult {
  deleteNote: (noteId: string) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

export function useDeleteNote(): UseDeleteNoteResult {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteNote = async (noteId: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);
    try {
      // 1. Storage 写真 + Firestore photos サブコレクションを削除
      await photoRepository.deletePhotosForNote(noteId);
      // 2. memory_notes ドキュメントを削除
      await noteRepository.deleteNote(noteId);
      // 3. Home へ遷移（履歴をリセット）
      router.replace('/(app)/home');
    } catch {
      setError('削除に失敗しました。もう一度お試しください。');
      throw new Error('削除に失敗しました。もう一度お試しください。');
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteNote, isDeleting, error };
}
