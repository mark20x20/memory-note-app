// UI-2: PlacesPanel — Edit画面の場所タブ
// 表示: place_groups 一覧 (選択中場所名, category, confirmed状態, photo count)
// アクション: 候補確認 → places/[placeGroupId], 手動修正 → places/manual

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import type { PlaceGroupDoc } from '@/features/map/types';

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

type PlacesPanelProps = {
  noteId: string;
  userCanEdit: boolean;
};

export function PlacesPanel({ noteId, userCanEdit }: PlacesPanelProps) {
  const [groups, setGroups] = useState<PlaceGroupDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!noteId) return;
    setIsLoading(true);
    const unsub = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (g) => {
        setGroups(g);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );
    return unsub;
  }, [noteId]);

  const confirmedCount = groups.filter((g) => g.userConfirmed).length;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.mapAccent} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📍</Text>
        <Text style={styles.emptyTitle}>場所がありません</Text>
        <Text style={styles.emptyDesc}>
          写真からフローを作成すると、場所が自動で抽出されます。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* サマリー */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{groups.length}</Text>
          <Text style={styles.summaryLabel}>場所合計</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, confirmedCount > 0 && styles.summaryValueConfirmed]}>
            {confirmedCount}
          </Text>
          <Text style={styles.summaryLabel}>確認済み</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, (groups.length - confirmedCount) > 0 && styles.summaryValuePending]}>
            {groups.length - confirmedCount}
          </Text>
          <Text style={styles.summaryLabel}>未確認</Text>
        </View>
      </View>

      {/* 場所カード一覧 */}
      {groups.map((group, idx) => (
        <View
          key={group.id}
          style={[styles.placeCard, group.userConfirmed && styles.placeCardConfirmed]}
        >
          <View style={styles.placeHeader}>
            <View style={styles.placeNumBadge}>
              <Text style={styles.placeNum}>{idx + 1}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              group.userConfirmed ? styles.statusBadgeConfirmed : styles.statusBadgePending,
            ]}>
              <Text style={[
                styles.statusBadgeText,
                group.userConfirmed ? styles.statusBadgeTextConfirmed : styles.statusBadgeTextPending,
              ]}>
                {group.userConfirmed ? '確認済み' : '未確認'}
              </Text>
            </View>
          </View>

          <Text style={styles.placeLabel}>{group.label}</Text>
          <Text style={styles.placeCategory}>{getCategoryLabel(group.category)}</Text>

          {group.photoCount > 0 ? (
            <Text style={styles.placeMeta}>写真 {group.photoCount}枚</Text>
          ) : null}

          {/* アクションボタン (editor/owner のみ) */}
          {userCanEdit ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() =>
                  router.push(`/(app)/notes/${noteId}/places/${group.id}` as any)
                }
              >
                <Text style={styles.actionButtonPrimaryText}>候補確認</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push(
                    `/(app)/notes/${noteId}/places/manual?placeGroupId=${group.id}` as any
                  )
                }
              >
                <Text style={styles.actionButtonText}>手動修正</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 36,
    opacity: 0.35,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryValueConfirmed: {
    color: colors.success,
  },
  summaryValuePending: {
    color: colors.warning,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  // Place card
  placeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  placeCardConfirmed: {
    borderColor: colors.success + '66',
    backgroundColor: '#F0FBF7',
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  placeNumBadge: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mapAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeNum: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  statusBadgeConfirmed: {
    backgroundColor: '#E6F4F0',
    borderColor: colors.success,
  },
  statusBadgePending: {
    backgroundColor: colors.surfaceIvory,
    borderColor: colors.warning,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadgeTextConfirmed: {
    color: colors.success,
  },
  statusBadgeTextPending: {
    color: colors.warning,
  },
  placeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  placeMeta: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 7,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    borderColor: colors.mapAccent,
    backgroundColor: colors.mapAccentLight,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionButtonPrimaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mapAccent,
  },
});
