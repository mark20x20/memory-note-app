import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { noteRepository } from '@/core/repositories/noteRepository';
import type { NoteDoc } from '@/core/repositories/noteRepository';

function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();

  const [note, setNote] = useState<NoteDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!noteId) {
      setIsLoading(false);
      return;
    }
    async function load() {
      try {
        const data = await noteRepository.getNoteById(noteId);
        setNote(data);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [noteId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="ノート詳細" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="ノート詳細" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>ノートの取得に失敗しました</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!note) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="ノート詳細" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorText}>ノートが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateStr = note.createdAt?.toDate ? formatDate(note.createdAt.toDate()) : null;
  const noteTypeLabel = note.noteType === 'shared' ? '共有ノート' : '個人ノート';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="ノート詳細"
        onBack={() => router.back()}
        rightElement={
          <TouchableOpacity style={styles.shareButton} hitSlop={8}>
            <Text style={styles.shareButtonText}>↗</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cover photo placeholder */}
        <View style={styles.coverPhoto}>
          <Text style={styles.coverEmoji}>📷</Text>
          <Text style={styles.coverPlaceholderText}>写真は Phase 6 以降で追加予定</Text>
        </View>

        {/* Note meta */}
        <View style={styles.metaSection}>
          <Text style={styles.noteTitle}>{note.title}</Text>
          <View style={styles.metaRow}>
            {dateStr ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>📅 {dateStr}</Text>
              </View>
            ) : null}
            <View style={[styles.metaChip, styles.metaChipType]}>
              <Text style={styles.metaChipText}>
                {note.noteType === 'shared' ? '🤝' : '👤'} {noteTypeLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Memo */}
        {note.memo ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>メモ</Text>
            <View style={styles.memoCard}>
              <Text style={styles.memoText}>{note.memo}</Text>
            </View>
          </View>
        ) : null}

        {/* AI diary placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI日記</Text>
          <View style={styles.diaryCard}>
            <Text style={styles.diaryPlaceholder}>
              AIが生成した短文日記がここに表示されます。{'\n'}写真・場所・日付から自動で作られます。
            </Text>
          </View>
          <Text style={styles.placeholderCaption}>AI日記は Phase 9 以降で実装予定</Text>
        </View>

        {/* Photo grid placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>写真</Text>
          <View style={styles.photoGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={styles.photoCell}>
                <Text style={styles.photoCellEmoji}>🏞</Text>
              </View>
            ))}
          </View>
          <Text style={styles.placeholderCaption}>写真表示は Phase 7 以降で実装予定</Text>
        </View>

        {/* Map placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>地図</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺</Text>
            <Text style={styles.mapPlaceholderText}>訪れた場所がピンで表示されます</Text>
          </View>
          <Text style={styles.placeholderCaption}>地図表示は Phase 8 以降で実装予定</Text>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>メンバー</Text>
          <View style={styles.membersRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>👤</Text>
            </View>
            <Text style={styles.memberLabel}>あなた（Owner）</Text>
          </View>
        </View>

        {/* Note ID */}
        <Text style={styles.noteIdHint}>ノートID: {note.id}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
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
  scroll: {
    paddingBottom: 48,
  },
  shareButton: {
    padding: 4,
  },
  shareButtonText: {
    fontSize: 20,
    color: colors.primary,
  },
  // Cover
  coverPhoto: {
    height: 200,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  coverEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  coverPlaceholderText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  // Meta
  metaSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaChipType: {
    backgroundColor: colors.primaryLight,
  },
  metaChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  // Memo
  memoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  memoText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  // Diary
  diaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  diaryPlaceholder: {
    fontSize: 14,
    color: colors.textTertiary,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Photo grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  photoCell: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoCellEmoji: {
    fontSize: 24,
  },
  // Map
  mapPlaceholder: {
    height: 140,
    backgroundColor: colors.mapAccentLight,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  mapEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: colors.mapAccent,
  },
  placeholderCaption: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  // Members
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceIvory,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
  },
  memberLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Note ID hint
  noteIdHint: {
    marginTop: 32,
    marginHorizontal: 20,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
