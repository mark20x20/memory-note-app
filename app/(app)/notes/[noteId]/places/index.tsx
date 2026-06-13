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
import { canEdit } from '@/features/memoryNotes/utils/permissions';
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

  if (noteLoading || groupsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="この日の流れ" onBack={() => router.back()} />
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
        title="この日の流れ"
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

        {/* ── 説明 + フロー分割設定リンク（owner/editor のみ） ── */}
        <View style={styles.enrichSection}>
          <Text style={styles.enrichDesc}>
            各フローの場所を確認・編集できます。
          </Text>
          {userCanEdit ? (
            <TouchableOpacity
              style={styles.flowSettingsLink}
              onPress={() => router.push(`/(app)/notes/${noteId}/flow-settings`)}
            >
              <Text style={styles.flowSettingsLinkText}>フロー分割設定</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── PlaceGroup 一覧 ── */}
        <View style={styles.section}>
          {groups.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyTitle}>まだフローが作成されていません</Text>
              <Text style={styles.emptyDesc}>
                {userCanEdit
                  ? 'ノート詳細の「この日の流れ」からフローを作成してください。'
                  : '位置情報のある写真が追加されると、フローが作成されます。'}
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
                    if (!userCanEdit && !isConfirmed) return;
                    // Phase 12.5G-4: 編集画面（場所候補・メモ修正）へ遷移
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
    paddingTop: 16,
    gap: 8,
  },
  enrichDesc: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  flowSettingsLink: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.mapAccent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  flowSettingsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
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
