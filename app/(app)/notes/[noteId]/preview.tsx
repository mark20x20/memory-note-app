// UI-1: Memory Preview Screen
// 思い出を読む画面 — 感情的に思い出を閲覧するための画面
// Emotional reading surface. No confidence/status technical UI.

import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function NotePreviewScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note, isLoading, error } = useNoteDetail(noteId ?? null);
  const { photos: notePhotos, isLoading: photosLoading } = useNotePhotos(noteId ?? null);

  const coverPhoto = notePhotos[0] ?? null;
  const supportingPhotos = notePhotos.slice(1, 5);
  const photoLocations = getPhotoLocationsFromPhotos(notePhotos);
  const userCanEdit = uid && note ? canEdit(note, uid) : false;

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
        <View style={styles.section}>
          {photosLoading ? (
            <View style={styles.mapLoadingBox}>
              <ActivityIndicator color={colors.mapAccent} />
            </View>
          ) : (
            <EventMapPreview
              noteId={noteId}
              photoLocations={photoLocations}
              height={200}
            />
          )}
          <TouchableOpacity
            style={styles.mapLink}
            onPress={() => router.push(`/(app)/notes/${noteId}/map` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.mapLinkText}>地図を見る →</Text>
          </TouchableOpacity>
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
  // Map
  mapLoadingBox: {
    height: 200,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.mapAccentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapLink: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  mapLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
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
