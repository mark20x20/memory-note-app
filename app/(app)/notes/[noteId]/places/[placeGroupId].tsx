// Phase 12.5E: 場所候補確認画面
// Phase 12.5G-3: フロー詳細編集画面
// Phase 12.5G-4: フロー編集画面として明確化
// Route: /(app)/notes/[noteId]/places/[placeGroupId]
//
// 上部: このフロー（時刻・写真サムネイル・場所名・カテゴリ・一言メモ）
// 下部: 候補地図（大きめ 280px）・候補一覧・手動入力
// viewer は閲覧のみ（選択・メモ編集不可）。

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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, type Region } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import {
  selectPlaceCandidateCallable,
  updatePlaceGroupManuallyCallable,
} from '@/features/placeIntelligence/api/placeFunctionsClient';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import type { PlaceGroupDoc, PlaceCandidateDoc } from '@/features/map/types';

// ── 候補地図 定数 ─────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const CANDIDATE_MAP_HEIGHT = 280;
const DEFAULT_DELTA = 0.008;

// ── 候補カテゴリ分類 ──────────────────────────────────────────────────────────

const PRIORITY_TYPES = new Set([
  'restaurant',
  'food',
  'cafe',
  'coffee_shop',
  'tourist_attraction',
  'museum',
  'park',
  'hotel',
  'lodging',
  'shopping_mall',
  'store',
  'transit_station',
  'train_station',
  'subway_station',
]);

function isPriorityCandidate(candidate: PlaceCandidateDoc): boolean {
  return candidate.types.some((t) => PRIORITY_TYPES.has(t));
}

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    restaurant: 'レストラン',
    cafe: 'カフェ',
    tourist_attraction: '観光地',
    station: '駅',
    hotel: 'ホテル',
    shopping: 'ショッピング',
    park: '公園',
    museum: '美術館・博物館',
    area: 'エリア',
    unknown: 'その他',
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
    restaurant: 'レストラン',
    food: '飲食',
    cafe: 'カフェ',
    coffee_shop: 'カフェ',
    tourist_attraction: '観光地',
    museum: '美術館・博物館',
    park: '公園',
    hotel: 'ホテル',
    lodging: '宿泊',
    shopping_mall: 'ショッピング',
    store: '店舗',
    transit_station: '交通機関',
    train_station: '鉄道駅',
    subway_station: '地下鉄駅',
    locality: '地区',
    neighborhood: '近隣',
  };
  const labels = types.slice(0, 2).map((t) => labelMap[t] ?? t).filter(Boolean);
  return labels.join(' · ');
}

