// Phase 12.5E: 訪れた場所一覧画面
// Phase 12.5E-2: UX改善
//   - PlaceGroup カードにカテゴリタグを表示
//   - 「候補を確認・変更」明示ボタンを追加
//   - 「手動で場所を追加」ボタンを削除（placeGroupId なしでは保存不可のため）
// Route: /(app)/notes/[noteId]/places
//
// owner/editor: 再推定ボタン・候補確認への遷移が可能
// viewer: 確定済み場所の閲覧のみ（未確定候補の操作不可）

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
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
import { enrichNotePlacesCallable } from '@/features/placeIntelligence/api/placeFunctionsClient';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import type { PlaceGroupDoc } from '@/features/map/types';

// ── ヘルパー ──────────────────────────────────────────────────────────────────

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
      await enrichNotePlacesCallable({ noteId });
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
      <ScreenHeader title="訪れた場所" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 再推定ボタン（owner/editor のみ） ── */}
        {userCanEdit ? (
          <View style={styles.enrichSection}>
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
            groups.map((group) => {
              const badge = getStatusBadge(group);
              const isConfirmed = group.userConfirmed;
              const categoryLabel = getCategoryLabel(group.category);

              return (
                <View key={group.id} style={styles.groupCard}>
                  {/* ── ヘッダー行: ラベル + 確認済みバッジ ── */}
                  <View style={styles.groupCardHeader}>
                    <Text style={styles.groupLabel} numberOfLines={1}>
                      {group.label}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.color + '22' }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* ── カテゴリタグ + 写真枚数 ── */}
                  <View style={styles.groupTagRow}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{categoryLabel}</Text>
                    </View>
                    {group.photoCount > 0 ? (
                      <Text style={styles.photoCountText}>写真 {group.photoCount}枚</Text>
                    ) : null}
                  </View>

                  {/* ── 候補を確認・変更ボタン（owner/editor のみ） ── */}
                  {userCanEdit ? (
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() =>
                        router.push(`/(app)/notes/${noteId}/places/${group.id}`)
                      }
                    >
                      <Text style={styles.confirmButtonText}>
                        {isConfirmed ? '場所を確認・変更' : '候補を確認・変更'}
                      </Text>
                    </TouchableOpacity>
                  ) : isConfirmed ? (
                    // viewer でも確認済み場所は詳細を見られる
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() =>
                        router.push(`/(app)/notes/${noteId}/places/${group.id}`)
                      }
                    >
                      <Text style={styles.viewButtonText}>詳細を見る</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

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
  // 再推定セクション
  enrichSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
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
    gap: 10,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
  groupTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: colors.mapAccentLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  photoCountText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  // 「候補を確認・変更」ボタン（owner/editor）
  confirmButton: {
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  // 「詳細を見る」ボタン（viewer / 確認済み）
  viewButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
