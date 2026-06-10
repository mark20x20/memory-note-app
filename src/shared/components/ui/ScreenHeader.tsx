import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ReactNode } from 'react';
import { colors } from '../../theme/colors';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: ReactNode;
}

export function ScreenHeader({ title, onBack, rightElement }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.right}>
        {rightElement ?? <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 22,
    color: colors.primary,
    lineHeight: 26,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 44,
  },
});
