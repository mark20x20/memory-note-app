// Phase 11: useMemoryNotesList — owner ノートと共有ノートを両方取得する。
// 2つの onSnapshot を管理し、クライアント側でマージ・重複排除・ソートを行う。
//
// Query 1: where('ownerId', '==', uid)  — 自分が作ったノート
// Query 2: where(`members.${uid}`, 'in', ['editor', 'viewer'])  — 共有されたノート
//
// Phase 10 までは ownerId のみだったが、Phase 11 で共有ノートも表示するよう拡張。

import { useEffect, useMemo, useState } from 'react';
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

  const [ownedNotes, setOwnedNotes] = useState<NoteDoc[]>([]);
  const [memberNotes, setMemberNotes] = useState<NoteDoc[]>([]);
  const [ownedLoaded, setOwnedLoaded] = useState(false);
  const [memberLoaded, setMemberLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setOwnedNotes([]);
      setMemberNotes([]);
      setOwnedLoaded(false);
      setMemberLoaded(false);
      return;
    }
    if (!db) {
      setOwnedNotes([]);
      setMemberNotes([]);
      setOwnedLoaded(true);
      setMemberLoaded(true);
      return;
    }

    setIsLoading(true);
    setOwnedLoaded(false);
    setMemberLoaded(false);
    setError(null);

    // Query 1: 自分が owner のノート
    const q1 = query(collection(db, 'memory_notes'), where('ownerId', '==', uid));
    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        setOwnedNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoteDoc)));
        setOwnedLoaded(true);
      },
      (err) => {
        setError(err);
        setOwnedLoaded(true);
        setIsLoading(false);
      }
    );

    // Query 2: 共有ノート（editor / viewer として参加しているノート）
    // members.{uid} フィールドが 'editor' または 'viewer' のノートを取得。
    // Firestore の auto-index を使用する。失敗時は空配列にフォールバック。
    const q2 = query(
      collection(db, 'memory_notes'),
      where(`members.${uid}`, 'in', ['editor', 'viewer'])
    );
    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        setMemberNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoteDoc)));
        setMemberLoaded(true);
      },
      (err) => {
        // 共有ノートクエリが失敗してもアプリを壊さない（インデックス未作成時など）
        console.warn('[useMemoryNotesList] member notes query failed:', err.message);
        setMemberNotes([]);
        setMemberLoaded(true);
      }
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [uid]);

  // 両クエリが完了したら isLoading を解除
  useEffect(() => {
    if (ownedLoaded && memberLoaded) {
      setIsLoading(false);
    }
  }, [ownedLoaded, memberLoaded]);

  // マージ・重複排除・日時降順ソート
  const notes = useMemo(() => {
    const map = new Map<string, NoteDoc>();
    for (const note of ownedNotes) map.set(note.id, note);
    for (const note of memberNotes) {
      if (!map.has(note.id)) map.set(note.id, note);
    }
    const all = Array.from(map.values());
    all.sort((a, b) => {
      const aTime = a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? 0;
      return bTime - aTime;
    });
    return all;
  }, [ownedNotes, memberNotes]);

  return { notes, isLoading, error };
}
