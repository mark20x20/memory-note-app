import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '@/core/firebase/client';
import { mapAuthError } from '@/shared/errors/authErrors';

export const authRepository = {
  async signUp(email: string, password: string): Promise<{ uid: string; email: string | null }> {
    if (!auth) throw new Error('Firebase not configured');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return { uid: cred.user.uid, email: cred.user.email };
    } catch (e) {
      throw mapAuthError(e);
    }
  },

  async signIn(email: string, password: string): Promise<{ uid: string; email: string | null }> {
    if (!auth) throw new Error('Firebase not configured');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { uid: cred.user.uid, email: cred.user.email };
    } catch (e) {
      throw mapAuthError(e);
    }
  },

  async logout(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
  },
};
