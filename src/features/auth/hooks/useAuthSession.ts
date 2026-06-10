/**
 * useAuthSession forwards to useAuth (AuthContext) so that all components
 * share the single Firebase Auth subscription set up in AuthProvider.
 */
import { useAuth } from '@/core/auth/AuthContext';
import type { AuthState } from '@/features/auth/types';

export type { AuthState };

export function useAuthSession(): AuthState {
  return useAuth();
}
