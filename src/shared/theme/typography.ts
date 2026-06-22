import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: colors.textPrimary,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.textTertiary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
  },
  // UI-1 spec variants
  display: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: colors.textPrimary,
  },
  bodyMd: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  micro: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.textTertiary,
  },
});
