// Phase 12.5F-1: Map screen — 訪れた場所を番号付きピンで地図表示
// Route: /(app)/notes/[noteId]/map
//
// PlaceGroup を地図に表示する。
// - latitude/longitude がある PlaceGroup を対象
// - 番号付き Marker（#1, #2, ...）
// - 下部に PlaceGroup 横スクロールカード
// - 確認済み / 要確認 バッジ
// - 簡易旅順プレビュー
// - 空状態
// - owner/editor: 候補確認・変更可 / viewer: 確認済みのみ詳細遷移可

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, type Region } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import type { PlaceGroupDoc } from '@/features/map/types';

// ── 定数 ────────────────────────────────────────────────────────────────────

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAP_HEIGHT = SCREEN_HEIGHT * 0.52;
const DEFAULT_DELTA = 0.01;

// ── ヘルパー ─────────────────────────────────────────────────────────────────

/**
 * PlaceGroupDoc の startAt（Firestore Timestamp）を "HH:MM" 形式に変換する。
 * startAt がない場合は null を返す。
 */
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

/** latitude / longitude がある PlaceGroup のみを返す */
function getGroupsWithLocation(groups: PlaceGroupDoc[]): PlaceGroupDoc[] {
  return groups.filter(
    (g) => g.latitude != null && g.longitude != null && g.latitude !== 0 && g.longitude !== 0
  );
}

/** 複数地点を包含する Region を計算する */
function calcRegionForGroups(groups: PlaceGroupDoc[]): Region {
  if (groups.length === 0) {
    return { latitude: 35.6812, longitude: 139.7671, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }
  if (groups.length === 1) {
    return {
      latitude: groups[0].latitude,
      longitude: groups[0].longitude,
      latitudeDelta: DEFAULT_DELTA,
      longitudeDelta: DEFAULT_DELTA,
    };
  }
  const lats = groups.map((g) => g.latitude);
  const lngs = groups.map((g) => g.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.3, DEFAULT_DELTA / 2);
  const padLng = Math.max((maxLng - minLng) * 0.3, DEFAULT_DELTA / 2);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: maxLat - minLat + padLat,
    longitudeDelta: maxLng - minLng + padLng,
  };
}

// ── カスタムマーカー ──────────────────────────────────────────────────────────

type NumberedMarkerProps = {
  number: number;
  confirmed: boolean;
};

function NumberedMarkerView({ number, confirmed }: NumberedMarkerProps) {
  return (
    <View style={markerStyles.wrapper}>
      <View
        style={[
          markerStyles.badge,
          confirmed ? markerStyles.badgeConfirmed : markerStyles.badgeUnconfirmed,
        ]}
      >
        <Text
          style={[
            markerStyles.badgeText,
            confirmed ? markerStyles.badgeTextConfirmed : markerStyles.badgeTextUnconfirmed,
          ]}
        >
          #{number}
        </Text>
      </View>
      <View
        style={[
          markerStyles.stem,
          confirmed ? markerStyles.stemConfirmed : markerStyles.stemUnconfirmed,
        ]}
      />
    </View>
  );
}

const BADGE_W = 36;
const BADGE_H = 26;
const STEM_H = 6;

const markerStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  badge: {
    width: BADGE_W,
    height: BADGE_H,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeConfirmed: {
    backgroundColor: colors.mapAccent,
  },
  badgeUnconfirmed: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextConfirmed: {
    color: colors.white,
  },
  badgeTextUnconfirmed: {
    color: colors.mapAccent,
  },
  stem: {
    width: 0,
    height: 0,
    borderLeftWidth: STEM_H / 2,
    borderRightWidth: STEM_H / 2,
    borderTopWidth: STEM_H,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  stemConfirmed: {
    borderTopColor: colors.mapAccent,
  },
  stemUnconfirmed: {
    borderTopColor: colors.mapAccent,
  },
});

// ── メイン画面 ────────────────────────────────────────────────────────────────

