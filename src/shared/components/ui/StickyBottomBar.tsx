// UI-1: StickyBottomBar — 編集画面下部の保存バー
// spec: min height 78, background colors.background (warm), top border, bottom safe area

import { View, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

type StickyBottomBarProps = {
  children: ReactNode;
};

export function StickyBottomBar({ children }: StickyBottomBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
