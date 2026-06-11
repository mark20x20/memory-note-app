import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/firebase/client';

export type NoteType = 'personal' | 'shared';
export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface NoteInput {
  title: string;
  memo: string;
  noteType: NoteType;
}

export interface NoteDoc {
  id: string;
  ownerId: string;
  title: string;
  memo: string;
  noteType: NoteType;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  members: Record<string, MemberRole>;
}

export const noteRepository = {
  async createNote(uid: string, input: NoteInput): Promise<string> {
    if (!db) throw new Error('Firestore not configured');
    const ref = collection(db, 'memory_notes');
    const docRef = await addDoc(ref, {
      ownerId: uid,
      title: input.title.trim(),
      memo: input.memo.trim(),
      noteType: input.noteType,
      members: { [uid]: 'owner' as MemberRole },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getNotesByOwner(uid: string): Promise<NoteDoc[]> {
    if (!db) return [];
    const ref = collection(db, 'memory_notes');
    const q = query(ref, where('ownerId', '==', uid));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoteDoc));
    docs.sort((a, b) => {
      const aTime = a.createdAt?.seconds ?? 0;
      const bTime = b.createdAt?.seconds ?? 0;
      return bTime - aTime;
    });
    return docs;
  },

  async getNoteById(noteId: string): Promise<NoteDoc | null> {
    if (!db) return null;
    const ref = doc(db, 'memory_notes', noteId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as NoteDoc;
  },
};
