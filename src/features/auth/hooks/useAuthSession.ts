// Phase 1 で Firebase Auth と接続する
// Phase 0 は仮の値を返す

export interface AuthSession {
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
}

export function useAuthSession(): AuthSession {
  return {
    isLoading: false,
    isAuthenticated: false,
    userId: null,
  };
}
