// Phase 12.5E: 訪れた場所一覧画面
// Route: /(app)/notes/[noteId]/places
//
// ノート内のすべての PlaceGroup を一覧表示する。
// owner/editor: 再推定ボタン・候補確認への遷移が可能
// viewer: 確定済み場所の閲覧のみ（未確定候補の操作不可）

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import {
  enrichNotePlacesCallable,
  GROUPING_PRESETS,
  type GroupingPreset,
} from '@/features/placeIntelligence/api/placeFunctionsClient';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import type { PlaceGroupDoc } from '@/features/map/types';

// ── 分割プリセット ─────────────────────────────────────────────────────────────

const PRESET_LABELS: Record<GroupingPreset, string> = {
  compact:  '細かく',
  standard: '標準',
  relaxed:  'ゆったり',
};

// ── ヘルパー ──────────────────────────────────────────────────────────────────

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

function getStatusBadge(group: PlaceGroupDoc): { label: string; color: string } {
  if (group.userConfirmed) {
    return { label: '確認済み', color: colors.success };
  }
  if (group.confidence >= 0.6) {
    return { label: '要確認', color: colors.warning };
  }
  return { label: '要確認', color: colors.error };
}

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function PlacesIndexScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note, isLoading: noteLoading } = useNoteDetail(noteId ?? null);
  const [groups, setGroups] = useState<PlaceGroupDoc[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [groupingPreset, setGroupingPreset] = useState<GroupingPreset>('standard');
  const unsubRef = useRef<(() => void) | null>(null);

  const userCanEdit = uid && note ? canEdit(note, uid) : false;

  useEffect(() => {
    if (!noteId) return;
    setGroupsLoading(true);
    unsubRef.current = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (next) => {
        setGroups(next);
        setGroupsLoading(false);
      },
      () => setGroupsLoading(false)
    );
    return () => unsubRef.current?.();
  }, [noteId]);

  async function handleEnrich() {
    if (!noteId) return;
    setEnriching(true);
    setEnrichError(null);
    try {
      await enrichNotePlacesCallable({
        noteId,
        grouping: GROUPING_PRESETS[groupingPreset],
      });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : '場所の推定に失敗しました';
      setEnrichError(msg);
    } finally {
      setEnriching(false);
    }
  }

  if (noteLoading || groupsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="訪れた場所" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mapAccent} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="訪れた場所"
        onBack={() => router.back()}
        rightElement={
          groups.length > 0 ? (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/notes/${noteId}/map`)}
              hitSlop={8}
            >
              <Text style={styles.mapLinkText}>地図で見る</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 推定ボタン + プリセット（owner/editor のみ） ── */}
        {userCanEdit ? (
          <View style={styles.enrichSection}>
            {/* 分割プリセット */}
            <Text style={styles.presetLabel}>写真のまとめ方</Text>
            <View style={styles.presetChipRow}>
              {(['compact', 'standard', 'relaxed'] as GroupingPreset[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetChip, groupingPreset === p && styles.presetChipSelected]}
                  onPress={() => setGroupingPreset(p)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, groupingPreset === p && styles.presetChipTextSelected]}>
                    {PRESET_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.enrichButton, enriching && styles.enrichButtonDisabled]}
              onPress={handleEnrich}
              disabled={enriching}
            >
              {enriching ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.enrichButtonText}>写真から場所を推定</Text>
              )}
            </TouchableOpacity>
            {enrichError ? (
              <Text style={styles.errorText}>{enrichError}</Text>
            ) : null}
          </View>
        ) : null}

        {/* ── PlaceGroup 一覧 ── */}
        <View style={styles.section}>
          {groups.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyTitle}>まだ場所が推定されていません</Text>
              <Text style={styles.emptyDesc}>
                {userCanEdit
                  ? '「写真から場所を推定」ボタンを押して候補を取得してください。'
                  : '位置情報のある写真が追加されると、場所が推定されます。'}
              </Text>
            </View>
          ) : (
            groups.map((group, idx) => {
              const badge = getStatusBadge(group);
              const isConfirmed = group.userConfirmed;
              const timeStr = formatStartTime(group);
              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => {
                    // viewer は未確認グループの候補操作不可 → 確認済みは常に表示
                    if (!userCanEdit && !isConfirmed) return;
                    router.push(`/(app)/notes/${noteId}/places/${group.id}`);
                  }}
                  activeOpacity={userCanEdit || isConfirmed ? 0.7 : 1}
                >
                  <View style={styles.groupCardHeader}>
                    <View style={styles.groupNumberBadge}>
                      <Text style={styles.groupNumberText}>#{idx + 1}</Text>
                    </View>
                    {timeStr ? (
                      <Text style={styles.groupTimeText}>{timeStr}</Text>
                    ) : null}
                    <Text style={styles.groupLabel} numberOfLines={1}>
                      {group.label}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.color + '22' }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.groupCategory}>
                    {getCategoryLabel(group.category)}
                  </Text>

                  {/* 写真サムネイル */}
                  {(() => {
                    const urls = group.photoPreviewURLs && group.photoPreviewURLs.length > 0
                      ? group.photoPreviewURLs.slice(0, 3)
                      : group.coverPhotoURL ? [group.coverPhotoURL] : [];
                    return urls.length > 0 ? (
                      <View style={styles.thumbRow}>
                        {urls.map((url, ti) => (
                          <Image
                            key={ti}
                            source={{ uri: url }}
                            style={styles.thumb}
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    ) : null;
                  })()}

                  <View style={styles.groupMeta}>
                    {group.photoCount > 0 ? (
                      <Text style={styles.groupMetaItem}>写真 {group.photoCount}枚</Text>
                    ) : null}
                    {!isConfirmed && userCanEdit ? (
                      <Text style={styles.groupMetaAction}>→ 場所を確認・編集</Text>
                    ) : null}
                    {!isConfirmed && !userCanEdit ? (
                      <Text style={styles.groupMetaUnconfirmed}>未確認</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── 手動追加ボタン（owner/editor のみ） ── */}
        {userCanEdit ? (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => router.push(`/(app)/notes/${noteId}/places/manual`)}
            >
              <Text style={styles.manualButtonText}>+ 手動で場所を追加</Text>
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
  scroll: {
    paddingBottom: 48,
  },
  // 地図リンク
  mapLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  // 推定セクション
  enrichSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  // 分割プリセット
  presetLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  presetChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: colors.surface,
  },
  presetChipSelected: {
    borderColor: colors.mapAccent,
    backgroundColor: colors.mapAccentLight,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  presetChipTextSelected: {
    color: colors.mapAccent,
    fontWeight: '600',
  },
  enrichButton: {
    backgroundColor: colors.mapAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  enrichButtonDisabled: {
    opacity: 0.6,
  },
  enrichButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
  },
  // セクション
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
    fontSize: 40,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // グループカード
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  groupNumberBadge: {
    backgroundColor: colors.mapAccent,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  groupNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  groupTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 0,
  },
  groupLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  groupCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  // 写真サムネイル
  thumbRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  groupMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  groupMetaItem: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  groupMetaAction: {
    fontSize: 12,
    color: colors.mapAccent,
    fontWeight: '500',
  },
  groupMetaUnconfirmed: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  // 手動追加ボタン
  manualButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
