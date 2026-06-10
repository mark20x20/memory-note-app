import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';

export default function CreateScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="新しい思い出を作る"
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        <Text style={styles.emoji}>📸</Text>
        <Text style={styles.title}>写真を選んで{'\n'}思い出ノートを作ろう</Text>
        <Text style={styles.description}>
          写真を選ぶだけで、日付・場所・AIコメント付きの{'\n'}思い出ノートが自動で作れます
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            // TODO Phase 5: 写真ピッカーへ
          }}
        >
          <Text style={styles.primaryButtonText}>📷　写真を選ぶ</Text>
        </TouchableOpacity>

        <View style={styles.placeholderNotice}>
          <Text style={styles.placeholderText}>
            ⚙️ 写真選択・AI生成は Phase 5 以降で実装予定
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
    lineHeight: 32,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '600',
  },
  placeholderNotice: {
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
