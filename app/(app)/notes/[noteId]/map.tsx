// Phase 12.5F-1: Map screen — 訪れた場所を番号付きピンで地図表示
// Phase 12.5H-1: Route Plan Mode — ルートモード選択UI
// Phase 12.5H-5: Walking / Driving 実ルート生成・表示
//
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
// - walking / driving ルート生成（Premium仮実装）

import { useCallback, useEffect, useRef, useState } from 'react';
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
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import type {
  PlaceGroupDoc,
  RouteDisplayMode,
  PremiumRouteTravelMode,
  RouteSegmentSummary,
  RouteGenerationStatus,
} from '@/features/map/types';
import {
  getTravelModeLabel,
  getPremiumRouteDescription,
  formatDuration,
  formatDistance,
  getRouteColor,
} from '@/features/map/utils/routeDisplayUtils';
import {
  generateNoteRoutesCallable,
  getNoteRouteSegmentsCallable,
} from '@/features/map/api/routeFunctionsClient';
import type { CallableError } from '@/features/map/api/routeFunctionsClient';

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

  // ── ルート表示モード ──────────────────────────────────────────────────────
  // TODO Phase 12.5H-7: Replace isPremiumUser with real RevenueCat / entitlement check.
  //   This is a development stub only. Must be replaced before production release.
  const isPremiumUser = true;
  const [routeMode, setRouteMode] = useState<RouteDisplayMode>('straight');
  const [premiumTravelMode, setPremiumTravelMode] = useState<PremiumRouteTravelMode>('walking');

  // ── ルート生成状態 ────────────────────────────────────────────────────────
  const [routeSegments, setRouteSegments] = useState<RouteSegmentSummary[]>([]);
  const [routeGenerationStatus, setRouteGenerationStatus] = useState<RouteGenerationStatus>('idle');
  const [routeGenerationError, setRouteGenerationError] = useState<string | null>(null);

  /** プレミアムモードを選択した際の処理 */
  function selectPremiumMode(mode: PremiumRouteTravelMode) {
    setPremiumTravelMode(mode);
    setRouteMode('premium');
    // モード変更時にセグメントをリセット（別モードのデータを見せない）
    setRouteSegments([]);
    setRouteGenerationStatus('idle');
    setRouteGenerationError(null);
  }

  /** ルートセグメントを Firestore から読み込む */
  const loadRouteSegments = useCallback(
    async (nId: string, mode: PremiumRouteTravelMode) => {
      try {
        const result = await getNoteRouteSegmentsCallable({ noteId: nId, travelMode: mode });
        setRouteSegments(result.segments);
        if (result.segments.length > 0) {
          setRouteGenerationStatus('success');
        } else {
          setRouteGenerationStatus('idle');
        }
      } catch (err) {
        console.error('[map] loadRouteSegments error:', err);
        // 読み込み失敗は idle のままにして再生成を促す
        setRouteGenerationStatus('idle');
      }
    },
    []
  );

  /** ルート生成ボタンを押したときの処理 */
  const handleGenerateRoutes = useCallback(async () => {
    if (!noteId) return;
    setRouteGenerationStatus('loading');
    setRouteGenerationError(null);
    try {
      await generateNoteRoutesCallable({ noteId, travelMode: premiumTravelMode });
      await loadRouteSegments(noteId, premiumTravelMode);
    } catch (err) {
      const callErr = err as CallableError;
      setRouteGenerationError(callErr.message ?? 'ルートの生成に失敗しました');
      setRouteGenerationStatus('error');
    }
  }, [noteId, premiumTravelMode, loadRouteSegments]);

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

  // Premium モード切替時に既存セグメントを読み込む
  useEffect(() => {
    if (!noteId || routeMode !== 'premium' || !isPremiumUser) return;
    if (premiumTravelMode === 'transit') return;
    void loadRouteSegments(noteId, premiumTravelMode);
  }, [noteId, routeMode, premiumTravelMode, isPremiumUser, loadRouteSegments]);

  const groupsWithLocation = getGroupsWithLocation(groups);
  const initialRegion = calcRegionForGroups(groupsWithLocation);

  // 生成済みセグメントから Polyline 座標を収集
  const generatedPolylines: { coordinates: { latitude: number; longitude: number }[]; color: string }[] =
    routeMode === 'premium' && isPremiumUser && premiumTravelMode !== 'transit'
      ? routeSegments
          .filter((s) => s.status === 'generated' && s.decodedPolyline && s.decodedPolyline.length > 0)
          .map((s) => ({
            coordinates: s.decodedPolyline!,
            color: getRouteColor(premiumTravelMode),
          }))
      : [];

  // 失敗区間のフォールバック直線を収集
  const fallbackPolylines: { from: PlaceGroupDoc; to: PlaceGroupDoc }[] = [];
  if (routeMode === 'premium' && isPremiumUser && premiumTravelMode !== 'transit' && routeSegments.length > 0) {
    const failedSegments = routeSegments.filter((s) => s.status === 'failed' || s.status === 'stale');
    for (const seg of failedSegments) {
      const fromGroup = groupsWithLocation.find((g) => g.id === seg.fromPlaceGroupId);
      const toGroup = groupsWithLocation.find((g) => g.id === seg.toPlaceGroupId);
      if (fromGroup && toGroup) {
        fallbackPolylines.push({ from: fromGroup, to: toGroup });
      }
    }
  }

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

  // 実ルートPolylineを表示するか（生成済みセグメントがある場合）
  const hasGeneratedRoutes = generatedPolylines.length > 0;
  // 直線Polylineを表示するか
  const showStraightLine = routeMode === 'straight' || !hasGeneratedRoutes;

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
        {/* 直線Polyline（直線モードまたは実ルート未生成時） */}
        {groupsWithLocation.length >= 2 && showStraightLine ? (
          <Polyline
            coordinates={groupsWithLocation.map((g) => ({
              latitude: g.latitude,
              longitude: g.longitude,
            }))}
            strokeColor={hasGeneratedRoutes ? '#CCCCCC' : '#4FA8A1'}
            strokeWidth={2.5}
            lineDashPattern={[8, 5]}
          />
        ) : null}

        {/* 実ルートPolyline（生成済みセグメントの decodedPolyline を描画） */}
        {generatedPolylines.map((pl, idx) => (
          <Polyline
            key={`route-${idx}`}
            coordinates={pl.coordinates}
            strokeColor={pl.color}
            strokeWidth={3.5}
          />
        ))}

        {/* 失敗区間フォールバック直線 */}
        {fallbackPolylines.map((fb, idx) => (
          <Polyline
            key={`fallback-${idx}`}
            coordinates={[
              { latitude: fb.from.latitude, longitude: fb.from.longitude },
              { latitude: fb.to.latitude, longitude: fb.to.longitude },
            ]}
            strokeColor="#AAAAAA"
            strokeWidth={2}
            lineDashPattern={[6, 4]}
          />
        ))}

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
        {/* ── ルート表示モード ── */}
        <View style={styles.routeSection}>
          <Text style={styles.sectionLabel}>ルート表示</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.routeModeRow}
          >
            {/* 直線ルート（無料） */}
            <TouchableOpacity
              style={[styles.routeChip, routeMode === 'straight' && styles.routeChipActive]}
              onPress={() => setRouteMode('straight')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.routeChipText,
                  routeMode === 'straight' && styles.routeChipTextActive,
                ]}
              >
                直線
              </Text>
            </TouchableOpacity>

            {/* プレミアムモード（徒歩・車・公共交通） */}
            {(['walking', 'driving', 'transit'] as PremiumRouteTravelMode[]).map((mode) => {
              const isSelected = routeMode === 'premium' && premiumTravelMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.routeChip, styles.routeChipPremium, isSelected && styles.routeChipActive]}
                  onPress={() => selectPremiumMode(mode)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.routeChipText,
                      styles.routeChipTextPremium,
                      isSelected && styles.routeChipTextActive,
                    ]}
                  >
                    {getTravelModeLabel(mode)}
                  </Text>
                  {!isPremiumUser ? (
                    <Text style={[styles.routeChipBadge, isSelected && styles.routeChipBadgeActive]}>
                      Premium
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 直線ルート説明 */}
          {routeMode === 'straight' ? (
            <Text style={styles.routeNote}>
              訪問順を線で表示しています。実際の移動ルートとは異なる場合があります。
            </Text>
          ) : null}

          {/* 非Premium: Premium案内カード */}
          {routeMode === 'premium' && !isPremiumUser ? (
            <View style={styles.premiumCard}>
              <Text style={styles.premiumCardTitle}>実ルート表示はプレミアム機能です</Text>
              <Text style={styles.premiumCardDesc}>
                {getTravelModeLabel(premiumTravelMode)}での{getPremiumRouteDescription(premiumTravelMode)}
                {'\n'}
                移動時間・距離・乗換情報まで記録できるようになります。
              </Text>
              <TouchableOpacity
                style={styles.premiumCardBtn}
                onPress={() => setRouteMode('straight')}
                activeOpacity={0.7}
              >
                <Text style={styles.premiumCardBtnText}>今は直線ルートで表示</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Transit 案内（Premium + transit選択時） */}
          {routeMode === 'premium' && isPremiumUser && premiumTravelMode === 'transit' ? (
            <View style={styles.transitCard}>
              <Text style={styles.transitCardText}>
                公共交通ルートは次のフェーズで対応予定です。
              </Text>
            </View>
          ) : null}

          {/* Premium + walking/driving: ルート生成UI */}
          {routeMode === 'premium' && isPremiumUser && premiumTravelMode !== 'transit' ? (
            <RouteGenerationPanel
              travelMode={premiumTravelMode}
              status={routeGenerationStatus}
              error={routeGenerationError}
              segments={routeSegments}
              groups={groupsWithLocation}
              onGenerate={handleGenerateRoutes}
            />
          ) : null}
        </View>

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
                    router.push(`/(app)/notes/${noteId}/flows/${group.id}`);
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
                    <Text style={styles.cardAction}>詳細を見る →</Text>
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

// ── RouteGenerationPanel ──────────────────────────────────────────────────────

type RouteGenerationPanelProps = {
  travelMode: Exclude<PremiumRouteTravelMode, 'transit'>;
  status: RouteGenerationStatus;
  error: string | null;
  segments: RouteSegmentSummary[];
  groups: PlaceGroupDoc[];
  onGenerate: () => void;
};

function RouteGenerationPanel({
  travelMode,
  status,
  error,
  segments,
  groups,
  onGenerate,
}: RouteGenerationPanelProps) {
  const modeLabel = getTravelModeLabel(travelMode);
  const routeColor = getRouteColor(travelMode);
  const generatedSegments = segments.filter((s) => s.status === 'generated');
  const failedSegments = segments.filter((s) => s.status === 'failed' || s.status === 'stale');

  // ローディング中
  if (status === 'loading') {
    return (
      <View style={panelStyles.card}>
        <ActivityIndicator size="small" color={routeColor} />
        <Text style={panelStyles.loadingText}>ルートを取得中...</Text>
      </View>
    );
  }

  // エラー
  if (status === 'error' && error) {
    return (
      <View style={panelStyles.card}>
        <Text style={panelStyles.errorText}>ルートの生成に失敗しました</Text>
        <Text style={panelStyles.errorDetail}>{error}</Text>
        <TouchableOpacity style={panelStyles.generateBtn} onPress={onGenerate} activeOpacity={0.7}>
          <Text style={panelStyles.generateBtnText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 生成済みセグメントあり
  if (status === 'success' && generatedSegments.length > 0) {
    return (
      <View style={panelStyles.card}>
        <Text style={[panelStyles.cardTitle, { color: routeColor }]}>
          {modeLabel}ルート
        </Text>
        {/* 区間カード */}
        {segments.map((seg) => {
          const fromIdx = groups.findIndex((g) => g.id === seg.fromPlaceGroupId);
          const toIdx = groups.findIndex((g) => g.id === seg.toPlaceGroupId);
          const fromLabel = fromIdx >= 0 ? `#${fromIdx + 1} ${groups[fromIdx].label}` : seg.fromPlaceGroupId.slice(0, 6);
          const toLabel = toIdx >= 0 ? `#${toIdx + 1} ${groups[toIdx].label}` : seg.toPlaceGroupId.slice(0, 6);

          if (seg.status === 'failed' || seg.status === 'stale') {
            return (
              <View key={seg.id} style={panelStyles.segmentRow}>
                <Text style={panelStyles.segmentLabel} numberOfLines={1}>
                  {fromLabel} → {toLabel}
                </Text>
                <Text style={panelStyles.segmentFailed}>——（ルート取得失敗）</Text>
              </View>
            );
          }

          const durationStr =
            seg.durationSeconds != null ? formatDuration(seg.durationSeconds) : null;
          const distanceStr =
            seg.distanceMeters != null ? formatDistance(seg.distanceMeters) : null;
          const infoStr = [modeLabel, durationStr, distanceStr].filter(Boolean).join(' / ');

          return (
            <View key={seg.id} style={panelStyles.segmentRow}>
              <Text style={panelStyles.segmentLabel} numberOfLines={1}>
                {fromLabel} → {toLabel}
              </Text>
              <Text style={[panelStyles.segmentInfo, { color: routeColor }]}>{infoStr}</Text>
            </View>
          );
        })}

        {/* 失敗区間の注記 */}
        {failedSegments.length > 0 ? (
          <Text style={panelStyles.failedNote}>
            ＊ 一部区間で実ルートを取得できませんでした。直線ルートで表示しています。
          </Text>
        ) : null}

        {/* 再生成ボタン */}
        <TouchableOpacity
          style={[panelStyles.regenBtn]}
          onPress={onGenerate}
          activeOpacity={0.7}
        >
          <Text style={panelStyles.regenBtnText}>ルートを更新</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 未生成（idle）
  return (
    <View style={panelStyles.card}>
      <Text style={panelStyles.cardTitle}>{modeLabel}ルートを生成する</Text>
      <Text style={panelStyles.cardDesc}>
        訪問場所間の実際の{modeLabel}ルートを取得して表示します。
        {'\n'}（初回のみ少し時間がかかります）
      </Text>
      <TouchableOpacity
        style={[panelStyles.generateBtn, { backgroundColor: routeColor }]}
        onPress={onGenerate}
        activeOpacity={0.7}
        disabled={false}
      >
        <Text style={panelStyles.generateBtnTextWhite}>ルートを生成</Text>
      </TouchableOpacity>
    </View>
  );
}

const panelStyles = StyleSheet.create({
  card: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  generateBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  generateBtnTextWhite: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
  errorDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  segmentRow: {
    gap: 2,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  segmentLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  segmentInfo: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentFailed: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  failedNote: {
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 16,
    marginTop: 4,
  },
  regenBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  regenBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

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

  // Route mode section
  routeSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  routeModeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  routeChipActive: {
    backgroundColor: colors.mapAccent,
    borderColor: colors.mapAccent,
  },
  routeChipPremium: {
    borderStyle: 'dashed',
    borderColor: colors.textTertiary,
  },
  routeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  routeChipTextActive: {
    color: colors.white,
  },
  routeChipTextPremium: {
    color: colors.textTertiary,
  },
  routeChipBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.3,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  routeChipBadgeActive: {
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  routeNote: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 8,
    lineHeight: 16,
  },

  // Transit card
  transitCard: {
    marginTop: 10,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  transitCardText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Premium notice card
  premiumCard: {
    marginTop: 10,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  premiumCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  premiumCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  premiumCardBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  premiumCardBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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
