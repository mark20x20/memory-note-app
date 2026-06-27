import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/core/firebase/client';
import type { AuthState, UserProfile } from '@/features/auth/types';

const AuthContext = createContext<AuthState>({ status: 'loading' });

// Separate context for the refresh function so useAuth() return type stays AuthState.
// Call refreshUser() after writing to Firestore (e.g. profile-setup) to force
// AuthContext to re-fetch the user doc and transition to signedIn.
const AuthRefreshContext = createContext<() => Promise<void>>(async () => {});

export function useRefreshAuth(): () => Promise<void> {
  return useContext(AuthRefreshContext);
}

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

  // Called by profile-setup after writing the user doc to Firestore.
  // onAuthStateChanged does not re-fire on Firestore writes, so we must
  // manually re-fetch the profile and transition to signedIn.
  const refreshUser = useCallback(async (): Promise<void> => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return;
    setState({ status: 'loading' });
    if (!db) {
      setState({ status: 'needsProfileSetup', uid: currentUser.uid, email: currentUser.email });
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (!snap.exists()) {
        setState({ status: 'needsProfileSetup', uid: currentUser.uid, email: currentUser.email });
        return;
      }
      const data = snap.data();
      const profile: UserProfile = {
        uid: currentUser.uid,
        email: data.email ?? null,
        displayName: data.displayName ?? '',
        photoURL: data.photoURL ?? null,
        plan: data.plan ?? 'free',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
      setState({ status: 'signedIn', user: profile });
    } catch {
      setState({ status: 'needsProfileSetup', uid: currentUser.uid, email: currentUser.email });
    }
  }, []);

  return (
    <AuthContext.Provider value={state}>
      <AuthRefreshContext.Provider value={refreshUser}>
        {children}
      </AuthRefreshContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
