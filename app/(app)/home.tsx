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
import type { NoteDoc } from '@/core/repositories/noteRepository';

function formatDate(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const { notes, isLoading, error } = useMemoryNotesList();
  const isEmpty = notes.length === 0;

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
        <ScrollView contentContainerStyle={styles.emptyScroll} showsVerticalScrollIndicator={false}>
          {/* Empty state hero */}
          <View style={styles.emptyHero}>
            <Text style={styles.emptyEmoji}>📷</Text>
            <Text style={styles.emptyTitle}>まだノートがありません</Text>
            <Text style={styles.emptyDescription}>
              タイトルとメモを入力するだけで{'\n'}思い出ノートが作れます
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
              <FeatureHint emoji="🗺" title="地図で振り返る" description="訪れた場所がマップ上に並びます" />
              <HintDivider />
              <FeatureHint emoji="🤝" title="一緒に作る" description="家族や友人とノートを共有できます" />
              <HintDivider />
              <FeatureHint emoji="📤" title="SNSにシェア" description="美しい共有カードで思い出を伝えます" />
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
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

function NoteCard({ note, onPress }: { note: NoteDoc; onPress: () => void }) {
  const dateStr = note.createdAt?.toDate ? formatDate(note.createdAt.toDate()) : null;

  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.noteCardCover}>
        {note.coverPhotoURL ? (
          <Image
            source={{ uri: note.coverPhotoURL }}
            style={styles.noteCardCoverImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.noteCardCoverEmoji}>📷</Text>
        )}
      </View>
      {/* Content */}
      <View style={styles.noteCardContent}>
        <Text style={styles.noteCardTitle} numberOfLines={2}>{note.title}</Text>
        {note.memo ? (
          <Text style={styles.noteCardMemo} numberOfLines={2}>{note.memo}</Text>
        ) : null}
        <View style={styles.noteCardChips}>
          {dateStr ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>📅 {dateStr}</Text>
            </View>
          ) : null}
          {note.noteType === 'shared' ? (
            <View style={[styles.chip, styles.chipShared]}>
              <Text style={[styles.chipText, styles.chipSharedText]}>🤝 共有</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
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
  // Loading
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
  // Error
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
  // Note list
  listScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 12,
  },
  noteCard: {
    height: 152,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  noteCardCover: {
    width: 152,
    height: '100%',
    overflow: 'hidden',
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCardCoverImage: {
    width: '100%',
    height: '100%',
  },
  noteCardCoverEmoji: {
    fontSize: 28,
  },
  noteCardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
    overflow: 'hidden',
  },
  noteCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  noteCardMemo: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  noteCardChips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipShared: {
    backgroundColor: colors.mapAccentLight,
  },
  chipSharedText: {
    color: colors.mapAccent,
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
