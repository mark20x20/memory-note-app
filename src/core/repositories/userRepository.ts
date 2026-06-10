import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/core/firebase/client';
import type { UserProfile } from '@/features/auth/types';

export const userRepository = {
  async getUser(uid: string): Promise<UserProfile | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid,
      email: data.email ?? null,
      displayName: data.displayName ?? '',
      photoURL: data.photoURL ?? null,
      plan: data.plan ?? 'free',
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
    };
  },

  async createUser(uid: string, email: string | null, displayName: string): Promise<void> {
    if (!db) throw new Error('Firebase not configured');
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      displayName,
      photoURL: null,
      plan: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async updateUser(uid: string, data: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>): Promise<void> {
    if (!db) throw new Error('Firebase not configured');
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};
