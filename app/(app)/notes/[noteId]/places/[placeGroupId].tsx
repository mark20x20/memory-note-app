// Phase 12.5E: 場所候補確認画面
// Phase 12.5G-3: フロー詳細編集画面
// Phase 12.5G-4: フロー編集画面として明確化
// UI-3A: 場所確認UIのリデザイン（Selected Place Card / mini map / photo strip / アクションボタン）
// Route: /(app)/notes/[noteId]/places/[placeGroupId]

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, type Region } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useNotePhotos } from '@/features/photos/hooks/useNotePhotos';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import { selectPlaceCandidateCallable } from '@/features/placeIntelligence/api/placeFunctionsClient';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import type { PlaceGroupDoc, PlaceCandidateDoc } from '@/features/map/types';

// ── 定数 ─────────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const MINI_MAP_HEIGHT = 160;
const DEFAULT_DELTA = 0.008;

// ── ヘルパー ──────────────────────────────────────────────────────────────────

const PRIORITY_TYPES = new Set([
  'restaurant', 'food', 'cafe', 'coffee_shop', 'tourist_attraction',
  'museum', 'park', 'hotel', 'lodging', 'shopping_mall', 'store',
  'transit_station', 'train_station', 'subway_station',
]);

function isPriorityCandidate(candidate: PlaceCandidateDoc): boolean {
  return candidate.types.some((t) => PRIORITY_TYPES.has(t));
}

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    restaurant: 'レストラン', cafe: 'カフェ', tourist_attraction: '観光地',
    station: '駅', hotel: 'ホテル', shopping: 'ショッピング',
    park: '公園', museum: '美術館・博物館', area: 'エリア', unknown: 'その他',
  };
  return map[category] ?? category;
}

function formatDistance(meters?: number): string {
  if (meters == null) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function getTypeLabels(types: string[]): string {
  const labelMap: Record<string, string> = {
    restaurant: 'レストラン', food: '飲食', cafe: 'カフェ', coffee_shop: 'カフェ',
    tourist_attraction: '観光地', museum: '美術館・博物館', park: '公園',
    hotel: 'ホテル', lodging: '宿泊', shopping_mall: 'ショッピング', store: '店舗',
    transit_station: '交通機関', train_station: '鉄道駅', subway_station: '地下鉄駅',
    locality: '地区', neighborhood: '近隣',
  };
  return types.slice(0, 2).map((t) => labelMap[t] ?? t).filter(Boolean).join(' · ');
}

function getCandidatesWithLocation(
  candidates: PlaceCandidateDoc[]
): (PlaceCandidateDoc & { latitude: number; longitude: number })[] {
  return candidates.filter(
    (c): c is PlaceCandidateDoc & { latitude: number; longitude: number } =>
      typeof c.latitude === 'number' && typeof c.longitude === 'number' &&
      !Number.isNaN(c.latitude) && !Number.isNaN(c.longitude)
  );
}

function calcCandidateRegion(
  candidates: { latitude: number; longitude: number }[],
  groupLat: number,
  groupLng: number
): Region {
  const allLats = [groupLat, ...candidates.map((c) => c.latitude)];
  const allLngs = [groupLng, ...candidates.map((c) => c.longitude)];
  const minLat = Math.min(...allLats);
  const maxLat = Math.max(...allLats);
  const minLng = Math.min(...allLngs);
  const maxLng = Math.max(...allLngs);
  const padLat = Math.max((maxLat - minLat) * 0.4, DEFAULT_DELTA / 2);
  const padLng = Math.max((maxLng - minLng) * 0.4, DEFAULT_DELTA / 2);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: maxLat - minLat + padLat,
    longitudeDelta: maxLng - minLng + padLng,
  };
}

// ── マーカー ──────────────────────────────────────────────────────────────────

function CandidateMarkerView({ number, selected }: { number: number; selected: boolean }) {
  return (
    <View style={markerStyles.wrapper}>
      <View style={[markerStyles.badge, selected ? markerStyles.badgeSelected : markerStyles.badgeDefault]}>
        <Text style={[markerStyles.text, selected ? markerStyles.textSelected : markerStyles.textDefault]}>
          {number}
        </Text>
      </View>
      <View style={[markerStyles.stem, selected ? markerStyles.stemSelected : markerStyles.stemDefault]} />
    </View>
  );
}

const BADGE_W = 26;
const BADGE_H = 22;
const STEM_H = 5;

