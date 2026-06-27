import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/colors';
import { useMemoryNotesList } from '@/features/memoryNotes/hooks/useMemoryNotesList';
import { formatMemoryDate } from '@/features/memoryNotes/utils/noteDate';
import type { NoteDoc } from '@/core/repositories/noteRepository';

export default function HomeScreen() {
  const { notes, isLoading, error } = useMemoryNotesList();
  const isEmpty = notes.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>思い出ノート</Text>
          <Text style={styles.headerSubtitle}>写真から、旅やおでかけを振り返ろう</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/(app)/settings')}
          hitSlop={8}
          accessibilityLabel="設定"
        >
          <Text style={styles.iconButtonText}>⚙</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>ノートの取得に失敗しました</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      ) : isEmpty ? (
        /* Empty state */
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyHero}>
            <View style={styles.emptyPhotoFrame}>
              <Text style={styles.emptyPhotoEmoji}>📷</Text>
            </View>
            <Text style={styles.emptyTitle}>
              最初の思い出ノートを{'\n'}作りましょう
            </Text>
            <Text style={styles.emptyDescription}>
              旅やおでかけの写真を選ぶだけで{'\n'}場所・時間・思い出を整理できます
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateButton}
              onPress={() => router.push('/(app)/create')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCreateButtonText}>📷　写真から作る</Text>
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
        /* Note list */
        <ScrollView
          contentContainerStyle={styles.listScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Primary CTA Card */}
          <CreateCtaCard />

          {/* Recent memories */}
          <Text style={styles.sectionTitle}>最近の思い出</Text>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onPress={() => router.push(`/(app)/notes/${note.id}`)}
            />
          ))}
        </ScrollView>
      )}

      {/* FAB — only when notes exist */}
      {!isEmpty && !isLoading && (
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

function CreateCtaCard() {
  return (
    <TouchableOpacity
      style={styles.ctaCard}
      onPress={() => router.push('/(app)/create')}
      activeOpacity={0.88}
    >
      <View style={styles.ctaCardInner}>
        <Text style={styles.ctaCardEmoji}>📔</Text>
        <View style={styles.ctaCardTextBlock}>
          <Text style={styles.ctaCardTitle}>新しい思い出を作る</Text>
          <Text style={styles.ctaCardDescription}>
            写真を選んで、場所・流れ・日記をまとめましょう
          </Text>
        </View>
      </View>
      <View style={styles.ctaCardButton}>
        <Text style={styles.ctaCardButtonText}>ノートを作る</Text>
      </View>
    </TouchableOpacity>
  );
}

function NoteCard({ note, onPress }: { note: NoteDoc; onPress: () => void }) {
  // UI-26: memoryDate 優先。既存ノートは createdAt fallback
  const dateStr = formatMemoryDate(note);
  const placeLabel = note.visitedPlacesSummary?.topPlaceLabels?.[0] ?? null;
  const displayTitle = note.title.trim() || '無題の思い出';

  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.85}>
      {/* Cover photo */}
      <View style={styles.noteCardCoverWrap}>
        {note.coverPhotoURL ? (
          <Image
            source={{ uri: note.coverPhotoURL }}
            style={styles.noteCardCoverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noteCardCoverPlaceholder}>
            <Text style={styles.noteCardCoverEmoji}>📷</Text>
          </View>
        )}
        {/* Shared badge overlay */}
        {note.noteType === 'shared' && (
          <View style={styles.sharedBadge}>
            <Text style={styles.sharedBadgeText}>🤝 共有</Text>
          </View>
        )}
      </View>

      {/* Card content */}
      <View style={styles.noteCardContent}>
        <Text style={styles.noteCardTitle} numberOfLines={2}>
          {displayTitle}
        </Text>

        {/* Meta chips */}
        <View style={styles.noteCardMeta}>
          {dateStr ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>📅 {dateStr}</Text>
            </View>
          ) : null}
          {placeLabel ? (
            <View style={[styles.metaChip, styles.metaChipPlace]}>
              <Text
                style={[styles.metaChipText, styles.metaChipPlaceText]}
                numberOfLines={1}
              >
                📍 {placeLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Memo excerpt */}
        {note.memo ? (
          <Text style={styles.noteCardMemo} numberOfLines={2}>
            {note.memo}
          </Text>
        ) : null}

        {/* Photo count */}
        {note.photoCount ? (
          <Text style={styles.noteCardPhotoCount}>📷 {note.photoCount}枚</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function FeatureHint({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
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

  // ── Header ──────────────────────────────────────
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

  // ── Loading ──────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },

  // ── Error ──────────────────────────────────────
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // ── Empty state ──────────────────────────────────────
  emptyScroll: {
    paddingBottom: 48,
  },
  emptyHero: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 48,
  },
  emptyPhotoFrame: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyPhotoEmoji: {
    fontSize: 52,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  emptyDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  emptyCreateButton: {
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
  emptyCreateButtonText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Feature hints ──────────────────────────────────────
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

  // ── Note list scroll ──────────────────────────────────────
  listScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 4,
  },

  // ── Primary CTA Card ──────────────────────────────────────
  ctaCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  ctaCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaCardEmoji: {
    fontSize: 36,
  },
  ctaCardTextBlock: {
    flex: 1,
  },
  ctaCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  ctaCardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  ctaCardButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaCardButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Note Card (photo-first) ──────────────────────────────────────
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  noteCardCoverWrap: {
    height: 180,
    backgroundColor: colors.surfaceIvory,
    position: 'relative',
  },
  noteCardCoverImage: {
    width: '100%',
    height: '100%',
  },
  noteCardCoverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCardCoverEmoji: {
    fontSize: 40,
  },
  sharedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.mapAccentLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sharedBadgeText: {
    fontSize: 12,
    color: colors.mapAccent,
    fontWeight: '600',
  },
  noteCardContent: {
    padding: 14,
    gap: 6,
  },
  noteCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  noteCardMeta: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaChip: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaChipPlace: {
    backgroundColor: colors.mapAccentLight,
    maxWidth: 160,
  },
  metaChipPlaceText: {
    color: colors.mapAccent,
  },
  noteCardMemo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  noteCardPhotoCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // ── FAB ──────────────────────────────────────
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