export default function NoteMapScreen() {
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

  const groupsWithLocation = getGroupsWithLocation(groups);
  const initialRegion = calcRegionForGroups(groupsWithLocation);

  if (noteLoading || groupsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="地図" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mapAccent} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // PlaceGroup 自体がまだない
  if (groups.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="地図" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={styles.emptyTitle}>訪れた場所がまだありません</Text>
          <Text style={styles.emptyDesc}>
            写真から場所を推定すると、地図に表示されます。
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // PlaceGroup はあるが全件位置情報なし
  if (groupsWithLocation.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="地図" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyTitle}>位置情報のある場所がありません</Text>
          <Text style={styles.emptyDesc}>
            位置情報のある写真を追加して場所を推定すると、地図に表示されます。
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="地図" onBack={() => router.back()} />

      {/* ── Map ── */}
      <MapView
        style={{ height: MAP_HEIGHT }}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsCompass
        showsScale
      >
        {groupsWithLocation.map((group, idx) => (
          <Marker
            key={group.id}
            coordinate={{ latitude: group.latitude, longitude: group.longitude }}
            title={`#${idx + 1} ${group.label}`}
            description={getCategoryLabel(group.category)}
          >
            <NumberedMarkerView number={idx + 1} confirmed={group.userConfirmed} />
          </Marker>
        ))}
      </MapView>

      {/* ── 下部スクロール ── */}
      <ScrollView
        style={styles.bottomSheet}
        contentContainerStyle={styles.bottomSheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 場所カード（横スクロール） ── */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionLabel}>訪れた場所を地図で確認</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {groupsWithLocation.map((group, idx) => {
              const badge = getStatusBadge(group);
              const isConfirmed = group.userConfirmed;
              const canNavigate = userCanEdit || isConfirmed;
              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.placeCard}
                  onPress={() => {
                    if (!canNavigate) return;
                    router.push(`/(app)/notes/${noteId}/places/${group.id}`);
                  }}
                  activeOpacity={canNavigate ? 0.7 : 1}
                >
                  {/* 番号バッジ + 時刻 */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardNumberBadge}>
                      <Text style={styles.cardNumberText}>#{idx + 1}</Text>
                    </View>
                    {formatStartTime(group) ? (
                      <Text style={styles.cardTimeText}>{formatStartTime(group)}</Text>
                    ) : null}
                  </View>
                  {/* 場所名 */}
                  <Text style={styles.cardLabel} numberOfLines={2}>
                    {group.label}
                  </Text>
                  {/* カテゴリタグ */}
                  <View style={styles.cardTagRow}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>
                        {getCategoryLabel(group.category)}
                      </Text>
                    </View>
                  </View>
                  {/* 確認バッジ */}
                  <View style={[styles.statusBadge, { backgroundColor: badge.color + '22' }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                  {/* 写真枚数 */}
                  {group.photoCount > 0 ? (
                    <Text style={styles.cardMeta}>写真 {group.photoCount}枚</Text>
                  ) : null}
                  {/* 操作テキスト */}
                  {canNavigate ? (
                    <Text style={styles.cardAction}>
                      {userCanEdit
                        ? isConfirmed ? '場所を確認・変更 →' : '候補を確認・変更 →'
                        : '詳細を見る →'}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 旅順プレビュー ── */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionLabel}>この日の流れ</Text>
          <View style={styles.timelineList}>
            {groupsWithLocation.map((group, idx) => {
              const badge = getStatusBadge(group);
              const isLast = idx === groupsWithLocation.length - 1;
              const timeStr = formatStartTime(group);
              return (
                <View key={group.id} style={styles.timelineItem}>
                  {/* 左: 番号 + 縦線 */}
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineNumberBadge}>
                      <Text style={styles.timelineNumber}>#{idx + 1}</Text>
                    </View>
                    {!isLast ? <View style={styles.timelineLine} /> : null}
                  </View>
                  {/* 右: 情報 */}
                  <View style={styles.timelineRight}>
                    {timeStr ? (
                      <Text style={styles.timelineTime}>{timeStr}</Text>
                    ) : null}
                    <Text style={styles.timelineLabel} numberOfLines={1}>
                      {group.label}
                    </Text>
                    <View style={styles.timelineMetaRow}>
                      <Text style={styles.timelineCategory}>
                        {getCategoryLabel(group.category)}
                        {group.photoCount > 0 ? ` · 写真${group.photoCount}枚` : ''}
                      </Text>
                      <View style={[styles.timelineBadge, { backgroundColor: badge.color + '22' }]}>
                        <Text style={[styles.timelineBadgeText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 位置情報なし場所の案内 */}
        {groups.length > groupsWithLocation.length ? (
          <View style={styles.noLocationNote}>
            <Text style={styles.noLocationText}>
              ＊ 位置情報がない場所 {groups.length - groupsWithLocation.length}件は地図に表示されていません。
            </Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
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
    gap: 10,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  emptyEmoji: {
    fontSize: 48,
    opacity: 0.5,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },

  // Bottom scroll area
  bottomSheet: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bottomSheetContent: {
    paddingTop: 4,
  },

  // Section
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },

  // Place cards (horizontal scroll)
  cardsSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cardsRow: {
    paddingRight: 8,
    gap: 10,
  },
  placeCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardNumberBadge: {
    backgroundColor: colors.mapAccent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  cardTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  cardTagRow: {
    flexDirection: 'row',
  },
  categoryTag: {
    backgroundColor: colors.mapAccentLight,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  categoryTagText: {
    fontSize: 11,
    color: colors.mapAccent,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  cardAction: {
    fontSize: 12,
    color: colors.mapAccent,
    fontWeight: '500',
    marginTop: 2,
  },

  // Timeline
  timelineSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timelineNote: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 12,
    lineHeight: 16,
  },
  timelineList: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
  },
  timelineNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.mapAccentLight,
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mapAccent,
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
  },
  timelineCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timelineBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  timelineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // No-location note
  noLocationNote: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 10,
    padding: 12,
  },
  noLocationText: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});
