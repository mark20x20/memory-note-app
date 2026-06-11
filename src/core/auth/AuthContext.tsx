import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/core/firebase/client';
import type { AuthState, UserProfile } from '@/features/auth/types';

const AuthContext = createContext<AuthState>({ status: 'loading' });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(
    auth !== null ? { status: 'loading' } : { status: 'signedOut' }
  );

  useEffect(() => {
    if (!auth) {
      setState({ status: 'signedOut' });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ status: 'signedOut' });
        return;
      }

      setState({ status: 'loading' });

      if (!db) {
        setState({
          status: 'needsProfileSetup',
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (!snap.exists()) {
          setState({
            status: 'needsProfileSetup',
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          });
          return;
        }
        const data = snap.data();
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: data.email ?? null,
          displayName: data.displayName ?? '',
          photoURL: data.photoURL ?? null,
          plan: data.plan ?? 'free',
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
        };
        setState({ status: 'signedIn', user: profile });
      } catch {
        setState({
          status: 'needsProfileSetup',
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
      }
    });

    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
