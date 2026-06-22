// Phase 12.5G-4: フロー閲覧画面
// UI-3A: Flow Detailリデザイン — 1つのFlowを「1つの章」として見せる
// Route: /(app)/notes/[noteId]/flows/[placeGroupId]
//
// Layout:
//   Hero photo (280h, radius 24)
//   Flow meta (time / place / category / confirmed)
//   Related photo strip
//   Event memo
//   Mini map
//   Prev/next navigation
//   Actions: 編集する / 場所を確認

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
import MapView, { Marker } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useNotePhotos } from '@/features/photos/hooks/useNotePhotos';
import { usePlaceGroups } from '@/features/placeIntelligence/hooks/usePlaceGroups';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import type { PlaceGroupDoc } from '@/features/map/types';

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function formatTimeRange(group: PlaceGroupDoc): string | null {
  function toDate(ts: unknown): Date | null {
    if (!ts) return null;
    if (typeof (ts as { toDate?: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate();
    }
    return null;
  }
  const start = toDate(group.startAt);
  const end = toDate(group.endAt);
  if (!start) return null;
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (end && end.getTime() !== start.getTime()) {
    return `${fmt(start)} 〜 ${fmt(end)}`;
  }
  return fmt(start);
}

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    restaurant: 'レストラン', cafe: 'カフェ', tourist_attraction: '観光地',
    station: '駅', hotel: 'ホテル', shopping: 'ショッピング',
    park: '公園', museum: '美術館・博物館', area: 'エリア', unknown: 'その他',
  };
  return map[category] ?? category;
}

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function FlowDetailScreen() {
  const { noteId, placeGroupId } = useLocalSearchParams<{
    noteId: string;
    placeGroupId: string;
  }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note } = useNoteDetail(noteId ?? null);
  const { groups, isLoading } = usePlaceGroups(noteId ?? null);
  const { photos: allPhotos } = useNotePhotos(noteId ?? null);

  const userCanEdit = uid && note ? canEdit(note, uid) : false;

  const currentIdx = groups.findIndex((g) => g.id === placeGroupId);
  const group = currentIdx >= 0 ? groups[currentIdx] : null;
  const prevGroup = currentIdx > 0 ? groups[currentIdx - 1] : null;
  const nextGroup = currentIdx < groups.length - 1 ? groups[currentIdx + 1] : null;

  // このフローの写真を抽出
  const flowPhotos =
    group?.photoIds && group.photoIds.length > 0
      ? allPhotos.filter((p) => group.photoIds.includes(p.id))
      : group?.photoPreviewURLs?.map((url, i) => ({ id: String(i), downloadURL: url })) ?? [];

  const heroPhotoURL =
    flowPhotos[0]?.downloadURL ?? group?.coverPhotoURL ?? null;
  const stripPhotos = flowPhotos.slice(1, 6);

  // ── ローディング ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="フロー詳細" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mapAccent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="フロー詳細" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorText}>フローが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeRange = formatTimeRange(group);
  const totalFlows = groups.length;

  // ── レンダー ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={`Flow ${currentIdx + 1} / ${totalFlows}`}
        onBack={() => router.back()}
        rightElement={
          userCanEdit ? (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/notes/${noteId}/places/${placeGroupId}` as any)}
              hitSlop={8}
            >
              <Text style={styles.editButtonText}>場所を確認</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Section 1: Hero Photo ── */}
        <View style={styles.heroContainer}>
          {heroPhotoURL ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() =>
                router.push(
                  `/(app)/notes/${noteId}/photos/viewer?initialIndex=0` as any
                )
              }
            >
              <Image
                source={{ uri: heroPhotoURL }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderEmoji}>🏞️</Text>
              <Text style={styles.heroPlaceholderText}>写真なし</Text>
            </View>
          )}

          {/* サポーティング写真ストリップ (hero の下) */}
          {stripPhotos.length > 0 ? (
            <View style={styles.stripRow}>
              {stripPhotos.map((photo, idx) => (
                <TouchableOpacity
                  key={photo.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(
                      `/(app)/notes/${noteId}/photos/viewer?initialIndex=${idx + 1}` as any
                    )
                  }
                >
                  <Image
                    source={{ uri: photo.downloadURL }}
                    style={styles.stripThumb}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
              {flowPhotos.length > 6 ? (
                <View style={styles.stripMore}>
                  <Text style={styles.stripMoreText}>+{flowPhotos.length - 6}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Section 2: Flow Meta ── */}
        <View style={styles.metaCard}>
          {timeRange ? (
            <View style={styles.metaTimeRow}>
              <Text style={styles.metaTime}>{timeRange}</Text>
            </View>
          ) : null}

          <Text style={styles.flowLabel}>{group.label}</Text>

          <View style={styles.metaChipRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{getCategoryLabel(group.category)}</Text>
            </View>
            <View style={[
              styles.confirmedChip,
              group.userConfirmed ? styles.confirmedChipActive : styles.confirmedChipPending,
            ]}>
              <Text style={[
                styles.confirmedChipText,
                group.userConfirmed ? styles.confirmedChipTextActive : styles.confirmedChipTextPending,
              ]}>
                {group.userConfirmed ? '場所確認済み' : '場所未確認'}
              </Text>
            </View>
          </View>

          {group.photoCount > 0 ? (
            <Text style={styles.metaPhotosHint}>写真 {group.photoCount}枚</Text>
          ) : null}
        </View>

        {/* ── Section 3: Event Memo ── */}
        {group.eventMemo ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>メモ</Text>
            <View style={styles.memoCard}>
              <Text style={styles.memoText}>{group.eventMemo}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Section 4: Mini Map ── */}
        {group.latitude != null && group.longitude != null ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>場所</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: group.latitude,
                  longitude: group.longitude,
                  latitudeDelta: 0.006,
                  longitudeDelta: 0.006,
                }}
                showsUserLocation={false}
                showsCompass={false}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: group.latitude, longitude: group.longitude }}
                  title={group.label}
                  pinColor={colors.mapAccent}
                />
              </MapView>
            </View>
            <Text style={styles.mapLabel}>{group.label}</Text>
          </View>
        ) : null}

        {/* ── Section 5: Prev / Next Navigation ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>前後のフロー</Text>
          <View style={styles.navRow}>
            {prevGroup ? (
              <TouchableOpacity
                style={styles.navCard}
                onPress={() => router.replace(`/(app)/notes/${noteId}/flows/${prevGroup.id}` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.navArrow}>‹</Text>
                <View style={styles.navInfo}>
                  <Text style={styles.navHint}>前のフロー</Text>
                  <Text style={styles.navFlowLabel} numberOfLines={1}>{prevGroup.label}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.navCard, styles.navCardDisabled]}>
                <Text style={[styles.navArrow, styles.navArrowDisabled]}>‹</Text>
                <Text style={styles.navDisabledText}>最初のフロー</Text>
              </View>
            )}

            {nextGroup ? (
              <TouchableOpacity
                style={[styles.navCard, styles.navCardRight]}
                onPress={() => router.replace(`/(app)/notes/${noteId}/flows/${nextGroup.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.navInfo, styles.navInfoRight]}>
                  <Text style={[styles.navHint, styles.navHintRight]}>次のフロー</Text>
                  <Text style={[styles.navFlowLabel, styles.navFlowLabelRight]} numberOfLines={1}>
                    {nextGroup.label}
                  </Text>
                </View>
                <Text style={styles.navArrow}>›</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.navCard, styles.navCardRight, styles.navCardDisabled]}>
                <Text style={styles.navDisabledText}>最後のフロー</Text>
                <Text style={[styles.navArrow, styles.navArrowDisabled]}>›</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Section 6: Actions ── */}
        {userCanEdit ? (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => router.push(`/(app)/notes/${noteId}/places/${placeGroupId}` as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>場所を確認・編集</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => router.push(`/(app)/notes/${noteId}/edit` as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryActionText}>ノートを編集する</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  errorEmoji: { fontSize: 40, opacity: 0.5 },
  errorText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  editButtonText: { fontSize: 14, fontWeight: '600', color: colors.mapAccent },
  scroll: { paddingBottom: 32 },
  // Hero
  heroContainer: { backgroundColor: colors.surfaceIvory },
  heroImage: {
    width: '100%',
    height: 280,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  heroPlaceholder: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  heroPlaceholderEmoji: { fontSize: 48, opacity: 0.3 },
  heroPlaceholderText: { fontSize: 13, color: colors.textTertiary },
  stripRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stripThumb: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },
  stripMore: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripMoreText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  // Flow meta card
  metaCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  metaTimeRow: { flexDirection: 'row', alignItems: 'center' },
  metaTime: { fontSize: 13, fontWeight: '600', color: colors.mapAccent },
  flowLabel: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  metaChipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  categoryChip: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  confirmedChip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  confirmedChipActive: { backgroundColor: '#E6F4F0', borderColor: colors.success },
  confirmedChipPending: { backgroundColor: '#FFF8ED', borderColor: colors.warning },
  confirmedChipText: { fontSize: 12, fontWeight: '600' },
  confirmedChipTextActive: { color: colors.success },
  confirmedChipTextPending: { color: colors.warning },
  metaPhotosHint: { fontSize: 12, color: colors.textTertiary },
  // Sections
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionLabel: {
    fontSize: 12,
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
  memoText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  // Map
  mapContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    height: 160,
    marginBottom: 8,
  },
  map: { flex: 1 },
  mapLabel: { fontSize: 13, color: colors.textSecondary },
  // Prev/next nav
  navRow: { flexDirection: 'row', gap: 10 },
  navCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  navCardRight: { justifyContent: 'flex-end' },
  navCardDisabled: { backgroundColor: colors.surfaceIvory },
  navArrow: { fontSize: 22, color: colors.mapAccent, fontWeight: '600', lineHeight: 26 },
  navArrowDisabled: { color: colors.textTertiary },
  navInfo: { flex: 1, gap: 2 },
  navInfoRight: { alignItems: 'flex-end' },
  navHint: { fontSize: 10, color: colors.textTertiary, fontWeight: '500' },
  navHintRight: { textAlign: 'right' },
  navFlowLabel: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  navFlowLabelRight: { textAlign: 'right' },
  navDisabledText: { fontSize: 12, color: colors.textTertiary, flex: 1 },
  // Actions
  actionSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 10,
  },
  primaryAction: {
    height: 52,
    backgroundColor: colors.mapAccent,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.mapAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: { fontSize: 15, fontWeight: '700', color: colors.textInverse },
  secondaryAction: {
    height: 52,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  bottomPad: { height: 48 },
});
