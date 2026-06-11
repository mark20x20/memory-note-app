import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/core/firebase/client';
import { useAuth } from '@/core/auth/AuthContext';
import type { NoteDoc } from '@/core/repositories/noteRepository';

export interface UseMemoryNotesListResult {
  notes: NoteDoc[];
  isLoading: boolean;
  error: Error | null;
}

export function useMemoryNotesList(): UseMemoryNotesListResult {
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;
  const [notes, setNotes] = useState<NoteDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setNotes([]);
      return;
    }
    if (!db) {
      setNotes([]);
      return;
    }

    setIsLoading(true);

    const q = query(collection(db, 'memory_notes'), where('ownerId', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoteDoc));
        docs.sort((a, b) => {
          const aTime = a.createdAt?.seconds ?? 0;
          const bTime = b.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });
        setNotes(docs);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  return { notes, isLoading, error };
}
