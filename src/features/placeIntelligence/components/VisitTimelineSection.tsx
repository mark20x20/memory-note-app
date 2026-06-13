// Phase 12.5G-1: この日の流れ — 訪問イベントタイムラインコンポーネント
// Phase 12.5G-2: 写真サムネイル表示
// Phase 12.5G-3: 要確認バッジ非表示・カードタップ中心・一言メモ表示
//               enrichNotePlaces を呼ぶ「作成」ボタン（グループ0件時）

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import type { PlaceGroupDoc } from '@/features/map/types';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import {
  enrichNotePlacesCallable,
  GROUPING_PRESETS,
} from '@/features/placeIntelligence/api/placeFunctionsClient';

// ── 型 ─────────────────────────────────────────────────────────────────────────

type Props = {
  noteId: string;
  canEdit: boolean;
  /** NoteDoc.placeEnrichmentStatus（idle 時に「作成」ボタンを出すため） */
  enrichmentStatus?: string | null;
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

/** サムネイルに使う URL を最大3枚返す（photoPreviewURLs → coverPhotoURL の順） */
function getThumbnailURLs(group: PlaceGroupDoc): string[] {
  if (group.photoPreviewURLs && group.photoPreviewURLs.length > 0) {
    return group.photoPreviewURLs.slice(0, 3);
  }
  if (group.coverPhotoURL) return [group.coverPhotoURL];
  return [];
}

// ── コンポーネント ────────────────────────────────────────────────────────────

export function VisitTimelineSection({ noteId, canEdit, enrichmentStatus }: Props) {
  const [groups, setGroups] = useState<PlaceGroupDoc[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsubRef.current = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (next) => setGroups(next),
      () => {}
    );
    return () => unsubRef.current?.();
  }, [noteId]);

  async function handleCreateFlow() {
    setEnriching(true);
    setEnrichError(null);
    try {
      await enrichNotePlacesCallable({
        noteId,
        grouping: GROUPING_PRESETS['standard'],
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

  // fetching 中
  if (enrichmentStatus === 'fetching') {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>この日の流れ</Text>
        </View>
        <View style={[styles.emptyCard, styles.emptyCardCenter]}>
          <ActivityIndicator size="small" color={colors.mapAccent} />
          <Text style={styles.fetchingText}>フローを作成中...</Text>
        </View>
      </View>
    );
  }

  // グループなし
  if (groups.length === 0) {
    if (!canEdit) return null;
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>この日の流れ</Text>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={styles.emptyTitle}>写真からこの日の流れを作成</Text>
          <Text style={styles.emptyDesc}>
            GPS 付き写真の撮影時刻・位置情報から、訪れた場所をまとめます。
          </Text>
          <TouchableOpacity
            style={[styles.createButton, enriching && styles.createButtonDisabled]}
            onPress={handleCreateFlow}
            disabled={enriching}
          >
            {enriching ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.createButtonText}>この日の流れを作成</Text>
            )}
          </TouchableOpacity>
          {enrichError ? (
            <Text style={styles.errorText}>{enrichError}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>この日の流れ</Text>
        {canEdit ? (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/notes/${noteId}/flow-settings`)}
            hitSlop={8}
          >
            <Text style={styles.settingsLink}>分割設定</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.timelineList}>
        {groups.map((group, idx) => {
          const isLast = idx === groups.length - 1;
          const timeStr = formatStartTime(group);
          const thumbURLs = getThumbnailURLs(group);

          return (
            <TouchableOpacity
              key={group.id}
              style={styles.timelineItem}
              onPress={() => router.push(`/(app)/notes/${noteId}/places/${group.id}`)}
              activeOpacity={0.7}
            >
              {/* 左: 番号 + 縦線 */}
              <View style={styles.timelineLeft}>
                <View style={[styles.timelinePin, group.userConfirmed && styles.timelinePinConfirmed]}>
                  <Text style={[styles.timelinePinText, group.userConfirmed && styles.timelinePinTextConfirmed]}>
                    #{idx + 1}
                  </Text>
                </View>
                {!isLast ? <View style={styles.timelineLine} /> : null}
              </View>

              {/* 右: 時刻・場所名・写真サムネイル・メタ・一言メモ */}
              <View style={styles.timelineRight}>
                {timeStr ? (
                  <Text style={styles.timelineTime}>{timeStr}</Text>
                ) : null}
                <View style={styles.labelRow}>
                  <Text style={styles.timelineLabel} numberOfLines={1}>
                    {group.label}
                  </Text>
                  {/* 右端に小さな編集アイコン代わりの「›」 */}
                  <Text style={styles.chevron}>›</Text>
                </View>
                <Text style={styles.timelineMeta}>
                  {getCategoryLabel(group.category)}
                  {group.photoCount > 0 ? ` · 写真${group.photoCount}枚` : ''}
                </Text>

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

                {/* 一言メモ */}
                {group.eventMemo ? (
                  <Text style={styles.eventMemo} numberOfLines={2}>
                    {group.eventMemo}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeaderRow: {
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
  settingsLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  // タイムライン本体
  timelineList: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  timelineLeft: {
    width: 38,
    alignItems: 'center',
  },
  timelinePin: {
    width: 30,
    height: 22,
    borderRadius: 7,
    backgroundColor: colors.mapAccentLight,
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelinePinConfirmed: {
    backgroundColor: colors.mapAccent,
    borderColor: colors.mapAccent,
  },
  timelinePinText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mapAccent,
  },
  timelinePinTextConfirmed: {
    color: colors.white,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 10,
    gap: 3,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 18,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  timelineMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // 写真サムネイル行
  thumbRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  // 一言メモ
  eventMemo: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  // 空状態カード
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyCardCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 28,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 15,
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
  fetchingText: {
    fontSize: 14,
    color: colors.mapAccent,
    marginLeft: 8,
  },
  createButton: {
    backgroundColor: colors.mapAccent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
  },
});
