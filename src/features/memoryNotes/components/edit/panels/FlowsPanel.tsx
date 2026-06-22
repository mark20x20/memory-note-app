// UI-2: FlowsPanel — Edit画面の流れタブ
// UI-3A: usePlaceGroups から groups を props で受け取るように変更（二重購読解消）

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import {
  enrichNotePlacesCallable,
  GROUPING_PRESETS,
} from '@/features/placeIntelligence/api/placeFunctionsClient';
import type { PlaceGroupDoc } from '@/features/map/types';

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
    restaurant: 'レストラン', cafe: 'カフェ', tourist_attraction: '観光地',
    station: '駅', hotel: 'ホテル', shopping: 'ショッピング',
    park: '公園', museum: '美術館・博物館', area: 'エリア', unknown: 'その他',
  };
  return map[category] ?? category;
}

// ── コンポーネント ────────────────────────────────────────────────────────────

type FlowsPanelProps = {
  noteId: string;
  groups: PlaceGroupDoc[];
  isLoadingGroups: boolean;
  isBusy: boolean;
};

export function FlowsPanel({ noteId, groups, isLoadingGroups, isBusy }: FlowsPanelProps) {
  async function handleRecreateFlow() {
    Alert.alert(
      'この日の流れを再作成',
      '既存のフロー分割がリセットされます。標準設定（90分間隔）で再作成しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '再作成',
          onPress: async () => {
            try {
              await enrichNotePlacesCallable({
                noteId,
                forceRefresh: true,
                grouping: GROUPING_PRESETS['standard'],
              });
              Alert.alert('完了', 'この日の流れを再作成しました。');
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : '再作成に失敗しました';
              Alert.alert('エラー', msg);
            }
          },
        },
      ]
    );
  }

  if (isLoadingGroups) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.mapAccent} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🗓️</Text>
          <Text style={styles.emptyTitle}>フローがありません</Text>
          <Text style={styles.emptyDesc}>
            写真をアップロードしてから「この日の流れを再作成」してください。
          </Text>
        </View>
      ) : (
        groups.map((group, idx) => {
          const timeStr = formatStartTime(group);
          const thumbURLs = group.photoPreviewURLs?.slice(0, 3) ??
            (group.coverPhotoURL ? [group.coverPhotoURL] : []);

          return (
            <View key={group.id} style={styles.flowCard}>
              <View style={styles.flowHeader}>
                <View style={styles.flowNumBadge}>
                  <Text style={styles.flowNum}>{idx + 1}</Text>
                </View>
                {timeStr ? <Text style={styles.flowTime}>{timeStr}</Text> : null}
                <View style={[
                  styles.confirmedBadge,
                  group.userConfirmed && styles.confirmedBadgeActive,
                ]}>
                  <Text style={[
                    styles.confirmedBadgeText,
                    group.userConfirmed && styles.confirmedBadgeTextActive,
                  ]}>
                    {group.userConfirmed ? '確認済み' : '未確認'}
                  </Text>
                </View>
              </View>

              <Text style={styles.flowLabel}>{group.label}</Text>
              <Text style={styles.flowCategory}>{getCategoryLabel(group.category)}</Text>

              {thumbURLs.length > 0 ? (
                <View style={styles.thumbRow}>
                  {thumbURLs.map((url, ti) => (
                    <Image key={ti} source={{ uri: url }} style={styles.thumb} resizeMode="cover" />
                  ))}
                  {group.photoCount > 3 ? (
                    <View style={styles.thumbMore}>
                      <Text style={styles.thumbMoreText}>+{group.photoCount - 3}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {group.eventMemo ? (
                <Text style={styles.eventMemo} numberOfLines={2}>{group.eventMemo}</Text>
              ) : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/(app)/notes/${noteId}/flows/${group.id}` as any)}
                >
                  <Text style={styles.actionButtonText}>詳細を見る</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonAccent]}
                  onPress={() => router.push(`/(app)/notes/${noteId}/places/${group.id}` as any)}
                >
                  <Text style={[styles.actionButtonText, styles.actionButtonTextAccent]}>場所を確認</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <View style={styles.recreateSection}>
        <Text style={styles.recreateTitle}>フロー管理</Text>
        <View style={styles.recreateButtonRow}>
          <TouchableOpacity
            style={styles.recreateButton}
            onPress={() => router.push(`/(app)/notes/${noteId}/flow-settings` as any)}
            disabled={isBusy}
          >
            <Text style={styles.recreateButtonText}>フロー分割設定</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.recreateButton}
            onPress={handleRecreateFlow}
            disabled={isBusy}
          >
            <Text style={styles.recreateButtonText}>この日の流れを再作成</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  centered: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  loadingText: { fontSize: 13, color: colors.textTertiary },
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 8 },
  emptyEmoji: { fontSize: 36, opacity: 0.35, marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  emptyDesc: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', lineHeight: 20 },
  flowCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6,
  },
  flowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flowNumBadge: {
    width: 24, height: 24, borderRadius: borderRadius.full,
    backgroundColor: colors.mapAccent, alignItems: 'center', justifyContent: 'center',
  },
  flowNum: { fontSize: 11, fontWeight: '700', color: colors.textInverse },
  flowTime: { fontSize: 13, fontWeight: '600', color: colors.mapAccent, flex: 1 },
  confirmedBadge: {
    borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: colors.surfaceIvory, borderWidth: 1, borderColor: colors.border,
  },
  confirmedBadgeActive: { backgroundColor: '#E6F4F0', borderColor: colors.success },
  confirmedBadgeText: { fontSize: 10, fontWeight: '600', color: colors.textTertiary },
  confirmedBadgeTextActive: { color: colors.success },
  flowLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, letterSpacing: -0.2 },
  flowCategory: { fontSize: 12, color: colors.textSecondary },
  thumbRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  thumb: { width: 52, height: 52, borderRadius: borderRadius.sm, backgroundColor: colors.border },
  thumbMore: {
    width: 52, height: 52, borderRadius: borderRadius.sm,
    backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center',
  },
  thumbMoreText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  eventMemo: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionButton: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.md, paddingVertical: 7, alignItems: 'center',
  },
  actionButtonAccent: { borderColor: colors.mapAccent },
  actionButtonText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  actionButtonTextAccent: { color: colors.mapAccent },
  recreateSection: {
    backgroundColor: colors.surfaceIvory, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10, marginTop: 4,
  },
  recreateTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  recreateButtonRow: { flexDirection: 'row', gap: 8 },
  recreateButton: {
    flex: 1, borderWidth: 1.5, borderColor: colors.mapAccent,
    borderRadius: borderRadius.md, paddingVertical: 9, alignItems: 'center',
  },
  recreateButtonText: { fontSize: 12, fontWeight: '600', color: colors.mapAccent },
});