const markerStyles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  badge: {
    width: BADGE_W, height: BADGE_H, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 3,
  },
  badgeDefault: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.mapAccent },
  badgeSelected: { backgroundColor: colors.mapAccent },
  text: { fontSize: 10, fontWeight: '700' },
  textDefault: { color: colors.mapAccent },
  textSelected: { color: colors.white },
  stem: {
    width: 0, height: 0,
    borderLeftWidth: STEM_H / 2, borderRightWidth: STEM_H / 2, borderTopWidth: STEM_H,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  stemDefault: { borderTopColor: colors.mapAccent },
  stemSelected: { borderTopColor: colors.mapAccent },
});

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function PlaceGroupDetailScreen() {
  const { noteId, placeGroupId } = useLocalSearchParams<{
    noteId: string;
    placeGroupId: string;
  }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note } = useNoteDetail(noteId ?? null);
  const { photos: allPhotos } = useNotePhotos(noteId ?? null);

  const [group, setGroup] = useState<PlaceGroupDoc | null>(null);
  const [candidates, setCandidates] = useState<PlaceCandidateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  const userCanEdit = uid && note ? canEdit(note, uid) : false;

  useEffect(() => {
    if (!noteId || !placeGroupId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [g, c] = await Promise.all([
        placeGroupRepository.getPlaceGroupById(noteId!, placeGroupId!),
        placeGroupRepository.getPlaceCandidatesByGroupId(noteId!, placeGroupId!),
      ]);
      if (!cancelled) {
        setGroup(g);
        setCandidates(c);
        setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [noteId, placeGroupId]);

  async function handleSelect(candidate: PlaceCandidateDoc) {
    if (!noteId || !placeGroupId || !userCanEdit) return;
    setSelecting(candidate.id);
    try {
      await selectPlaceCandidateCallable({
        noteId,
        placeGroupId,
        candidateId: candidate.id,
      });
      // group の selectedCandidateId を更新してUIに反映
      setGroup((prev) => prev ? { ...prev, selectedCandidateId: candidate.id, userConfirmed: true } : prev);
      Alert.alert('確定しました', `「${candidate.name}」を訪れた場所として確定しました。`);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : '候補の確定に失敗しました';
      Alert.alert('エラー', msg);
    } finally {
      setSelecting(null);
    }
  }

  // ── ローディング ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="場所の確認" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mapAccent} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="場所の確認" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorText}>データが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── データ準備 ────────────────────────────────────────────────────────────

  const selectedCandidate = candidates.find((c) => c.id === group.selectedCandidateId) ?? null;
  const priorityCandidates = candidates.filter(isPriorityCandidate);
  const otherCandidates = candidates.filter((c) => !isPriorityCandidate(c));

  const candidatesWithLoc = getCandidatesWithLocation(candidates);
  const mapRegion: Region =
    candidatesWithLoc.length > 0
      ? calcCandidateRegion(candidatesWithLoc, group.latitude, group.longitude)
      : {
          latitude: group.latitude,
          longitude: group.longitude,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        };

  // 関連写真（group.photoIds があれば絞り込み、なければ photoPreviewURLs を使用）
  const relatedPhotoURLs: string[] = group.photoIds && group.photoIds.length > 0
    ? allPhotos
        .filter((p) => (group.photoIds as string[]).includes(p.id))
        .map((p) => p.downloadURL)
        .filter(Boolean)
    : (group.photoPreviewURLs ?? (group.coverPhotoURL ? [group.coverPhotoURL] : []));

  function renderCandidateCard(candidate: PlaceCandidateDoc) {
    const selected = candidate.id === group!.selectedCandidateId;
    const isLoadingCandidate = selecting === candidate.id;
    const globalIdx = candidates.findIndex((x) => x.id === candidate.id);

    return (
      <View
        key={candidate.id}
        style={[styles.candidateCard, selected && styles.candidateCardSelected]}
      >
        <View style={styles.candidateInfo}>
          <View style={styles.candidateHeaderRow}>
            <View style={[styles.numBadge, selected && styles.numBadgeSelected]}>
              <Text style={[styles.numBadgeText, selected && styles.numBadgeTextSelected]}>
                #{globalIdx + 1}
              </Text>
            </View>
            {selected ? (
              <View style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>選択中</Text>
              </View>
            ) : null}
            {candidate.distanceMeters != null ? (
              <Text style={styles.distanceText}>{formatDistance(candidate.distanceMeters)}</Text>
            ) : null}
          </View>
          <Text style={styles.candidateName}>{candidate.name}</Text>
          {candidate.types.length > 0 ? (
            <Text style={styles.candidateType}>{getTypeLabels(candidate.types)}</Text>
          ) : null}
          {candidate.rating != null ? (
            <Text style={styles.candidateRating}>★ {candidate.rating.toFixed(1)}</Text>
          ) : null}
          {candidate.address ? (
            <Text style={styles.candidateAddress} numberOfLines={1}>{candidate.address}</Text>
          ) : null}
        </View>

        {userCanEdit ? (
          <TouchableOpacity
            style={[
              styles.selectButton,
              selected && styles.selectButtonSelected,
              isLoadingCandidate && styles.selectButtonLoading,
            ]}
            onPress={() => handleSelect(candidate)}
            disabled={isLoadingCandidate || !!selecting}
          >
            {isLoadingCandidate ? (
              <ActivityIndicator size="small" color={selected ? colors.white : colors.mapAccent} />
            ) : (
              <Text style={[styles.selectButtonText, selected && styles.selectButtonTextSelected]}>
                {selected ? '確定済み' : 'この場所にする'}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="場所の確認" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Selected Place Card ── */}
        <View style={styles.selectedCard}>
          <View style={styles.selectedCardHeader}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{getCategoryLabel(group.category)}</Text>
            </View>
            <View style={[styles.statusChip, group.userConfirmed ? styles.statusChipConfirmed : styles.statusChipPending]}>
              <Text style={[styles.statusChipText, group.userConfirmed ? styles.statusChipTextConfirmed : styles.statusChipTextPending]}>
                {group.userConfirmed ? '確認済み' : '未確認'}
              </Text>
            </View>
            {selectedCandidate ? (
              <View style={styles.selectedPlaceChip}>
                <Text style={styles.selectedPlaceChipText}>選択中</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.placeName}>{selectedCandidate?.name ?? group.label}</Text>
          {selectedCandidate?.address ? (
            <Text style={styles.placeAddress} numberOfLines={2}>{selectedCandidate.address}</Text>
          ) : null}
          {group.eventMemo ? (
            <Text style={styles.eventMemo} numberOfLines={2}>{group.eventMemo}</Text>
          ) : null}

          {group.photoCount > 0 ? (
            <Text style={styles.photoCountText}>写真 {group.photoCount}枚</Text>
          ) : null}
        </View>

        {/* ── 関連写真ストリップ ── */}
        {relatedPhotoURLs.length > 0 ? (
          <View style={styles.photoSection}>
            <Text style={styles.sectionLabel}>関連写真</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
            >
              {relatedPhotoURLs.slice(0, 8).map((url, idx) => (
                <Image
                  key={idx}
                  source={{ uri: url }}
                  style={styles.photoThumb}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ── ミニマップ ── */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionLabel}>地図</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={{ width: SCREEN_WIDTH - 40, height: MINI_MAP_HEIGHT }}
              initialRegion={mapRegion}
              showsUserLocation={false}
              showsCompass={false}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{ latitude: group.latitude, longitude: group.longitude }}
                title="撮影地点"
                pinColor={colors.textTertiary}
              />
              {candidatesWithLoc.map((c) => {
                const globalIdx = candidates.findIndex((x) => x.id === c.id);
                return (
                  <Marker
                    key={c.id}
                    coordinate={{ latitude: c.latitude, longitude: c.longitude }}
                    title={`#${globalIdx + 1} ${c.name}`}
                  >
                    <CandidateMarkerView
                      number={globalIdx + 1}
                      selected={c.id === group.selectedCandidateId}
                    />
                  </Marker>
                );
              })}
            </MapView>
          </View>
        </View>

        {/* ── アクションボタン ── */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionButtonAccent}
            onPress={() => router.push(`/(app)/notes/${noteId}/map` as any)}
          >
            <Text style={styles.actionButtonAccentText}>地図で確認</Text>
          </TouchableOpacity>
          {userCanEdit ? (
            <TouchableOpacity
              style={styles.actionButtonGhost}
              onPress={() =>
                router.push(`/(app)/notes/${noteId}/places/manual?placeGroupId=${placeGroupId}` as any)
              }
            >
              <Text style={styles.actionButtonGhostText}>手動で修正</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── 候補がない場合 ── */}
        {candidates.length === 0 ? (
          <View style={styles.emptySection}>
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>候補が見つかりませんでした</Text>
              <Text style={styles.emptyDesc}>手動で場所を入力してください。</Text>
            </View>
          </View>
        ) : null}

        {/* ── 訪問候補 ── */}
        {priorityCandidates.length > 0 ? (
          <View style={styles.candidateSection}>
            <Text style={styles.sectionLabel}>訪問候補</Text>
            {priorityCandidates.map(renderCandidateCard)}
          </View>
        ) : null}

        {/* ── その他の近隣候補 ── */}
        {otherCandidates.length > 0 ? (
          <View style={styles.candidateSection}>
            <Text style={styles.sectionLabel}>その他の近隣</Text>
            {otherCandidates.map(renderCandidateCard)}
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 14, color: colors.textTertiary },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  scroll: { paddingBottom: 48 },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
  },

  // Selected Place Card
  selectedCard: {
    margin: 16, marginBottom: 0,
    backgroundColor: colors.mapAccentLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.mapAccent + '44',
    padding: 16, gap: 6,
  },
  selectedCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4,
  },
  categoryChip: {
    backgroundColor: colors.surface, borderRadius: borderRadius.full,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  categoryChipText: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  statusChip: {
    borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1,
  },
  statusChipConfirmed: { backgroundColor: '#E6F4F0', borderColor: colors.success },
  statusChipPending: { backgroundColor: colors.surfaceIvory, borderColor: colors.warning },
  statusChipText: { fontSize: 11, fontWeight: '600' },
  statusChipTextConfirmed: { color: colors.success },
  statusChipTextPending: { color: colors.warning },
  selectedPlaceChip: {
    backgroundColor: colors.mapAccent, borderRadius: borderRadius.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  selectedPlaceChipText: { fontSize: 11, fontWeight: '600', color: colors.white },
  placeName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  placeAddress: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  eventMemo: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },
  photoCountText: { fontSize: 11, color: colors.mapAccent, marginTop: 2 },

  // Photo strip
  photoSection: { paddingHorizontal: 16, paddingTop: 20 },
  photoStrip: { gap: 8, paddingRight: 16 },
  photoThumb: {
    width: 80, height: 80, borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },

  // Map
  mapSection: { paddingHorizontal: 16, paddingTop: 20 },
  mapContainer: {
    borderRadius: borderRadius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },

  // Action buttons
  actionSection: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  actionButtonAccent: {
    backgroundColor: colors.mapAccent, borderRadius: borderRadius.xl,
    paddingVertical: 13, alignItems: 'center',
  },
  actionButtonAccentText: { fontSize: 15, fontWeight: '600', color: colors.white },
  actionButtonGhost: {
    borderWidth: 1.5, borderColor: colors.mapAccent,
    borderRadius: borderRadius.xl, paddingVertical: 13, alignItems: 'center',
  },
  actionButtonGhostText: { fontSize: 15, fontWeight: '600', color: colors.mapAccent },

  // Empty state
  emptySection: { paddingHorizontal: 16, paddingTop: 20 },
  emptyBox: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: 28, alignItems: 'center', gap: 8,
  },
  emptyEmoji: { fontSize: 36, opacity: 0.4 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  emptyDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  // Candidate list
  candidateSection: { paddingHorizontal: 16, paddingTop: 20 },
  candidateCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  candidateCardSelected: { borderColor: colors.mapAccent, backgroundColor: colors.mapAccentLight },
  candidateInfo: { flex: 1, gap: 3 },
  candidateHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  numBadge: {
    backgroundColor: colors.mapAccentLight, borderWidth: 1, borderColor: colors.mapAccent,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
  },
  numBadgeSelected: { backgroundColor: colors.mapAccent },
  numBadgeText: { fontSize: 10, fontWeight: '700', color: colors.mapAccent },
  numBadgeTextSelected: { color: colors.white },
  selectedChip: {
    backgroundColor: colors.mapAccent, borderRadius: borderRadius.full,
    paddingHorizontal: 8, paddingVertical: 1,
  },
  selectedChipText: { fontSize: 10, fontWeight: '700', color: colors.white },
  distanceText: { fontSize: 11, color: colors.textTertiary, marginLeft: 'auto' },
  candidateName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  candidateType: { fontSize: 12, color: colors.textSecondary },
  candidateRating: { fontSize: 12, color: colors.textSecondary },
  candidateAddress: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  selectButton: {
    borderWidth: 1.5, borderColor: colors.mapAccent, borderRadius: borderRadius.md,
    paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', minWidth: 80,
  },
  selectButtonSelected: { backgroundColor: colors.mapAccent },
  selectButtonLoading: { opacity: 0.6 },
  selectButtonText: { fontSize: 12, fontWeight: '600', color: colors.mapAccent },
  selectButtonTextSelected: { color: colors.white },
});
