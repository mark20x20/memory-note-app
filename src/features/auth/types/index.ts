export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  plan: 'free' | 'pro';
  createdAt: string | null;
  updatedAt: string | null;
};

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'needsProfileSetup'; uid: string; email: string | null }
  | { status: 'signedIn'; user: UserProfile };
