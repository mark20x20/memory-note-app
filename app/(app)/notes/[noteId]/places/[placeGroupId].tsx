// Phase 12.5E: 場所候補確認画面
// Route: /(app)/notes/[noteId]/places/[placeGroupId]
//
// 特定の PlaceGroup に対して候補一覧を表示し、ユーザーが1件を選択できる。
// 候補が適切でない場合は手動入力画面へ遷移できる。
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
        {
          text: 'OK',
          onPress: () => router.back(),
        },
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

  // 候補を priority / other に分類
  const priorityCandidates = candidates.filter(isPriorityCandidate);
  const otherCandidates = candidates.filter((c) => !isPriorityCandidate(c));

  const isSelected = (c: PlaceCandidateDoc) => c.id === group.selectedCandidateId;

  function renderCandidate(candidate: PlaceCandidateDoc) {
    const selected = isSelected(candidate);
    const isLoading = selecting === candidate.id;
    return (
      <View
        key={candidate.id}
        style={[styles.candidateCard, selected && styles.candidateCardSelected]}
      >
        <View style={styles.candidateInfo}>
          {selected ? (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>選択中</Text>
            </View>
          ) : null}
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
              isLoading && styles.selectButtonLoading,
            ]}
            onPress={() => handleSelect(candidate)}
            disabled={isLoading || !!selecting}
          >
            {isLoading ? (
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
      <ScreenHeader title="場所を確認" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 現在の場所情報 ── */}
        <View style={styles.section}>
          <View style={styles.currentGroupCard}>
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
          </View>
        </View>

        {/* ── 候補なし ── */}
        {candidates.length === 0 ? (
          <View style={styles.section}>
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>候補が見つかりませんでした</Text>
              <Text style={styles.emptyDesc}>
                手動で場所を入力してください。
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── 訪問候補（restaurant/cafe/観光地/駅など） ── */}
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
  // 現在の場所情報カード
  currentGroupCard: {
    backgroundColor: colors.mapAccentLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.mapAccent + '44',
    padding: 16,
  },
  currentGroupLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  currentGroupCategory: {
    fontSize: 13,
    color: colors.mapAccent,
    marginBottom: 10,
  },
  currentGroupMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
  // 候補グループタイトル
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
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
