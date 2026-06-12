// Phase 9: useNoteDetail — memory_notes/{noteId} を onSnapshot でリアルタイム購読
// aiDiaryStatus の変化を Detail 画面へ即時反映するため、1回取得ではなく購読を使う。

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/core/firebase/client';
import type { NoteDoc } from '@/core/repositories/noteRepository';

export interface UseNoteDetailResult {
  note: NoteDoc | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * ノートドキュメントをリアルタイムで購読するフック。
 * noteId が null の場合は空状態を返す。
 *
 * Phase 9 で onSnapshot に切り替えた理由:
 * - aiDiaryStatus ('generating' → 'completed' / 'failed') の変化を
 *   モバイル側から別途ポーリングすることなく自動反映するため。
 */
export function useNoteDetail(noteId: string | null): UseNoteDetailResult {
  const [note, setNote] = useState<NoteDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!noteId || !db) {
      setNote(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const noteRef = doc(db, 'memory_notes', noteId);
    const unsubscribe = onSnapshot(
      noteRef,
      (snap) => {
        if (snap.exists()) {
          setNote({ id: snap.id, ...snap.data() } as NoteDoc);
        } else {
          setNote(null);
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [noteId]);

  return { note, isLoading, error };
}
