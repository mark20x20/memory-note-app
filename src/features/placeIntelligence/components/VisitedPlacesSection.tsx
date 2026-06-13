// Phase 12.5E: 訪れた場所セクション — ノート詳細画面に挿入するコンポーネント
//
// 表示ロジック:
//   idle     → 「場所を推定する」ボタン
//   fetching → スピナー
//   completed→ 上位3件のPlaceGroupカード + 「場所をすべて見る」リンク
//   failed   → エラー + 再試行ボタン

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import type { NoteDoc } from '@/core/repositories/noteRepository';
import type { PlaceGroupDoc } from '@/features/map/types';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import {
  enrichNotePlacesCallable,
  GROUPING_PRESETS,
  type GroupingPreset,
} from '@/features/placeIntelligence/api/placeFunctionsClient';

// ── 型 ─────────────────────────────────────────────────────────────────────────

type Props = {
  noteId: string;
  note: NoteDoc;
  canEdit: boolean;
};

// ── 分割プリセット設定 ────────────────────────────────────────────────────────

const PRESET_LABELS: Record<GroupingPreset, string> = {
  compact:  '細かく',
  standard: '標準',
  relaxed:  'ゆったり',
};

// ── ヘルパー関数 ──────────────────────────────────────────────────────────────

function getStatusBadge(group: PlaceGroupDoc): { label: string; color: string } {
  if (group.userConfirmed) {
    return { label: '確認済み', color: colors.success };
  }
  if (group.confidence >= 0.6) {
    return { label: '要確認', color: colors.warning };
  }
  return { label: '要確認', color: colors.error };
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

// ── コンポーネント ────────────────────────────────────────────────────────────

export function VisitedPlacesSection({ noteId, note, canEdit }: Props) {
  const [groups, setGroups] = useState<PlaceGroupDoc[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [groupingPreset, setGroupingPreset] = useState<GroupingPreset>('standard');
  const unsubRef = useRef<(() => void) | null>(null);

  // PlaceGroup をリアルタイム監視
  useEffect(() => {
    unsubRef.current = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (next) => setGroups(next),
      () => {}
    );
    return () => unsubRef.current?.();
  }, [noteId]);

  const status = note.placeEnrichmentStatus ?? 'idle';

  async function handleEnrich() {
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

  // ── idle ──────────────────────────────────────────────────────────────────
  if (status === 'idle' && groups.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>訪れた場所</Text>
        <View style={styles.card}>
          <Text style={styles.idleEmoji}>📍</Text>
          <Text style={styles.idleTitle}>写真の位置情報から訪れた場所を推定できます</Text>
          <Text style={styles.idleDesc}>
            写真の GPS データをもとに、訪れた場所の候補を表示します。
          </Text>
          {canEdit ? (
            <>
              <GroupingPresetChips
                selected={groupingPreset}
                onChange={setGroupingPreset}
              />
              <TouchableOpacity
                style={[styles.primaryButton, enriching && styles.primaryButtonDisabled]}
                onPress={handleEnrich}
                disabled={enriching}
              >
                {enriching ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>場所を推定する</Text>
                )}
              </TouchableOpacity>
            </>
          ) : null}
          {enrichError ? (
            <Text style={styles.errorText}>{enrichError}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  // ── fetching ──────────────────────────────────────────────────────────────
  if (status === 'fetching') {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>訪れた場所</Text>
        <View style={[styles.card, styles.cardCenter]}>
          <ActivityIndicator size="small" color={colors.mapAccent} />
          <Text style={styles.fetchingText}>場所情報を取得中...</Text>
        </View>
      </View>
    );
  }

  // ── failed ────────────────────────────────────────────────────────────────
  if (status === 'failed' && groups.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>訪れた場所</Text>
        <View style={[styles.card, styles.cardCenter]}>
          <Text style={styles.failedEmoji}>⚠️</Text>
          <Text style={styles.failedTitle}>場所の取得に失敗しました</Text>
          {note.placeEnrichmentError ? (
            <Text style={styles.failedDetail}>{note.placeEnrichmentError}</Text>
          ) : null}
          {canEdit ? (
            <TouchableOpacity
              style={[styles.outlineButton, enriching && styles.outlineButtonDisabled]}
              onPress={handleEnrich}
              disabled={enriching}
            >
              {enriching ? (
                <ActivityIndicator size="small" color={colors.mapAccent} />
              ) : (
                <Text style={styles.outlineButtonText}>再試行する</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  // ── completed / groups あり ───────────────────────────────────────────────
  const topGroups = groups.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>訪れた場所</Text>
        <View style={styles.sectionHeaderLinks}>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/notes/${noteId}/map`)}
            hitSlop={8}
          >
            <Text style={styles.seeAllLink}>地図で見る</Text>
          </TouchableOpacity>
          <Text style={styles.sectionHeaderDivider}>·</Text>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/notes/${noteId}/places`)}
            hitSlop={8}
          >
            <Text style={styles.seeAllLink}>すべて見る</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.descText}>
        近くの施設候補です。違う場合は、候補から選ぶか手動で入力してください。
      </Text>

      {topGroups.map((group) => {
        const badge = getStatusBadge(group);
        return (
          <TouchableOpacity
            key={group.id}
            style={styles.groupCard}
            onPress={() => router.push(`/(app)/notes/${noteId}/places/${group.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.groupCardLeft}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <Text style={styles.groupMeta}>
                {getCategoryLabel(group.category)}
                {group.photoCount > 0 ? ` · 写真${group.photoCount}枚` : ''}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: badge.color + '22' }]}>
              <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {groups.length > 3 ? (
        <TouchableOpacity
          style={styles.moreLink}
          onPress={() => router.push(`/(app)/notes/${noteId}/places`)}
        >
          <Text style={styles.moreLinkText}>他 {groups.length - 3} 件の場所を見る</Text>
        </TouchableOpacity>
      ) : null}

      {canEdit ? (
        <>
          <GroupingPresetChips
            selected={groupingPreset}
            onChange={setGroupingPreset}
          />
          <TouchableOpacity
            style={[styles.outlineButton, styles.outlineButtonSmall, enriching && styles.outlineButtonDisabled]}
            onPress={handleEnrich}
            disabled={enriching}
          >
            {enriching ? (
              <ActivityIndicator size="small" color={colors.mapAccent} />
            ) : (
              <Text style={styles.outlineButtonText}>写真のまとめ方を変えて再推定</Text>
            )}
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

// ── GroupingPresetChips ───────────────────────────────────────────────────────

function GroupingPresetChips({
  selected,
  onChange,
}: {
  selected: GroupingPreset;
  onChange: (p: GroupingPreset) => void;
}) {
  const presets: GroupingPreset[] = ['compact', 'standard', 'relaxed'];
  return (
    <View style={presetStyles.container}>
      <Text style={presetStyles.label}>写真のまとめ方</Text>
      <View style={presetStyles.chipRow}>
        {presets.map((p) => (
          <TouchableOpacity
            key={p}
            style={[presetStyles.chip, selected === p && presetStyles.chipSelected]}
            onPress={() => onChange(p)}
            activeOpacity={0.7}
          >
            <Text style={[presetStyles.chipText, selected === p && presetStyles.chipTextSelected]}>
              {PRESET_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const presetStyles = StyleSheet.create({
  container: {
    marginBottom: 10,
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.mapAccent,
    backgroundColor: colors.mapAccentLight,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.mapAccent,
    fontWeight: '600',
  },
});

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionHeaderDivider: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  descText: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  cardCenter: {
    alignItems: 'center',
    gap: 10,
  },
  // idle state
  idleEmoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.5,
  },
  idleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  idleDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  // fetching state
  fetchingText: {
    fontSize: 14,
    color: colors.mapAccent,
  },
  // failed state
  failedEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  failedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  failedDetail: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    marginTop: 8,
  },
  // group cards (completed state)
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupCardLeft: {
    flex: 1,
    gap: 3,
    marginRight: 12,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  groupMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  moreLinkText: {
    fontSize: 13,
    color: colors.mapAccent,
    fontWeight: '500',
  },
  // buttons
  primaryButton: {
    backgroundColor: colors.mapAccent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 160,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  outlineButtonSmall: {
    paddingVertical: 10,
    marginTop: 4,
  },
  outlineButtonDisabled: {
    opacity: 0.5,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mapAccent,
  },
});
