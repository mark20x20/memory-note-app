import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/client';

export interface AuthSession {
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

export function useAuthSession(): AuthSession {
  const [state, setState] = useState<AuthSession>({
    // If Firebase is not configured, skip loading state entirely
    isLoading: auth !== null,
    isAuthenticated: false,
    userId: null,
  });

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({
        isLoading: false,
        isAuthenticated: user !== null,
        userId: user?.uid ?? null,
      });
    });

    return unsubscribe;
  }, []);

  return state;
}
