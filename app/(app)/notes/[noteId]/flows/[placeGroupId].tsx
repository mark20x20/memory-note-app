// Phase 12.5G-4: フロー閲覧画面
// Route: /(app)/notes/[noteId]/flows/[placeGroupId]
//
// 1つのフローを見返すためのプレビュー画面。
// - 写真サムネイル、時刻、場所名、カテゴリ、一言メモを表示
// - 前のフロー / 次のフローへのナビゲーション
// - 地図上の位置を小さく表示
// - 候補地図・候補一覧・手動入力は出さない
// - owner/editor: 「編集」ボタンで places/[placeGroupId] へ遷移
// - viewer: 閲覧のみ

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
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

function getThumbnailURLs(group: PlaceGroupDoc): string[] {
  if (group.photoPreviewURLs && group.photoPreviewURLs.length > 0) {
    return group.photoPreviewURLs.slice(0, 3);
  }
  if (group.coverPhotoURL) return [group.coverPhotoURL];
  return [];
}

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function FlowPreviewScreen() {
  const { noteId, placeGroupId } = useLocalSearchParams<{
    noteId: string;
    placeGroupId: string;
  }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note } = useNoteDetail(noteId ?? null);
  const [allGroups, setAllGroups] = useState<PlaceGroupDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  const userCanEdit = uid && note ? canEdit(note, uid) : false;

  useEffect(() => {
    if (!noteId) return;
    unsubRef.current = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (groups) => {
        setAllGroups(groups);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubRef.current?.();
  }, [noteId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="フロー詳細" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mapAccent} />
        </View>
      </SafeAreaView>
    );
  }

  const currentIdx = allGroups.findIndex((g) => g.id === placeGroupId);
  const group = currentIdx >= 0 ? allGroups[currentIdx] : null;
  const prevGroup = currentIdx > 0 ? allGroups[currentIdx - 1] : null;
  const nextGroup = currentIdx < allGroups.length - 1 ? allGroups[currentIdx + 1] : null;

  if (!group) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="フロー詳細" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorText}>フローが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeStr = formatStartTime(group);
  const thumbURLs = getThumbnailURLs(group);
  const totalFlows = allGroups.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title={`#${currentIdx + 1} / ${totalFlows}`}
        onBack={() => router.back()}
        rightElement={
          userCanEdit ? (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/notes/${noteId}/places/${placeGroupId}`)}
              hitSlop={8}
            >
              <Text style={styles.editButtonText}>編集</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── フロー情報ヘッダー ── */}
        <View style={styles.headerCard}>
          {timeStr ? (
            <Text style={styles.flowTime}>{timeStr}</Text>
          ) : null}
          <Text style={styles.flowLabel}>{group.label}</Text>
          <Text style={styles.flowCategory}>{getCategoryLabel(group.category)}</Text>

          {/* 写真枚数 */}
          {group.photoCount > 0 ? (
            <Text style={styles.flowPhotoCount}>写真 {group.photoCount}枚</Text>
          ) : null}
        </View>

        {/* ── 写真サムネイル ── */}
        {thumbURLs.length > 0 ? (
          <View style={styles.thumbSection}>
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
          </View>
        ) : null}

        {/* ── 一言メモ ── */}
        {group.eventMemo ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>一言メモ</Text>
            <View style={styles.memoCard}>
              <Text style={styles.memoText}>{group.eventMemo}</Text>
            </View>
          </View>
        ) : null}

        {/* ── 地図上の位置 ── */}
        {group.latitude != null && group.longitude != null ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>場所</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: group.latitude,
                  longitude: group.longitude,
                  latitudeDelta: 0.006,
                  longitudeDelta: 0.006,
                }}
                showsUserLocation={false}
                showsCompass={false}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: group.latitude, longitude: group.longitude }}
                  title={group.label}
                  pinColor={colors.mapAccent}
                />
              </MapView>
            </View>
            <Text style={styles.placeDesc}>
              {group.label}
              {group.userConfirmed ? '（確認済み）' : ''}
            </Text>
          </View>
        ) : null}

        {/* ── 前後フロー ナビゲーション ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>前後のフロー</Text>
          <View style={styles.navRow}>
            {prevGroup ? (
              <TouchableOpacity
                style={styles.navCard}
                onPress={() =>
                  router.replace(`/(app)/notes/${noteId}/flows/${prevGroup.id}`)
                }
                activeOpacity={0.7}
              >
                <Text style={styles.navArrow}>‹</Text>
                <View style={styles.navInfo}>
                  <Text style={styles.navHint}>前のフロー</Text>
                  <Text style={styles.navLabel} numberOfLines={1}>
                    {formatStartTime(prevGroup)
                      ? `${formatStartTime(prevGroup)} `
                      : ''}
                    {prevGroup.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.navCard, styles.navCardDisabled]}>
                <Text style={[styles.navArrow, styles.navArrowDisabled]}>‹</Text>
                <Text style={styles.navDisabledText}>最初のフロー</Text>
              </View>
            )}

            {nextGroup ? (
              <TouchableOpacity
                style={[styles.navCard, styles.navCardRight]}
                onPress={() =>
                  router.replace(`/(app)/notes/${noteId}/flows/${nextGroup.id}`)
                }
                activeOpacity={0.7}
              >
                <View style={styles.navInfo}>
                  <Text style={[styles.navHint, styles.navHintRight]}>次のフロー</Text>
                  <Text style={[styles.navLabel, styles.navLabelRight]} numberOfLines={1}>
                    {formatStartTime(nextGroup)
                      ? `${formatStartTime(nextGroup)} `
                      : ''}
                    {nextGroup.label}
                  </Text>
                </View>
                <Text style={styles.navArrow}>›</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.navCard, styles.navCardRight, styles.navCardDisabled]}>
                <Text style={styles.navDisabledText}>最後のフロー</Text>
                <Text style={[styles.navArrow, styles.navArrowDisabled]}>›</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── 編集ボタン（owner/editor のみ） ── */}
        {userCanEdit ? (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.editFullButton}
              onPress={() => router.push(`/(app)/notes/${noteId}/places/${placeGroupId}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.editFullButtonText}>場所・メモを編集</Text>
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
  errorEmoji: {
    fontSize: 40,
    opacity: 0.5,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scroll: {
    paddingBottom: 48,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  // ヘッダーカード
  headerCard: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
    gap: 4,
  },
  flowTime: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  flowLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  flowCategory: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  flowPhotoCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  // 写真サムネイル
  thumbSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  // セクション共通
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  // 一言メモ
  memoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  memoText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  // 地図
  mapContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    height: 160,
    marginBottom: 8,
  },
  map: {
    flex: 1,
  },
  placeDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  // 前後ナビゲーション
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  navCardRight: {
    justifyContent: 'flex-end',
  },
  navCardDisabled: {
    backgroundColor: colors.surfaceIvory,
    borderColor: colors.border,
  },
  navArrow: {
    fontSize: 22,
    color: colors.mapAccent,
    fontWeight: '600',
    lineHeight: 26,
  },
  navArrowDisabled: {
    color: colors.textTertiary,
  },
  navInfo: {
    flex: 1,
    gap: 2,
  },
  navHint: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  navHintRight: {
    textAlign: 'right',
  },
  navLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  navLabelRight: {
    textAlign: 'right',
  },
  navDisabledText: {
    fontSize: 12,
    color: colors.textTertiary,
    flex: 1,
  },
  // 編集ボタン
  editFullButton: {
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editFullButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.mapAccent,
  },
});
