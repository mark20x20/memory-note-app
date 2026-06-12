// Phase 10: Note Detail Screen
// Phase 11: Permission-gated edit button / member management button / AI diary regeneration.
// - owner/editor: 編集ボタン表示
// - owner のみ: メンバー管理ボタン表示
// - viewer: 編集ボタン非表示、AI再生成ボタン非表示

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
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useNotePhotos } from '@/features/photos/hooks/useNotePhotos';
import { MapPreview } from '@/features/map/components/MapPreview';
import { getPhotoLocationsFromPhotos } from '@/features/map/utils/locationUtils';
import { AiDiarySection } from '@/features/memoryNotes/components/AiDiarySection';
import { canEdit, canManageMembers, canGenerateAiDiary, getCurrentUserRole } from '@/features/memoryNotes/utils/permissions';

function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  editor: '編集者',
  viewer: '閲覧者',
};

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  // Phase 9: onSnapshot でリアルタイム購読（aiDiaryStatus の変化を自動反映）
  const { note, isLoading, error } = useNoteDetail(noteId ?? null);

  const { photos: notePhotos, isLoading: photosLoading } = useNotePhotos(noteId ?? null);
  const coverPhoto = notePhotos[0] ?? null;
  const photoLocations = getPhotoLocationsFromPhotos(notePhotos);

  // Phase 11: 権限チェック
  const userCanEdit = uid && note ? canEdit(note, uid) : false;
  const userCanManageMembers = uid && note ? canManageMembers(note, uid) : false;
  const userCanGenerateAi = uid && note ? canGenerateAiDiary(note, uid) : false;
  const userRole = uid && note ? getCurrentUserRole(note, uid) : null;
  const memberCount = note ? Object.keys(note.members ?? {}).length : 0;

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
          // Phase 11: owner/editor のみ編集ボタンを表示
          userCanEdit ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/(app)/notes/${noteId}/edit`)}
              hitSlop={8}
              accessibilityLabel="編集"
            >
              <Text style={styles.editButtonText}>編集</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── カバー写真 ── */}
        <View style={styles.coverPhoto}>
          {coverPhoto ? (
            <Image
              source={{ uri: coverPhoto.downloadURL }}
              style={styles.coverPhotoImage}
              resizeMode="cover"
            />
          ) : (
            <>
              <Text style={styles.coverEmoji}>📷</Text>
              <Text style={styles.coverPlaceholderText}>まだ写真がありません</Text>
            </>
          )}
        </View>

        {/* ── ノートメタ情報 ── */}
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
            {note.photoCount != null && note.photoCount > 0 ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>📷 {note.photoCount}枚</Text>
              </View>
            ) : null}
            {/* Phase 11: 自分のロール表示 */}
            {userRole ? (
              <View style={[styles.metaChip, styles.metaChipRole]}>
                <Text style={styles.metaChipText}>{ROLE_LABEL[userRole] ?? userRole}</Text>
              </View>
            ) : null}
          </View>
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

        {/* ── AI日記セクション（Phase 9 実装、Phase 11 で canRegenerate 追加） ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI日記</Text>
          <AiDiarySection noteId={noteId} note={note} canRegenerate={userCanGenerateAi} />
        </View>

        {/* ── 写真セクション ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>写真</Text>
          {photosLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.photosLoader} />
          ) : notePhotos.length > 0 ? (
            <View style={styles.photoGrid}>
              {notePhotos.map((photo) => (
                <View key={photo.id} style={styles.photoGridItem}>
                  <Image
                    source={{ uri: photo.downloadURL }}
                    style={styles.photoGridImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.photoPlaceholderBox}>
              <Text style={styles.photoPlaceholderEmoji}>📷</Text>
              <Text style={styles.photoPlaceholderText}>まだ写真がありません</Text>
            </View>
          )}
        </View>

        {/* ── 地図セクション（Phase 8 実装） ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>地図</Text>
          {photosLoading ? (
            <View style={styles.mapLoadingBox}>
              <Text style={styles.mapLoadingText}>位置情報を読み込み中...</Text>
            </View>
          ) : (
            <MapPreview locations={photoLocations} height={180} />
          )}
        </View>

        {/* ── メンバーセクション（Phase 11 実装） ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>メンバー</Text>
            {/* Phase 11: owner のみメンバー管理ボタンを表示 */}
            {userCanManageMembers ? (
              <TouchableOpacity
                style={styles.manageMembersButton}
                onPress={() => router.push(`/(app)/notes/${noteId}/members`)}
                hitSlop={8}
              >
                <Text style={styles.manageMembersButtonText}>管理</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.membersRow}>
            <Text style={styles.memberCountText}>
              {memberCount > 1
                ? `${memberCount}人が参加中`
                : '個人ノート'}
            </Text>
          </View>
        </View>

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
  editButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  // Cover
  coverPhoto: {
    height: 220,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },
  coverPhotoImage: {
    width: '100%',
    height: '100%',
  },
  coverEmoji: {
    fontSize: 48,
    marginBottom: 8,
    opacity: 0.4,
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
  metaChipRole: {
    backgroundColor: colors.mapAccentLight,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  // Photos
  photosLoader: {
    marginVertical: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoGridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceIvory,
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholderBox: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderEmoji: {
    fontSize: 32,
    opacity: 0.4,
  },
  photoPlaceholderText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  // Map (Phase 8)
  mapLoadingBox: {
    height: 180,
    backgroundColor: colors.mapAccentLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingText: {
    fontSize: 13,
    color: colors.mapAccent,
  },
  // Members (Phase 11)
  manageMembersButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  manageMembersButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  membersRow: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  memberCountText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  noteIdHint: {
    marginTop: 32,
    marginHorizontal: 20,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
