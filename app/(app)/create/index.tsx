import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';

const CREATION_STEPS = [
  {
    step: 1,
    emoji: '📷',
    title: '写真を選ぶ',
    description: 'カメラロールから複数枚選択。GPS情報があれば自動で地図に配置されます。',
    available: false,
  },
  {
    step: 2,
    emoji: '🤖',
    title: 'AIが整理する',
    description: '日付・場所・タイトルを自動生成。内容は後から編集できます。',
    available: false,
  },
  {
    step: 3,
    emoji: '📖',
    title: 'ノートが完成',
    description: '写真・地図・日記がひとまとめに。友達や家族と共有もできます。',
    available: false,
  },
] as const;

export default function CreateScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="新しい思い出を作る"
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>📸</Text>
          <Text style={styles.heroTitle}>写真を選んで{'\n'}思い出ノートを作ろう</Text>
          <Text style={styles.heroDescription}>
            写真を選ぶだけで、日付・場所・AIコメント付きの思い出ノートが自動で作れます
          </Text>
        </View>

        {/* Primary action */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            disabled
          >
            <Text style={styles.primaryButtonText}>📷　写真を選ぶ</Text>
          </TouchableOpacity>
          <Text style={styles.comingSoonNote}>写真選択・AI生成は Phase 5 以降で実装予定</Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsSection}>
          <Text style={styles.stepsSectionTitle}>作成の流れ</Text>
          <View style={styles.stepsCard}>
            {CREATION_STEPS.map((item, index) => (
              <View key={item.step}>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{item.step}</Text>
                  </View>
                  <Text style={styles.stepEmoji}>{item.emoji}</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{item.title}</Text>
                    <Text style={styles.stepDescription}>{item.description}</Text>
                  </View>
                </View>
                {index < CREATION_STEPS.length - 1 && (
                  <View style={styles.stepConnector} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Note types placeholder */}
        <View style={styles.noteTypesSection}>
          <Text style={styles.stepsSectionTitle}>ノートの種類</Text>
          <View style={styles.noteTypesRow}>
            <View style={[styles.noteTypeCard, styles.noteTypeCardActive]}>
              <Text style={styles.noteTypeEmoji}>👤</Text>
              <Text style={styles.noteTypeLabel}>個人ノート</Text>
              <Text style={styles.noteTypeDesc}>自分だけの記録</Text>
            </View>
            <View style={[styles.noteTypeCard, styles.noteTypeCardDimmed]}>
              <Text style={styles.noteTypeEmoji}>🤝</Text>
              <Text style={styles.noteTypeLabel}>共有ノート</Text>
              <Text style={styles.noteTypeDesc}>友人・家族と共同編集</Text>
            </View>
          </View>
          <Text style={styles.comingSoonNote}>共有ノートは Phase 10 以降で実装予定</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 32,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 36,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 12,
    opacity: 0.4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  comingSoonNote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  stepsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  stepsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    gap: 12,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceIvory,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepEmoji: {
    fontSize: 22,
    marginTop: -2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  stepConnector: {
    width: 1.5,
    height: 12,
    backgroundColor: colors.border,
    marginLeft: 27,
  },
  noteTypesSection: {
    paddingHorizontal: 20,
  },
  noteTypesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  noteTypeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  noteTypeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  noteTypeCardDimmed: {
    opacity: 0.5,
  },
  noteTypeEmoji: {
    fontSize: 28,
  },
  noteTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noteTypeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
