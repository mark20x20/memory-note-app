import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';

const PLACEHOLDER_NOTES: never[] = [];

export default function HomeScreen() {
  const isEmpty = PLACEHOLDER_NOTES.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>思い出ノート</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(app)/settings')}
            hitSlop={8}
          >
            <Text style={styles.iconButtonText}>⚙</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.primaryIconButton]}
            onPress={() => router.push('/(app)/create')}
            hitSlop={8}
          >
            <Text style={styles.primaryIconButtonText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isEmpty ? (
        <EmptyState
          emoji="📝"
          title="ノートがありません"
          description={`写真を選んで\n最初の思い出ノートを作りましょう`}
          actionLabel="新しい思い出を作る"
          onAction={() => router.push('/(app)/create')}
        />
      ) : (
        <View style={styles.listPlaceholder}>
          <Text style={styles.listPlaceholderText}>
            ノート一覧は Phase 5 以降で実装予定
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 20,
  },
  primaryIconButton: {
    backgroundColor: colors.primary,
  },
  primaryIconButtonText: {
    color: colors.textInverse,
    fontSize: 22,
    lineHeight: 28,
  },
  listPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listPlaceholderText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});
