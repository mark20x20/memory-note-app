// Phase 12.5G-1: この日の流れ — 訪問イベントタイムラインコンポーネント
// Phase 12.5G-2: 写真サムネイル表示・「場所を確認・編集」ボタン追加

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import type { PlaceGroupDoc } from '@/features/map/types';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';

// ── 型 ─────────────────────────────────────────────────────────────────────────

type Props = {
  noteId: string;
  canEdit: boolean;
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

export function VisitTimelineSection({ noteId, canEdit }: Props) {
  const [groups, setGroups] = useState<PlaceGroupDoc[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsubRef.current = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (next) => setGroups(next),
      () => {}
    );
    return () => unsubRef.current?.();
  }, [noteId]);

  if (groups.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>この日の流れ</Text>
      <View style={styles.timelineList}>
        {groups.map((group, idx) => {
          const isLast = idx === groups.length - 1;
          const timeStr = formatStartTime(group);
          const isConfirmed = group.userConfirmed;
          const canNavigate = canEdit || isConfirmed;
          const thumbURLs = getThumbnailURLs(group);

          return (
            <TouchableOpacity
              key={group.id}
              style={styles.timelineItem}
              onPress={() => {
                if (!canNavigate) return;
                router.push(`/(app)/notes/${noteId}/places/${group.id}`);
              }}
              activeOpacity={canNavigate ? 0.7 : 1}
            >
              {/* 左: 番号 + 縦線 */}
              <View style={styles.timelineLeft}>
                <View style={[styles.timelinePin, isConfirmed && styles.timelinePinConfirmed]}>
                  <Text style={[styles.timelinePinText, isConfirmed && styles.timelinePinTextConfirmed]}>
                    #{idx + 1}
                  </Text>
                </View>
                {!isLast ? <View style={styles.timelineLine} /> : null}
              </View>

              {/* 右: 時刻・場所名・写真サムネイル・メタ */}
              <View style={styles.timelineRight}>
                {timeStr ? (
                  <Text style={styles.timelineTime}>{timeStr}</Text>
                ) : null}
                <Text style={styles.timelineLabel} numberOfLines={1}>
                  {group.label}
                </Text>
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

                {/* バッジ + 確認ボタン */}
                <View style={styles.bottomRow}>
                  {!isConfirmed ? (
                    <View style={styles.unconfirmedBadge}>
                      <Text style={styles.unconfirmedBadgeText}>要確認</Text>
                    </View>
                  ) : (
                    <View style={styles.confirmedBadge}>
                      <Text style={styles.confirmedBadgeText}>確認済み</Text>
                    </View>
                  )}
                  {canNavigate ? (
                    <Text style={styles.actionLink}>
                      {canEdit
                        ? isConfirmed ? '場所を変更 →' : '場所を確認・編集 →'
                        : '詳細を見る →'}
                    </Text>
                  ) : null}
                </View>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
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
  timelineLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
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
  // バッジ + アクション行
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  unconfirmedBadge: {
    backgroundColor: colors.warning + '22',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unconfirmedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
  },
  confirmedBadge: {
    backgroundColor: colors.success + '22',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  confirmedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  actionLink: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mapAccent,
  },
});
