import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="ノート詳細"
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        <Text style={styles.emoji}>📖</Text>
        <Text style={styles.title}>ノート詳細</Text>
        <Text style={styles.noteId}>ID: {noteId}</Text>
        <Text style={styles.description}>
          ノートの内容表示は Phase 9・10 で実装予定です。{'\n'}
          写真・地図・AI日記・メンバー情報などが{'\n'}ここに表示されます。
        </Text>

        <View style={styles.placeholderNotice}>
          <Text style={styles.placeholderText}>
            ⚙️ 詳細表示・編集・削除は Phase 9 以降で実装予定
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  noteId: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  placeholderNotice: {
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
