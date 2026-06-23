// UI-1: Memory Preview Screen
// 思い出を読む画面 — 感情的に思い出を閲覧するための画面
// Emotional reading surface. No confidence/status technical UI.
// UI-3B: aiDiary 表示追加。photosLoading ゲート削除（EventMapPreview は独立購読）。重複 mapLink 削除。

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useNotePhotos } from '@/features/photos/hooks/useNotePhotos';
import { getPhotoLocationsFromPhotos } from '@/features/map/utils/locationUtils';
import { VisitTimelineSection } from '@/features/placeIntelligence/components/VisitTimelineSection';
import { EventMapPreview } from '@/features/placeIntelligence/components/EventMapPreview';
import { useAuth } from '@/core/auth/AuthContext';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import { noteRepository } from '@/core/repositories/noteRepository';

function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function NotePreviewScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note, isLoading, error } = useNoteDetail(noteId ?? null);
  const { photos: notePhotos } = useNotePhotos(noteId ?? null);

  // UI-16: personal → shared 変換中フラグ
  const [isConverting, setIsConverting] = useState(false);

  const coverPhoto = notePhotos[0] ?? null;
  const supportingPhotos = notePhotos.slice(1, 5);
  const photoLocations = getPhotoLocationsFromPhotos(notePhotos);
  const userCanEdit = uid && note ? canEdit(note, uid) : false;

  // UI-16: preview から直接 personal → shared へ変換する
  const handleConvertToShared = () => {
    if (!noteId || isConverting) return;
    Alert.alert(
      'このノートを共有しますか？',
      '共有ノートに変更すると、メンバーを招待できるようになります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '共有して招待する',
          onPress: async () => {
            setIsConverting(true);
            try {
              await noteRepository.updateNoteType(noteId, 'shared');
              router.push(`/(app)/notes/${noteId}/members` as any);
            } catch {
              Alert.alert('エラー', '共有設定の変更に失敗しました。もう一度お試しください。');
            } finally {
              setIsConverting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !note) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="思い出" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error ? '読み込みに失敗しました' : 'ノートが見つかりませんでした'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateStr = note.createdAt?.toDate ? formatDate(note.createdAt.toDate()) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title=""
        onBack={() => router.back()}
        rightElement={
          userCanEdit ? (
            <TouchableOpacity
              style={styles.headerEditButton}
              onPress={() => router.push(`/(app)/notes/${noteId}/edit` as any)}
              hitSlop={8}
            >
              <Text style={styles.headerEditText}>編集</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ヒーロー写真 ── */}
        <View style={styles.heroContainer}>
          {coverPhoto ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() =>
                router.push(`/(app)/notes/${noteId}/photos/viewer?initialIndex=0` as any)
              }
            >
              <Image
                source={{ uri: coverPhoto.downloadURL }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderEmoji}>📷</Text>
              <Text style={styles.heroPlaceholderText}>写真がまだありません</Text>
            </View>
          )}

          {/* サポーティング サムネイルストリップ */}
          {supportingPhotos.length > 0 && (
            <View style={styles.thumbnailStrip}>
              {supportingPhotos.map((photo, idx) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.thumbnailItem}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(
                      `/(app)/notes/${noteId}/photos/viewer?initialIndex=${idx + 1}` as any
                    )
                  }
                >
                  <Image
                    source={{ uri: photo.downloadURL }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
              {notePhotos.length > 5 && (
                <TouchableOpacity
                  style={[styles.thumbnailItem, styles.thumbnailMore]}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(`/(app)/notes/${noteId}/photos/viewer?initialIndex=5` as any)
                  }
                >
                  <Text style={styles.thumbnailMoreText}>+{notePhotos.length - 5}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── タイトル & メタ情報 ── */}
        <View style={styles.metaSection}>
          <Text style={styles.noteTitle}>{note.title}</Text>
          <View style={styles.metaRow}>
            {dateStr ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>📅 {dateStr}</Text>
              </View>
            ) : null}
            {note.photoCount != null && note.photoCount > 0 ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>📷 {note.photoCount}枚</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── この日の流れ（タイムライン） ── */}
        <VisitTimelineSection
          noteId={noteId}
          canEdit={false}
          enrichmentStatus={note.placeEnrichmentStatus}
        />

        {/* ── 地図プレビュー ── */}
        {/* EventMapPreview は内部で placeGroups を独立購読するため photosLoading の待機は不要。 */}
        {/* "地図で見る" リンクは EventMapPreview の mapFooter に内包されているため重複リンク不要。 */}
        <View style={styles.section}>
          <EventMapPreview
            noteId={noteId}
            photoLocations={photoLocations}
            height={200}
          />
        </View>

        {/* ── メモ ── */}
        {note.memo ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>メモ</Text>
            <View style={styles.memoCard}>
              <Text style={styles.memoText}>{note.memo}</Text>
            </View>
          </View>
        ) : null}

        {/* ── AI日記 ── */}
        {(note.aiDiaryStatus === 'completed' || note.aiDiaryStatus === 'edited') && note.aiDiary ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AI日記</Text>
            <View style={styles.memoCard}>
              <Text style={styles.memoText}>{note.aiDiary}</Text>
            </View>
          </View>
        ) : null}

        {/* ── ナビゲーション導線 (UI-7 / UI-16) ── */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push(`/(app)/notes/${noteId}/map` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionRowText}>🗺  地図で見る</Text>
            <Text style={styles.actionRowArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push(`/(app)/notes/${noteId}/share` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionRowText}>↗  共有カードを作成</Text>
            <Text style={styles.actionRowArrow}>›</Text>
          </TouchableOpacity>

          {/* UI-16: shared → "メンバー", personal + canEdit → "メンバーと共有する" */}
          {note.noteType === 'shared' ? (
            <>
              <View style={styles.actionDivider} />
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push(`/(app)/notes/${noteId}/members` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionRowText}>👥  メンバー</Text>
                <Text style={styles.actionRowArrow}>›</Text>
              </TouchableOpacity>
            </>
          ) : userCanEdit ? (
            <>
              <View style={styles.actionDivider} />
              <TouchableOpacity
                style={[styles.actionRow, isConverting && { opacity: 0.5 }]}
                onPress={handleConvertToShared}
                disabled={isConverting}
                activeOpacity={0.7}
              >
                {isConverting ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.actionRowLoader} />
                ) : null}
                <Text style={[styles.actionRowText, { color: colors.primary }]}>
                  🔗  メンバーと共有する
                </Text>
                <Text style={styles.actionRowArrow}>›</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* ── 編集するCTA ── */}
        {userCanEdit ? (
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.editCta}
              onPress={() => router.push(`/(app)/notes/${noteId}/edit` as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.editCtaText}>編集する</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.bottomPad} />
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
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scroll: {
    paddingBottom: 32,
  },
  // Header edit button
  headerEditButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  headerEditText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  // Hero
  heroContainer: {
    backgroundColor: colors.surfaceIvory,
  },
  heroImage: {
    width: '100%',
    height: 360,
  },
  heroPlaceholder: {
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroPlaceholderEmoji: {
    fontSize: 48,
    opacity: 0.3,
  },
  heroPlaceholderText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  // Thumbnail strip
  thumbnailStrip: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thumbnailItem: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceIvory,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailMore: {
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Meta
  metaSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  // Memo
  memoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  memoText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  // Action links (UI-7)
  actionsSection: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  actionRowArrow: {
    fontSize: 18,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  actionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  actionRowLoader: {
    marginRight: 8,
  },
  // CTA
  ctaSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  editCta: {
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  editCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomPad: {
    height: 48,
  },
});
