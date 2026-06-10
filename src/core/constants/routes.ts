export const ROUTES = {
  ROOT: '/',
  AUTH: {
    ONBOARDING: '/(auth)/onboarding',
    LOGIN: '/(auth)/login',
  },
  APP: {
    HOME: '/(app)/home',
  },
  NOT_FOUND: '/+not-found',
} as const;
