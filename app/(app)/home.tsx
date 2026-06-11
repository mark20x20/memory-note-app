import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/colors';

const PLACEHOLDER_NOTES: never[] = [];

export default function HomeScreen() {
  const isEmpty = PLACEHOLDER_NOTES.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>思い出ノート</Text>
          <Text style={styles.headerSubtitle}>あなたの大切な記録</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(app)/settings')}
            hitSlop={8}
            accessibilityLabel="設定"
          >
            <Text style={styles.iconButtonText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isEmpty ? (
        <ScrollView contentContainerStyle={styles.emptyScroll} showsVerticalScrollIndicator={false}>
          {/* Empty state hero */}
          <View style={styles.emptyHero}>
            <Text style={styles.emptyEmoji}>📷</Text>
            <Text style={styles.emptyTitle}>まだノートがありません</Text>
            <Text style={styles.emptyDescription}>
              写真を選ぶだけで、日付・場所・AIコメント付きの{'\n'}思い出ノートが自動で作れます
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(app)/create')}
              activeOpacity={0.85}
            >
              <Text style={styles.createButtonText}>＋　最初の思い出を作る</Text>
            </TouchableOpacity>
          </View>

          {/* Feature hints */}
          <View style={styles.hintsSection}>
            <Text style={styles.hintsSectionTitle}>できること</Text>
            <View style={styles.hintCard}>
              <FeatureHint
                emoji="🗺"
                title="地図で振り返る"
                description="訪れた場所がマップ上に並びます"
              />
              <HintDivider />
              <FeatureHint
                emoji="🤝"
                title="一緒に作る"
                description="家族や友人とノートを共有できます"
              />
              <HintDivider />
              <FeatureHint
                emoji="📤"
                title="SNSにシェア"
                description="美しい共有カードで思い出を伝えます"
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
          {/* Note list — Phase 5 以降で実装 */}
          <View style={styles.listPlaceholder}>
            <Text style={styles.listPlaceholderText}>
              ノート一覧は Phase 5 以降で実装予定
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Floating create button */}
      {!isEmpty && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/create')}
          activeOpacity={0.85}
          accessibilityLabel="新しい思い出を作る"
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function FeatureHint({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <View style={styles.featureHint}>
      <Text style={styles.featureHintEmoji}>{emoji}</Text>
      <View style={styles.featureHintText}>
        <Text style={styles.featureHintTitle}>{title}</Text>
        <Text style={styles.featureHintDescription}>{description}</Text>
      </View>
    </View>
  );
}

function HintDivider() {
  return <View style={styles.hintDivider} />;
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
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
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
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 18,
  },
  // Empty state
  emptyScroll: {
    paddingBottom: 40,
  },
  emptyHero: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 48,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Feature hints
  hintsSection: {
    paddingHorizontal: 20,
  },
  hintsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  hintCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  featureHintEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  featureHintText: {
    flex: 1,
  },
  featureHintTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureHintDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  hintDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 66,
  },
  // Note list (non-empty)
  listScroll: {
    paddingBottom: 100,
  },
  listPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  listPlaceholderText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: colors.textInverse,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '400',
  },
});
