// UI-1: Memory Preview Screen
// 思い出を読む画面 — 感情的に思い出を閲覧するための画面
// Emotional reading surface. No confidence/status technical UI.
// UI-3B: aiDiary 表示追加。photosLoading ゲート削除（EventMapPreview は独立購読）。重複 mapLink 削除。
// UI-21: warm / photo-first リデザイン。
//   - カスタムヘッダー（ScreenHeader → 独自 back + edit ボタン）
//   - ヒーロー 300px、place summary chip、shared badge
//   - Quick Actions をメタセクション直後に移動
//   - Photo Strip を独立スクロールセクションへ
//   - AI日記の全状態表示 (generating / failed / idle hint)
//   - Memo / AI日記の空状態テキスト
//   - CTA: 「このノートを編集する」

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

// ── Loading / Error headers ────────────────────────────────
function MinimalHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        hitSlop={8}
        accessibilityLabel="戻る"
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export default function NotePreviewScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note, isLoading, error } = useNoteDetail(noteId ?? null);
  const { photos: notePhotos } = useNotePhotos(noteId ?? null);

  const coverPhoto = notePhotos[0] ?? null;
  const photoLocations = getPhotoLocationsFromPhotos(notePhotos);
  const userCanEdit = uid && note ? canEdit(note, uid) : false;
  // UI-16B: "メンバーと共有する" は owner のみ表示
  const isOwner = note ? note.ownerId === uid : false;

  // UI-16B: メンバーと共有する → メンバー招待画面へ（noteType は招待成功時に CF が変更）
  const handleConvertToShared = () => {
    if (!noteId) return;
    Alert.alert(
      'メンバーを招待しますか？',
      'メンバーを招待すると、このノートが共有ノートになります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '招待へ進む',
          onPress: () => router.push(`/(app)/notes/${noteId}/members` as any),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <MinimalHeader onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !note) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <MinimalHeader onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error ? '読み込みに失敗しました' : 'ノートが見つかりませんでした'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateStr = note.createdAt?.toDate ? formatDate(note.createdAt.toDate()) : null;
  const placeLabel = note.visitedPlacesSummary?.topPlaceLabels?.[0] ?? null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Custom header: back + edit ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="戻る"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        {userCanEdit ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/(app)/notes/${noteId}/edit` as any)}
            hitSlop={8}
          >
            <Text style={styles.editButtonText}>編集</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Photo ── */}
        <View style={styles.heroSection}>
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
              <View style={styles.heroPlaceholderIconWrap}>
                <Text style={styles.heroPlaceholderEmoji}>📷</Text>
              </View>
              <Text style={styles.heroPlaceholderText}>写真がまだありません</Text>
              {userCanEdit && (
                <Text style={styles.heroPlaceholderHint}>
                  編集画面から写真を追加できます
                </Text>
              )}
            </View>
          )}

          {/* Shared badge overlay */}
          {note.noteType === 'shared' && (
            <View style={styles.sharedBadge}>
              <Text style={styles.sharedBadgeText}>🤝 共有</Text>
            </View>
          )}
        </View>

        {/* ── Title & Meta ── */}
        <View style={styles.metaSection}>
          <Text style={styles.noteTitle}>{note.title || '無題の思い出'}</Text>
          <View style={styles.metaChips}>
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
            {note.photoCount != null && note.photoCount > 0 ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>📷 {note.photoCount}枚</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Quick Actions ── */}
        {/* UI-16B: shared → メンバー, personal + isOwner → メンバーと共有する */}
        <View style={styles.quickActionsCard}>
          {userCanEdit ? (
            <>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push(`/(app)/notes/${noteId}/edit` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionRowText}>✏️  編集する</Text>
                <Text style={styles.actionRowArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.actionDivider} />
            </>
          ) : null}
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
          ) : isOwner ? (
            <>
              <View style={styles.actionDivider} />
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleConvertToShared}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionRowText, styles.actionRowHighlight]}>
                  🔗  メンバーと共有する
                </Text>
                <Text style={styles.actionRowArrow}>›</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* ── Photo Strip ── */}
        {notePhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              写真{note.photoCount != null && note.photoCount > 0 ? `（${note.photoCount}枚）` : ''}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
            >
              {notePhotos.map((photo, idx) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoStripItem}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(
                      `/(app)/notes/${noteId}/photos/viewer?initialIndex=${idx}` as any
                    )
                  }
                >
                  <Image
                    source={{ uri: photo.downloadURL }}
                    style={styles.photoStripImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>メモ</Text>
          {note.memo ? (
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{note.memo}</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>まだメモはありません</Text>
              {userCanEdit && (
                <Text style={styles.emptyCardHint}>
                  編集画面のメモタブから追加できます
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── AI日記 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI日記</Text>
          {note.aiDiaryStatus === 'generating' ? (
            <View style={styles.aiGeneratingCard}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.aiGeneratingText}>AI日記を生成中です...</Text>
            </View>
          ) : (note.aiDiaryStatus === 'completed' || note.aiDiaryStatus === 'edited') &&
            note.aiDiary ? (
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{note.aiDiary}</Text>
            </View>
          ) : note.aiDiaryStatus === 'failed' ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>AI日記の生成に失敗しました</Text>
              {userCanEdit && (
                <Text style={styles.emptyCardHint}>
                  編集画面から再試行できます
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>AI日記はまだ作成されていません</Text>
              {userCanEdit && (
                <Text style={styles.emptyCardHint}>
                  編集画面のメモタブから作成できます
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── 編集する CTA ── */}
        {userCanEdit ? (
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.editCta}
              onPress={() => router.push(`/(app)/notes/${noteId}/edit` as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.editCtaText}>このノートを編集する</Text>
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

  // ── Header ──────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  headerSpacer: {
    width: 40,
  },

  // ── Hero ──────────────────────────────────────
  heroSection: {
    backgroundColor: colors.surfaceIvory,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  heroPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surfaceIvory,
  },
  heroPlaceholderIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  heroPlaceholderEmoji: {
    fontSize: 36,
  },
  heroPlaceholderText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  heroPlaceholderHint: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  sharedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.mapAccentLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sharedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mapAccent,
  },

  // ── Meta ──────────────────────────────────────
  metaSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  metaChips: {
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
  metaChipPlace: {
    backgroundColor: colors.mapAccentLight,
    maxWidth: 180,
  },
  metaChipPlaceText: {
    color: colors.mapAccent,
  },

  // ── Quick Actions ──────────────────────────────────────
  quickActionsCard: {
    marginHorizontal: 20,
    marginTop: 16,
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
  actionRowHighlight: {
    color: colors.primary,
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

  // ── Sections ──────────────────────────────────────
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
    marginBottom: 10,
  },

  // ── Photo Strip ──────────────────────────────────────
  photoStrip: {
    gap: 8,
    alignItems: 'center',
    paddingRight: 4,
  },
  photoStripItem: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceIvory,
  },
  photoStripImage: {
    width: '100%',
    height: '100%',
  },

  // ── Content cards ──────────────────────────────────────
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  contentText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 24,
  },

  // ── Empty states ──────────────────────────────────────
  emptyCard: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  emptyCardText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyCardHint: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // ── AI generating ──────────────────────────────────────
  aiGeneratingCard: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiGeneratingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ── Bottom CTA ──────────────────────────────────────
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
