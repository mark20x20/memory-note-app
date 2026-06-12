// Phase 11: useNoteMembers
// ノートの members マップから各ユーザーのプロフィールを取得して表示用配列を返す。
// Firestore の users/{uid} を1件ずつ取得（onSnapshot ではなく getDoc で十分）。
// members マップが変わるたびに再取得する。

import { useEffect, useState, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/core/firebase/client';
import type { NoteDoc, MemberRole } from '@/core/repositories/noteRepository';

// ── 型定義 ───────────────────────────────────────────────────────────────────

export type MemberProfile = {
  uid: string;
  role: MemberRole;
  displayName: string;
  email: string | null;
  photoURL: string | null;
};

// ロール表示順: owner → editor → viewer
const ROLE_ORDER: Record<MemberRole, number> = { owner: 0, editor: 1, viewer: 2 };

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseNoteMembersResult {
  members: MemberProfile[];
  isLoading: boolean;
}

export function useNoteMembers(note: NoteDoc | null): UseNoteMembersResult {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // members マップの変化を検知するための安定した文字列キー
  const membersKey = note ? JSON.stringify(note.members ?? {}) : null;
  const prevKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!note || !db || membersKey === null) {
      setMembers([]);
      return;
    }

    // members が変わっていなければ再取得しない
    if (prevKeyRef.current === membersKey) return;
    prevKeyRef.current = membersKey;

    const uids = Object.keys(note.members ?? {});
    if (uids.length === 0) {
      setMembers([]);
      return;
    }

    setIsLoading(true);
    let cancelled = false;

    Promise.all(
      uids.map(async (uid): Promise<MemberProfile> => {
        try {
          const snap = await getDoc(doc(db!, 'users', uid));
          const data = snap.exists() ? snap.data() : null;
          return {
            uid,
            role: note.members[uid],
            displayName: data?.displayName ?? `ユーザー(${uid.slice(0, 6)})`,
            email: data?.email ?? null,
            photoURL: data?.photoURL ?? null,
          };
        } catch {
          return {
            uid,
            role: note.members[uid],
            displayName: `ユーザー(${uid.slice(0, 6)})`,
            email: null,
            photoURL: null,
          };
        }
      })
    ).then((profiles) => {
      if (cancelled) return;
      profiles.sort((a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3));
      setMembers(profiles);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersKey]);

  return { members, isLoading };
}
