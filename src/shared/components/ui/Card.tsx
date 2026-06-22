import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, // 20 — matches spec radius.card
    overflow: 'hidden',
  },
});
