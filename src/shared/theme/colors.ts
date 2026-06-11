export const colors = {
  // Brand — coral accent (memory note warm theme)
  primary: '#F26B5B',
  primaryDark: '#D4503F',
  primaryLight: '#FEF0EE',

  // Map / location accent — teal
  mapAccent: '#4FA8A1',
  mapAccentLight: '#E6F4F3',

  // Neutrals
  black: '#000000',
  white: '#FFFFFF',
  gray50: '#FAF7F2',
  gray100: '#F4EEE6',
  gray200: '#E8DED4',
  gray300: '#D9CDBF',
  gray400: '#B8AD9F',
  gray500: '#7A746D',
  gray600: '#5A544D',
  gray700: '#3E3A35',
  gray800: '#2E2A27',
  gray900: '#1C1915',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Background
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceWarm: '#FFF9F4',
  surfaceIvory: '#F4EEE6',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#2E2A27',
  textSecondary: '#7A746D',
  textTertiary: '#B8AD9F',
  textDisabled: '#D9CDBF',
  textInverse: '#FFFFFF',

  // Border
  border: '#E8DED4',
  borderFocus: '#F26B5B',
} as const;

export type ColorKey = keyof typeof colors;
