// Phase 12.5E: 場所候補確認画面
// Phase 12.5E-2: UX改善
//   - 手動入力導線を画面上部に移動
//   - 候補カードに番号表示 (#1, #2, ...)
//   - カテゴリタグ表示
//   - カテゴリフィルタチップ（横スクロール）追加
//   - 候補を distanceMeters 昇順で統一表示（priority / other 分類を廃止）
// Route: /(app)/notes/[noteId]/places/[placeGroupId]
//
// viewer は閲覧のみ（選択・修正不可）。

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import { selectPlaceCandidateCallable } from '@/features/placeIntelligence/api/placeFunctionsClient';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import type { PlaceGroupDoc, PlaceCandidateDoc } from '@/features/map/types';

// ── カテゴリフィルタ定義 ──────────────────────────────────────────────────────

type CategoryFilter = {
  key: string;
  label: string;
  types: string[];
};

const CATEGORY_FILTERS: CategoryFilter[] = [
  { key: 'all', label: 'すべて', types: [] },
  { key: 'restaurant', label: 'レストラン', types: ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'] },
  { key: 'cafe', label: 'カフェ', types: ['cafe', 'coffee_shop', 'bakery'] },
  { key: 'tourist', label: '観光地', types: ['tourist_attraction', 'landmark', 'point_of_interest', 'natural_feature'] },
  { key: 'station', label: '駅', types: ['transit_station', 'train_station', 'subway_station', 'bus_station', 'bus_stop', 'light_rail_station'] },
  { key: 'hotel', label: 'ホテル', types: ['hotel', 'lodging', 'motel'] },
  { key: 'shopping', label: 'ショッピング', types: ['shopping_mall', 'store', 'clothing_store', 'department_store', 'convenience_store', 'supermarket'] },
  { key: 'park', label: '公園', types: ['park', 'playground', 'campground'] },
  { key: 'museum', label: '美術館・博物館', types: ['museum', 'art_gallery', 'library'] },
  { key: 'other', label: 'その他', types: [] }, // 上記いずれにも一致しないもの
];

// ── ヘルパー関数 ──────────────────────────────────────────────────────────────

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

/** candidate の types から最初に一致するカテゴリフィルターキーを返す */
function getCandidateCategoryKey(types: string[]): string {
  for (const filter of CATEGORY_FILTERS) {
    if (filter.key === 'all' || filter.key === 'other') continue;
    if (types.some((t) => filter.types.includes(t))) return filter.key;
  }
  return 'other';
}

/** candidate の types から最初に一致する日本語ラベルを返す */
function getCandidateCategoryLabel(types: string[]): string {
  const labelMap: Record<string, string> = {
    restaurant: 'レストラン',
    food: '飲食',
    meal_takeaway: 'テイクアウト',
    cafe: 'カフェ',
    coffee_shop: 'カフェ',
    bakery: 'ベーカリー',
    tourist_attraction: '観光地',
    landmark: 'ランドマーク',
    natural_feature: '自然',
    museum: '美術館・博物館',
    art_gallery: 'ギャラリー',
    library: '図書館',
    park: '公園',
    playground: '公園',
    hotel: 'ホテル',
    lodging: '宿泊',
    shopping_mall: 'ショッピング',
    store: '店舗',
    convenience_store: 'コンビニ',
    supermarket: 'スーパー',
    transit_station: '交通機関',
    train_station: '鉄道駅',
    subway_station: '地下鉄駅',
    bus_station: 'バス停',
    locality: '地区',
    neighborhood: '近隣',
    point_of_interest: 'スポット',
  };
  for (const t of types) {
    if (labelMap[t]) return labelMap[t];
  }
  return 'その他';
}

function formatDistance(meters?: number): string {
  if (meters == null) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function filterCandidates(
  candidates: PlaceCandidateDoc[],
  filterKey: string
): PlaceCandidateDoc[] {
  if (filterKey === 'all') return candidates;
  if (filterKey === 'other') {
    // 他のカテゴリのどれにも一致しないもの
    return candidates.filter(
      (c) => getCandidateCategoryKey(c.types) === 'other'
    );
  }
  const filter = CATEGORY_FILTERS.find((f) => f.key === filterKey);
  if (!filter) return candidates;
  return candidates.filter((c) =>
    c.types.some((t) => filter.types.includes(t))
  );
}

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
  const [activeFilter, setActiveFilter] = useState<string>('all');

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="場所を確認" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mapAccent} />
          <Text style={styles.loadingText}>候補を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="場所を確認" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorText}>場所が見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredCandidates = filterCandidates(candidates, activeFilter);
  const isSelected = (c: PlaceCandidateDoc) => c.id === group.selectedCandidateId;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="場所を確認" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 現在の場所情報 ── */}
        <View style={styles.section}>
          <View style={styles.currentGroupCard}>
            <Text style={styles.currentGroupLabel}>{group.label}</Text>
            <View style={styles.currentGroupTagRow}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{getCategoryLabel(group.category)}</Text>
              </View>
              {group.photoCount > 0 ? (
                <Text style={styles.metaText}>写真 {group.photoCount}枚</Text>
              ) : null}
              <View style={[
                styles.confirmedBadge,
                { backgroundColor: (group.userConfirmed ? colors.success : colors.warning) + '22' }
              ]}>
                <Text style={[
                  styles.confirmedBadgeText,
                  { color: group.userConfirmed ? colors.success : colors.warning }
                ]}>
                  {group.userConfirmed ? '確認済み' : '未確認'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 手動入力バナー（owner/editor のみ、上部に配置） ── */}
        {userCanEdit ? (
          <View style={styles.section}>
            <View style={styles.manualBanner}>
              <View style={styles.manualBannerLeft}>
                <Text style={styles.manualBannerTitle}>候補にない場合</Text>
                <Text style={styles.manualBannerDesc}>
                  正しい場所がなければ、場所名を手動で入力できます。
                </Text>
              </View>
              <TouchableOpacity
                style={styles.manualBannerButton}
                onPress={() =>
                  router.push(
                    `/(app)/notes/${noteId}/places/manual?placeGroupId=${placeGroupId}`
                  )
                }
              >
                <Text style={styles.manualBannerButtonText}>手動で入力</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ── カテゴリフィルタ ── */}
        {candidates.length > 0 ? (
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {CATEGORY_FILTERS.map((filter) => {
                const isActive = activeFilter === filter.key;
                const count = filter.key === 'all'
                  ? candidates.length
                  : filterCandidates(candidates, filter.key).length;
                if (filter.key !== 'all' && count === 0) return null;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setActiveFilter(filter.key)}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {filter.label}
                      {filter.key !== 'all' ? ` ${count}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* ── 候補なし（全体） ── */}
        {candidates.length === 0 ? (
          <View style={styles.section}>
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>候補が見つかりませんでした</Text>
              <Text style={styles.emptyDesc}>手動で場所を入力してください。</Text>
            </View>
          </View>
        ) : null}

        {/* ── フィルタ後の候補リスト ── */}
        {candidates.length > 0 ? (
          <View style={styles.section}>
            {filteredCandidates.length === 0 ? (
              <View style={styles.filterEmptyBox}>
                <Text style={styles.filterEmptyText}>
                  このカテゴリの候補はありません
                </Text>
              </View>
            ) : (
              filteredCandidates.map((candidate, index) => {
                const selected = isSelected(candidate);
                const isLoading = selecting === candidate.id;
                const globalIndex = candidates.indexOf(candidate);
                const candidateNumber = globalIndex + 1;
                const catLabel = getCandidateCategoryLabel(candidate.types);

                return (
                  <View
                    key={candidate.id}
                    style={[styles.candidateCard, selected && styles.candidateCardSelected]}
                  >
                    {/* 番号バッジ */}
                    <View style={[styles.numberBadge, selected && styles.numberBadgeSelected]}>
                      <Text style={[styles.numberText, selected && styles.numberTextSelected]}>
                        #{candidateNumber}
                      </Text>
                    </View>

                    <View style={styles.candidateBody}>
                      {/* 候補名 */}
                      <View style={styles.candidateNameRow}>
                        {selected ? (
                          <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>選択中</Text>
                          </View>
                        ) : null}
                        <Text style={styles.candidateName}>{candidate.name}</Text>
                      </View>

                      {/* カテゴリタグ + メタ情報 */}
                      <View style={styles.candidateTagRow}>
                        <View style={styles.candidateCategoryTag}>
                          <Text style={styles.candidateCategoryTagText}>{catLabel}</Text>
                        </View>
                        {candidate.distanceMeters != null ? (
                          <Text style={styles.candidateMetaItem}>
                            {formatDistance(candidate.distanceMeters)}
                          </Text>
                        ) : null}
                        {candidate.rating != null ? (
                          <Text style={styles.candidateMetaItem}>
                            ★ {candidate.rating.toFixed(1)}
                          </Text>
                        ) : null}
                      </View>

                      {candidate.address ? (
                        <Text style={styles.candidateAddress} numberOfLines={1}>
                          {candidate.address}
                        </Text>
                      ) : null}
                    </View>

                    {/* 選択ボタン */}
                    {userCanEdit ? (
                      <TouchableOpacity
                        style={[
                          styles.selectButton,
                          selected && styles.selectButtonSelected,
                          isLoading && styles.selectButtonLoading,
                        ]}
                        onPress={() => handleSelect(candidate)}
                        disabled={isLoading || !!selecting}
                      >
                        {isLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={selected ? colors.white : colors.mapAccent}
                          />
                        ) : (
                          <Text style={[
                            styles.selectButtonText,
                            selected && styles.selectButtonTextSelected,
                          ]}>
                            {selected ? '確定済み' : '選択'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })
            )}
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
    paddingTop: 16,
  },
  // 現在の場所情報カード
  currentGroupCard: {
    backgroundColor: colors.mapAccentLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.mapAccent + '44',
    padding: 16,
    gap: 10,
  },
  currentGroupLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentGroupTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: colors.mapAccent + '33',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  metaText: {
    fontSize: 12,
    color: colors.mapAccent,
  },
  confirmedBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // 手動入力バナー
  manualBanner: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manualBannerLeft: {
    flex: 1,
    gap: 2,
  },
  manualBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  manualBannerDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  manualBannerButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  manualBannerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  // カテゴリフィルタ
  filterSection: {
    paddingTop: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    borderColor: colors.mapAccent,
    backgroundColor: colors.mapAccentLight,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.mapAccent,
    fontWeight: '600',
  },
  // 候補なし
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
  filterEmptyBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    alignItems: 'center',
  },
  filterEmptyText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  // 候補カード
  candidateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  candidateCardSelected: {
    borderColor: colors.mapAccent,
    backgroundColor: colors.mapAccentLight,
  },
  // 番号バッジ
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  numberBadgeSelected: {
    backgroundColor: colors.mapAccent,
  },
  numberText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  numberTextSelected: {
    color: colors.white,
  },
  candidateBody: {
    flex: 1,
    gap: 4,
  },
  candidateNameRow: {
    gap: 4,
  },
  selectedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mapAccent,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  candidateTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  candidateCategoryTag: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  candidateCategoryTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  candidateMetaItem: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  candidateAddress: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  // 選択ボタン
  selectButton: {
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 60,
    flexShrink: 0,
  },
  selectButtonSelected: {
    backgroundColor: colors.mapAccent,
    borderColor: colors.mapAccent,
  },
  selectButtonLoading: {
    opacity: 0.6,
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  selectButtonTextSelected: {
    color: colors.white,
  },
});