function formatStartTime(group: PlaceGroupDoc): string | null {
  const sa = group.startAt;
  if (!sa) return null;
  let date: Date | null = null;
  if (typeof (sa as { toDate?: () => Date }).toDate === 'function') {
    date = (sa as { toDate: () => Date }).toDate();
  }
  if (!date) return null;
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ── 候補地図ヘルパー ──────────────────────────────────────────────────────────

function getCandidatesWithLocation(
  candidates: PlaceCandidateDoc[]
): (PlaceCandidateDoc & { latitude: number; longitude: number })[] {
  return candidates.filter(
    (c): c is PlaceCandidateDoc & { latitude: number; longitude: number } =>
      typeof c.latitude === 'number' &&
      typeof c.longitude === 'number' &&
      !Number.isNaN(c.latitude) &&
      !Number.isNaN(c.longitude)
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

function CandidateMarkerView({ number, selected }: { number: number; selected: boolean }) {
  return (
    <View style={candidateMarkerStyles.wrapper}>
      <View
        style={[
          candidateMarkerStyles.badge,
          selected ? candidateMarkerStyles.badgeSelected : candidateMarkerStyles.badgeDefault,
        ]}
      >
        <Text
          style={[
            candidateMarkerStyles.text,
            selected ? candidateMarkerStyles.textSelected : candidateMarkerStyles.textDefault,
          ]}
        >
          {number}
        </Text>
      </View>
      <View
        style={[
          candidateMarkerStyles.stem,
          selected ? candidateMarkerStyles.stemSelected : candidateMarkerStyles.stemDefault,
        ]}
      />
    </View>
  );
}

const BADGE_W = 26;
const BADGE_H = 22;
const STEM_H = 5;

const candidateMarkerStyles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  badge: {
    width: BADGE_W,
    height: BADGE_H,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeDefault: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
  },
  badgeSelected: {
    backgroundColor: colors.mapAccent,
  },
  text: { fontSize: 10, fontWeight: '700' },
  textDefault: { color: colors.mapAccent },
  textSelected: { color: colors.white },
  stem: {
    width: 0,
    height: 0,
    borderLeftWidth: STEM_H / 2,
    borderRightWidth: STEM_H / 2,
    borderTopWidth: STEM_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
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
  const [group, setGroup] = useState<PlaceGroupDoc | null>(null);
  const [candidates, setCandidates] = useState<PlaceCandidateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  // イベントメモ
  const [eventMemo, setEventMemo] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);

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
        if (g?.eventMemo) setEventMemo(g.eventMemo);
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
      Alert.alert('確定しました', `「${candidate.name}」を訪れた場所として確定しました。`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : '候補の確定に失敗しました';
      Alert.alert('エラー', msg);
    } finally {
      setSelecting(null);
    }
  }

  async function handleSaveMemo() {
    if (!noteId || !placeGroupId || !userCanEdit) return;
    setSavingMemo(true);
    try {
      await updatePlaceGroupManuallyCallable({
        noteId,
        placeGroupId,
        eventMemo: eventMemo.trim() || null,
      });
      Alert.alert('保存しました', '一言メモを保存しました。');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'メモの保存に失敗しました';
      Alert.alert('エラー', msg);
    } finally {
      setSavingMemo(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="フローを編集" onBack={() => router.back()} />
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
        <ScreenHeader title="フローを編集" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorText}>データが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 候補を priority / other に分類
  const priorityCandidates = candidates.filter(isPriorityCandidate);
  const otherCandidates = candidates.filter((c) => !isPriorityCandidate(c));

  // 候補地図用
  const candidatesWithLoc = getCandidatesWithLocation(candidates);
  const candidateMapRegion =
    candidatesWithLoc.length > 0
      ? calcCandidateRegion(candidatesWithLoc, group.latitude, group.longitude)
      : {
          latitude: group.latitude,
          longitude: group.longitude,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        };

  const isSelected = (c: PlaceCandidateDoc) => c.id === group.selectedCandidateId;

  // 写真サムネイル
  const thumbURLs =
    group.photoPreviewURLs && group.photoPreviewURLs.length > 0
      ? group.photoPreviewURLs.slice(0, 3)
      : group.coverPhotoURL
      ? [group.coverPhotoURL]
      : [];

  const timeStr = formatStartTime(group);

  function renderCandidate(candidate: PlaceCandidateDoc) {
    const selected = isSelected(candidate);
    const isLoadingCandidate = selecting === candidate.id;
    const globalIdx = candidates.findIndex((x) => x.id === candidate.id);
    return (
      <View
        key={candidate.id}
        style={[styles.candidateCard, selected && styles.candidateCardSelected]}
      >
        <View style={styles.candidateInfo}>
          <View style={styles.candidateHeader}>
            <View style={[styles.candidateNumBadge, selected && styles.candidateNumBadgeSelected]}>
              <Text style={[styles.candidateNumText, selected && styles.candidateNumTextSelected]}>
                #{globalIdx + 1}
              </Text>
            </View>
            {selected ? (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>選択中</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.candidateName}>{candidate.name}</Text>
          <View style={styles.candidateMeta}>
            {candidate.distanceMeters != null ? (
              <Text style={styles.candidateMetaItem}>
                {formatDistance(candidate.distanceMeters)}
              </Text>
            ) : null}
            {candidate.rating != null ? (
              <Text style={styles.candidateMetaItem}>★ {candidate.rating.toFixed(1)}</Text>
            ) : null}
            {candidate.types.length > 0 ? (
              <Text style={styles.candidateMetaItem}>{getTypeLabels(candidate.types)}</Text>
            ) : null}
          </View>
          {candidate.address ? (
            <Text style={styles.candidateAddress} numberOfLines={1}>
              {candidate.address}
            </Text>
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
                {selected ? '確定済み' : '選択'}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="フローを編集" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── このフロー情報 ── */}
        <View style={styles.section}>
          <Text style={styles.groupTitleLabel}>このフロー</Text>
          <View style={styles.currentGroupCard}>
            {timeStr ? (
              <Text style={styles.flowTime}>{timeStr}</Text>
            ) : null}
            <Text style={styles.currentGroupLabel}>{group.label}</Text>
            <Text style={styles.currentGroupCategory}>{getCategoryLabel(group.category)}</Text>
            <View style={styles.currentGroupMeta}>
              {group.photoCount > 0 ? (
                <Text style={styles.metaChip}>写真 {group.photoCount}枚</Text>
              ) : null}
              <Text style={[styles.metaChip, group.userConfirmed ? styles.confirmedChip : styles.pendingChip]}>
                {group.userConfirmed ? '確認済み' : '未確認'}
              </Text>
            </View>

            {/* 写真サムネイル */}
            {thumbURLs.length > 0 ? (
              <View style={styles.thumbRow}>
                {thumbURLs.map((url, ti) => (
                  <Image
                    key={ti}
                    source={{ uri: url }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* ── 一言メモ ── */}
        <View style={styles.section}>
          <Text style={styles.groupTitleLabel}>一言メモ</Text>
          {userCanEdit ? (
            <View style={styles.memoInputCard}>
              <TextInput
                style={styles.memoInput}
                value={eventMemo}
                onChangeText={setEventMemo}
                placeholder="このフローの一言メモを入力..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={200}
              />
              <View style={styles.memoInputFooter}>
                <Text style={styles.memoCharCount}>{eventMemo.length}/200</Text>
                <TouchableOpacity
                  style={[styles.memoSaveButton, savingMemo && styles.memoSaveButtonDisabled]}
                  onPress={handleSaveMemo}
                  disabled={savingMemo}
                >
                  {savingMemo ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.memoSaveButtonText}>保存</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : group.eventMemo ? (
            <View style={styles.memoReadonly}>
              <Text style={styles.memoReadonlyText}>{group.eventMemo}</Text>
            </View>
          ) : (
            <Text style={styles.memoEmpty}>メモなし</Text>
          )}
        </View>

        {/* ── 候補地図 ── */}
        {candidatesWithLoc.length > 0 ? (
          <View style={styles.candidateMapSection}>
            <Text style={styles.groupTitle}>候補地図</Text>
            <Text style={styles.candidateMapDesc}>
              候補の位置を地図で確認して、正しい場所を選んでください。
            </Text>
            <View style={styles.candidateMapContainer}>
              <MapView
                style={{ width: SCREEN_WIDTH - 40, height: CANDIDATE_MAP_HEIGHT }}
                initialRegion={candidateMapRegion}
                showsUserLocation={false}
                showsCompass={false}
                scrollEnabled
                zoomEnabled
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
        ) : null}

        {/* ── 候補なし ── */}
        {candidates.length === 0 ? (
          <View style={styles.section}>
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>候補が見つかりませんでした</Text>
              <Text style={styles.emptyDesc}>手動で場所を入力してください。</Text>
            </View>
          </View>
        ) : null}

        {/* ── 訪問候補 ── */}
        {priorityCandidates.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.groupTitle}>訪問候補</Text>
            {priorityCandidates.map(renderCandidate)}
          </View>
        ) : null}

        {/* ── その他の近隣候補 ── */}
        {otherCandidates.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.groupTitle}>その他の近隣</Text>
            {otherCandidates.map(renderCandidate)}
          </View>
        ) : null}

        {/* ── 手動入力ボタン（owner/editor のみ） ── */}
        {userCanEdit ? (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() =>
                router.push(
                  `/(app)/notes/${noteId}/places/manual?placeGroupId=${placeGroupId}`
                )
              }
            >
              <Text style={styles.manualButtonText}>候補にない場所を手動で入力</Text>
            </TouchableOpacity>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

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
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scroll: {
    paddingBottom: 48,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  groupTitleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  // このフロー情報カード
  currentGroupCard: {
    backgroundColor: colors.mapAccentLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.mapAccent + '44',
    padding: 16,
    gap: 4,
  },
  flowTime: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  currentGroupLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentGroupCategory: {
    fontSize: 13,
    color: colors.mapAccent,
  },
  currentGroupMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  metaChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 12,
    color: colors.textSecondary,
    overflow: 'hidden',
  },
  confirmedChip: {
    color: colors.success,
  },
  pendingChip: {
    color: colors.warning,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  // 一言メモ
  memoInputCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  memoInput: {
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  memoInputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  memoCharCount: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  memoSaveButton: {
    backgroundColor: colors.mapAccent,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  memoSaveButtonDisabled: {
    opacity: 0.6,
  },
  memoSaveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  memoReadonly: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  memoReadonlyText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  memoEmpty: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  // 候補地図セクション
  candidateMapSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  candidateMapDesc: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  candidateMapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  // 候補グループタイトル
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  // 候補カード
  candidateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  candidateCardSelected: {
    borderColor: colors.mapAccent,
    backgroundColor: colors.mapAccentLight,
  },
  candidateInfo: {
    flex: 1,
    gap: 3,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  candidateNumBadge: {
    backgroundColor: colors.mapAccentLight,
    borderWidth: 1,
    borderColor: colors.mapAccent,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  candidateNumBadgeSelected: {
    backgroundColor: colors.mapAccent,
    borderColor: colors.mapAccent,
  },
  candidateNumText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mapAccent,
  },
  candidateNumTextSelected: {
    color: colors.white,
  },
  selectedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mapAccent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  candidateName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  candidateMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  candidateMetaItem: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  candidateAddress: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // 選択ボタン
  selectButton: {
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 64,
  },
  selectButtonSelected: {
    backgroundColor: colors.mapAccent,
    borderColor: colors.mapAccent,
  },
  selectButtonLoading: {
    opacity: 0.6,
  },
  selectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  selectButtonTextSelected: {
    color: colors.white,
  },
  // 空状態
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 36,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // 手動入力ボタン
  manualButton: {
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mapAccent,
  },
});
