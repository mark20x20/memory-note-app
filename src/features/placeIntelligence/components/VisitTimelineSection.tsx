// Phase 12.5G-1: この日の流れ — 訪問イベントタイムラインコンポーネント
//
// ノート詳細画面の「訪れた場所セクション」の下に挿入する。
// PlaceGroup を時系列順（sortOrder / startAt）で表示し、
// 時刻・場所名・写真枚数・確認状態を一覧できる。

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
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

  // PlaceGroup がなければ非表示
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

              {/* 右: 時刻 + 場所名 + メタ */}
              <View style={styles.timelineRight}>
                {timeStr ? (
                  <Text style={styles.timelineTime}>{timeStr}</Text>
                ) : null}
                <Text style={styles.timelineLabel} numberOfLines={1}>
                  {group.label}
                </Text>
                <View style={styles.timelineMetaRow}>
                  <Text style={styles.timelineMeta}>
                    {getCategoryLabel(group.category)}
                    {group.photoCount > 0 ? ` · 写真${group.photoCount}枚` : ''}
                  </Text>
                  {!isConfirmed ? (
                    <View style={styles.unconfirmedBadge}>
                      <Text style={styles.unconfirmedBadgeText}>要確認</Text>
                    </View>
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
    justifyContent: 'center',
    gap: 2,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  timelineMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unconfirmedBadge: {
    backgroundColor: colors.warning + '22',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unconfirmedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
  },
});
