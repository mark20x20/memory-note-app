// Phase 12.5F-1: Map screen — 訪れた場所を番号付きピンで地図表示
// Phase 12.5H-1: Route Plan Mode — ルートモード選択UI
// Phase 12.5H-5: Walking / Driving 実ルート生成・表示
// Phase 12.5H-7A: Premium / Quota — Firestore entitlement チェック本実装
// UI-4: Memory-led Map UX — selected place card / photo strip / route chip reorder / __DEV__ log guard
//
// Route: /(app)/notes/[noteId]/map

import { useCallback, useEffect, useRef, useState } from 'react';
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
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useNotePhotos } from '@/features/photos/hooks/useNotePhotos';
import { canOpenGroupedPhotoViewer } from '@/features/photos/utils/photoViewerNavigation';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import { canEdit } from '@/features/memoryNotes/utils/permissions';
import type {
  PlaceGroupDoc,
  RouteDisplayMode,
  PremiumRouteTravelMode,
  RouteSegmentSummary,
  RouteGenerationStatus,
  SegmentTravelModeInput,
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
import { usePremiumStatus } from '@/features/map/hooks/usePremiumStatus';

// ── 定数 ────────────────────────────────────────────────────────────────────

/** スペック推奨: 300〜380px。memory-led map に適したサイズ。 */
const MAP_HEIGHT = 340;
const DEFAULT_DELTA = 0.01;

// ── ヘルパー ─────────────────────────────────────────────────────────────────

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

/** latitude / longitude がある PlaceGroup のみを返す */
function getGroupsWithLocation(groups: PlaceGroupDoc[]): PlaceGroupDoc[] {
  return groups.filter(
    (g) => g.latitude != null && g.longitude != null && g.latitude !== 0 && g.longitude !== 0
  );
}

// ── Phase 12.5H-5.5: Mixed Route Mode ────────────────────────────────────────

type LoadRouteEffectiveMode = PremiumRouteTravelMode | 'mixed';
type SegmentModeEntry = SegmentTravelModeInput;

function getSegmentMode(
  modes: SegmentModeEntry[],
  fromId: string,
  toId: string,
  fallback: PremiumRouteTravelMode = 'walking'
): PremiumRouteTravelMode {
  return (
    modes.find((e) => e.fromPlaceGroupId === fromId && e.toPlaceGroupId === toId)?.travelMode ??
    fallback
  );
}

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

// ── 番号付きマーカー ──────────────────────────────────────────────────────────

type NumberedMarkerProps = {
  number: number;
  confirmed: boolean;
  /** 選択中のピン — 強調表示 */
  selected?: boolean;
};

function NumberedMarkerView({ number, confirmed, selected = false }: NumberedMarkerProps) {
  const w = selected ? 42 : 36;
  const h = selected ? 30 : 26;
  const stemH = selected ? 7 : 6;
  const filled = confirmed || selected;
  return (
    <View style={markerStyles.wrapper}>
      <View
        style={[
          markerStyles.badge,
          { width: w, height: h, borderRadius: selected ? 10 : 8 },
          filled ? markerStyles.badgeFilled : markerStyles.badgeOutline,
          selected && markerStyles.badgeSelectedShadow,
        ]}
      >
        <Text style={[markerStyles.badgeText, filled ? markerStyles.badgeTextFilled : markerStyles.badgeTextOutline]}>
          #{number}
        </Text>
      </View>
      <View
        style={[
          markerStyles.stem,
          { borderTopWidth: stemH, borderLeftWidth: stemH / 2, borderRightWidth: stemH / 2 },
          markerStyles.stemTeal,
        ]}
      />
    </View>
  );
}

const markerStyles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeFilled: { backgroundColor: colors.mapAccent },
  badgeOutline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
  },
  badgeSelectedShadow: {
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextFilled: { color: colors.white },
  badgeTextOutline: { color: colors.mapAccent },
  stem: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  stemTeal: { borderTopColor: colors.mapAccent },
});

// ── メイン画面 ────────────────────────────────────────────────────────────────

export default function NoteMapScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note, isLoading: noteLoading } = useNoteDetail(noteId ?? null);
  const { photos: allPhotos } = useNotePhotos(noteId ?? null);

  const [groups, setGroups] = useState<PlaceGroupDoc[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);
  /** MapView への ref — animateToRegion で使用 */
  const mapRef = useRef<MapView>(null);

  /** 選択中のPlaceGroup ID（null = 最初のグループ） */
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  /** ピン / タイムライン選択時の共通処理: selectedGroupId を更新し camera を移動 */
  function selectGroup(group: PlaceGroupDoc) {
    setSelectedGroupId(group.id);
    if (
      mapRef.current &&
      typeof group.latitude === 'number' &&
      typeof group.longitude === 'number' &&
      group.latitude !== 0 &&
      group.longitude !== 0
    ) {
      if (__DEV__) console.log('[map] animateToSelectedGroup', { label: group.label });
      mapRef.current.animateToRegion(
        {
          latitude: group.latitude,
          longitude: group.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        300
      );
    }
  }

  const userCanEdit = uid && note ? canEdit(note, uid) : false;

  const { isPremiumUser, loading: premiumLoading } = usePremiumStatus(uid);

  // ── ルート表示モード ──────────────────────────────────────────────────────
  const [routeMode, setRouteMode] = useState<RouteDisplayMode>('straight');
  const [premiumTravelMode, setPremiumTravelMode] = useState<PremiumRouteTravelMode>('walking');
  const [isMixedMode, setIsMixedMode] = useState(false);
  const [segmentTravelModes, setSegmentTravelModes] = useState<SegmentModeEntry[]>([]);

  // ── ルート生成状態 ────────────────────────────────────────────────────────
  const [routeSegments, setRouteSegments] = useState<RouteSegmentSummary[]>([]);
  const [routeGenerationStatus, setRouteGenerationStatus] = useState<RouteGenerationStatus>('idle');
  const [routeGenerationError, setRouteGenerationError] = useState<string | null>(null);

  function selectPremiumMode(mode: PremiumRouteTravelMode) {
    if (__DEV__) console.log('[map] premium mode selected', { mode });
    setPremiumTravelMode(mode);
    setRouteMode('premium');
    setIsMixedMode(false);
    setRouteSegments([]);
    setRouteGenerationStatus('idle');
    setRouteGenerationError(null);
  }

  function selectMixedMode() {
    setRouteMode('premium');
    setIsMixedMode(true);
    setRouteSegments([]);
    setRouteGenerationStatus('idle');
    setRouteGenerationError(null);
    const gwl = getGroupsWithLocation(groups);
    if (gwl.length >= 2) {
      const defaultMode: PremiumRouteTravelMode =
        premiumTravelMode === 'transit' ? 'walking' : premiumTravelMode;
      const initialModes: SegmentModeEntry[] = [];
      for (let i = 0; i < gwl.length - 1; i++) {
        initialModes.push({
          fromPlaceGroupId: gwl[i].id,
          toPlaceGroupId: gwl[i + 1].id,
          travelMode: defaultMode,
        });
      }
      setSegmentTravelModes(initialModes);
    }
  }

  /**
   * ルートセグメントを Firestore から読み込む。
   * effectiveMode:
   *   'mixed'  → travelMode を送らず全件取得（区間別モード）
   *   その他   → travelMode を指定してフィルタ取得
   * 'straight' / 'premium' / routeMode などを直接渡さないこと。
   */
  const loadRouteSegments = useCallback(
    async (targetNoteId: string, effectiveMode: LoadRouteEffectiveMode) => {
      try {
        if (effectiveMode === 'mixed') {
          if (__DEV__) console.log('[map] loadRouteSegments effectiveMode=mixed');
          const result = await getNoteRouteSegmentsCallable({ noteId: targetNoteId });
          if (__DEV__) console.log('[map] routeSegments resultCount', { count: result.segments.length, effectiveMode: 'mixed' });
          setRouteSegments(result.segments);
          setRouteGenerationStatus(result.segments.length > 0 ? 'success' : 'idle');
        } else {
          if (__DEV__) console.log('[map] loadRouteSegments effectiveMode', { noteId: targetNoteId, travelMode: effectiveMode });
          const result = await getNoteRouteSegmentsCallable({ noteId: targetNoteId, travelMode: effectiveMode });
          if (__DEV__) console.log('[map] routeSegments resultCount', { count: result.segments.length, effectiveMode });
          setRouteSegments(result.segments);
          setRouteGenerationStatus(result.segments.length > 0 ? 'success' : 'idle');
        }
      } catch (err) {
        if (__DEV__) console.warn('[map] loadRouteSegments error:', err);
        setRouteGenerationStatus('idle');
      }
    },
    []
  );

  const handleGenerateRoutes = useCallback(
    async (forceRefresh = false) => {
      if (!noteId) return;
      setRouteGenerationStatus('loading');
      setRouteGenerationError(null);
      try {
        if (isMixedMode) {
          const modesForApi = segmentTravelModes;
          if (__DEV__) console.log('[map] handleGenerateRoutes input', { isMixedMode: true, modesForApi, forceRefresh });
          await generateNoteRoutesCallable({ noteId, segmentTravelModes: modesForApi, forceRefresh });
          await loadRouteSegments(noteId, 'mixed');
        } else {
          if (__DEV__) console.log('[map] handleGenerateRoutes input', { isMixedMode: false, travelMode: premiumTravelMode, forceRefresh });
          await generateNoteRoutesCallable({ noteId, travelMode: premiumTravelMode, forceRefresh });
          await loadRouteSegments(noteId, premiumTravelMode);
        }
      } catch (err) {
        const callErr = err as CallableError;
        setRouteGenerationError(callErr.message ?? 'ルートの生成に失敗しました');
        setRouteGenerationStatus('error');
      }
    },
    [noteId, premiumTravelMode, isMixedMode, segmentTravelModes, loadRouteSegments]
  );

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

  useEffect(() => {
    if (!noteId || routeMode !== 'premium' || !isPremiumUser) return;
    if (isMixedMode) {
      void loadRouteSegments(noteId, 'mixed');
    } else {
      void loadRouteSegments(noteId, premiumTravelMode);
    }
  }, [noteId, routeMode, premiumTravelMode, isMixedMode, isPremiumUser, loadRouteSegments]);

  const groupsWithLocation = getGroupsWithLocation(groups);
  const initialRegion = calcRegionForGroups(groupsWithLocation);

  // 選択中グループ（null なら最初のグループをデフォルトとする）
  const selectedGroup =
    (selectedGroupId ? groupsWithLocation.find((g) => g.id === selectedGroupId) : null) ??
    groupsWithLocation[0] ??
    null;
  const selectedGroupIdx = selectedGroup ? groupsWithLocation.indexOf(selectedGroup) : -1;

  // UI-8: photoIds がある場合のみ grouped viewer を開ける
  const canViewGroupPhotos = selectedGroup ? canOpenGroupedPhotoViewer(selectedGroup) : false;

  // 選択グループの関連写真
  const groupPhotoURLs: string[] = selectedGroup
    ? selectedGroup.photoIds && selectedGroup.photoIds.length > 0
      ? allPhotos
          .filter((p) => (selectedGroup.photoIds as string[]).includes(p.id))
          .map((p) => p.downloadURL)
          .filter(Boolean)
          .slice(0, 8)
      : (selectedGroup.photoPreviewURLs ?? []).slice(0, 8)
    : [];

  // Polyline 生成
  const generatedPolylines: { coordinates: { latitude: number; longitude: number }[]; color: string }[] = [];
  if (routeMode === 'premium' && isPremiumUser) {
    if (!isMixedMode) {
      for (const s of routeSegments) {
        if (s.status === 'generated' && s.decodedPolyline && s.decodedPolyline.length > 0) {
          generatedPolylines.push({ coordinates: s.decodedPolyline, color: getRouteColor(premiumTravelMode) });
        }
      }
    } else {
      for (const s of routeSegments) {
        if (s.status !== 'generated' || !s.decodedPolyline || s.decodedPolyline.length === 0) continue;
        const selectedMode = getSegmentMode(segmentTravelModes, s.fromPlaceGroupId, s.toPlaceGroupId);
        if (s.travelMode === selectedMode) {
          generatedPolylines.push({ coordinates: s.decodedPolyline, color: getRouteColor(s.travelMode ?? 'walking') });
        }
      }
    }
  }

  // 失敗区間フォールバック直線
  const fallbackPolylines: { from: PlaceGroupDoc; to: PlaceGroupDoc }[] = [];
  if (routeMode === 'premium' && isPremiumUser) {
    if (!isMixedMode && routeSegments.length > 0) {
      const failedSegments = routeSegments.filter((s) => s.status === 'failed' || s.status === 'stale');
      for (const seg of failedSegments) {
        const fromGroup = groupsWithLocation.find((g) => g.id === seg.fromPlaceGroupId);
        const toGroup = groupsWithLocation.find((g) => g.id === seg.toPlaceGroupId);
        if (fromGroup && toGroup) fallbackPolylines.push({ from: fromGroup, to: toGroup });
      }
    } else if (isMixedMode) {
      for (let i = 0; i < groupsWithLocation.length - 1; i++) {
        const from = groupsWithLocation[i];
        const to = groupsWithLocation[i + 1];
        const selectedMode = getSegmentMode(segmentTravelModes, from.id, to.id);
        const matchSeg = routeSegments.find(
          (s) => s.fromPlaceGroupId === from.id && s.toPlaceGroupId === to.id && s.travelMode === selectedMode
        );
        if (!matchSeg || matchSeg.status !== 'generated' || !matchSeg.decodedPolyline?.length) {
          fallbackPolylines.push({ from, to });
        }
      }
    }
  }

  // ── ローディング / 空状態 ─────────────────────────────────────────────────

  if (noteLoading || groupsLoading || premiumLoading) {
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

  if (groups.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="地図" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={styles.emptyTitle}>訪れた場所がまだありません</Text>
          <Text style={styles.emptyDesc}>写真から場所を推定すると、地図に表示されます。</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (groupsWithLocation.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="地図" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyTitle}>位置情報のある場所がありません</Text>
          <Text style={styles.emptyDesc}>位置情報のある写真を追加すると、地図に表示されます。</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasGeneratedRoutes = generatedPolylines.length > 0;
  const showStraightLine =
    routeMode === 'straight' ||
    (routeMode === 'premium' && !isMixedMode && !hasGeneratedRoutes);

  // ── レンダー ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="地図"
        onBack={() => router.back()}
      />

      {/* ── Map Canvas ── */}
      <MapView
        ref={mapRef}
        style={{ height: MAP_HEIGHT }}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
      >
        {/* 直線Polyline（直線モードまたは実ルート未生成時） */}
        {groupsWithLocation.length >= 2 && showStraightLine ? (
          <Polyline
            coordinates={groupsWithLocation.map((g) => ({ latitude: g.latitude, longitude: g.longitude }))}
            strokeColor={colors.mapAccent}
            strokeWidth={2}
            lineDashPattern={[8, 5]}
          />
        ) : null}

        {/* 実ルートPolyline */}
        {generatedPolylines.map((pl, idx) => (
          <Polyline
            key={`route-${idx}`}
            coordinates={pl.coordinates}
            strokeColor={pl.color}
            strokeWidth={3}
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
            strokeColor="#BBBBBB"
            strokeWidth={1.5}
            lineDashPattern={[6, 4]}
          />
        ))}

        {/* 番号付きピン */}
        {groupsWithLocation.map((group, idx) => (
          <Marker
            key={group.id}
            coordinate={{ latitude: group.latitude, longitude: group.longitude }}
            onPress={() => selectGroup(group)}
          >
            <NumberedMarkerView
              number={idx + 1}
              confirmed={group.userConfirmed}
              selected={group.id === selectedGroup?.id}
            />
          </Marker>
        ))}
      </MapView>

      {/* ── 下部スクロール ── */}
      <ScrollView
        style={styles.bottomSheet}
        contentContainerStyle={styles.bottomSheetContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Section 1: Selected Place Card ── */}
        {selectedGroup ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedCardHeader}>
              <View style={styles.selectedNumBadge}>
                <Text style={styles.selectedNum}>#{selectedGroupIdx + 1}</Text>
              </View>
              {formatStartTime(selectedGroup) ? (
                <Text style={styles.selectedTime}>{formatStartTime(selectedGroup)}</Text>
              ) : null}
              <View style={[
                styles.confirmedChip,
                selectedGroup.userConfirmed ? styles.confirmedChipYes : styles.confirmedChipNo,
              ]}>
                <Text style={[
                  styles.confirmedChipText,
                  selectedGroup.userConfirmed ? styles.confirmedChipTextYes : styles.confirmedChipTextNo,
                ]}>
                  {selectedGroup.userConfirmed ? '場所確認済み' : '未確認'}
                </Text>
              </View>
            </View>

            <Text style={styles.selectedName}>{selectedGroup.label}</Text>
            <Text style={styles.selectedCategory}>{getCategoryLabel(selectedGroup.category)}</Text>

            {selectedGroup.eventMemo ? (
              <Text style={styles.selectedMemo} numberOfLines={2}>{selectedGroup.eventMemo}</Text>
            ) : null}

            <View style={styles.selectedActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/(app)/notes/${noteId}/flows/${selectedGroup.id}` as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>詳細を見る</Text>
              </TouchableOpacity>
              {userCanEdit ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonAccent]}
                  onPress={() => router.push(`/(app)/notes/${noteId}/places/${selectedGroup.id}` as any)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonText, styles.actionButtonAccentText]}>場所を確認</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── Section 2: 関連写真 ── */}
        {groupPhotoURLs.length > 0 ? (
          <View style={styles.photoSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
            >
              {groupPhotoURLs.map((url, idx) =>
                canViewGroupPhotos ? (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push(
                        `/(app)/notes/${noteId}/photos/viewer?initialIndex=${idx}&placeGroupId=${selectedGroup?.id}` as any
                      )
                    }
                  >
                    <Image source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
                  </TouchableOpacity>
                ) : (
                  <Image key={idx} source={{ uri: url }} style={[styles.photoThumb, styles.photoThumbFallback]} resizeMode="cover" />
                )
              )}
            </ScrollView>
          </View>
        ) : null}

        {/* ── Section 3: この日の流れ（コンパクトタイムライン） ── */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionLabel}>この日の流れ</Text>
          <View style={styles.timelineList}>
            {groupsWithLocation.map((group, idx) => {
              const isLast = idx === groupsWithLocation.length - 1;
              const isSelected = group.id === selectedGroup?.id;
              const timeStr = formatStartTime(group);
              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.timelineItem}
                  onPress={() => selectGroup(group)}
                  activeOpacity={0.7}
                >
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelinePin, isSelected && styles.timelinePinSelected]}>
                      <Text style={[styles.timelinePinText, isSelected && styles.timelinePinTextSelected]}>
                        #{idx + 1}
                      </Text>
                    </View>
                    {!isLast ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineRight}>
                    {timeStr ? <Text style={styles.timelineTime}>{timeStr}</Text> : null}
                    <Text style={[styles.timelineLabel, isSelected && styles.timelineLabelSelected]} numberOfLines={1}>
                      {group.label}
                    </Text>
                    <Text style={styles.timelineCategory}>
                      {getCategoryLabel(group.category)}
                      {group.photoCount > 0 ? ` · 写真${group.photoCount}枚` : ''}
                    </Text>
                  </View>
                  <Text style={styles.timelineChevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section 4: ルート表示モード ── */}
        <View style={styles.routeSection}>
          <Text style={styles.sectionLabel}>ルート表示</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.routeChipRow}
          >
            {/* 直線（無料） */}
            <TouchableOpacity
              style={[styles.routeChip, routeMode === 'straight' && styles.routeChipActive]}
              onPress={() => { setRouteMode('straight'); setIsMixedMode(false); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.routeChipText, routeMode === 'straight' && styles.routeChipTextActive]}>
                直線
              </Text>
            </TouchableOpacity>

            {/* 徒歩 / 車 / 公共交通 */}
            {(['walking', 'driving', 'transit'] as PremiumRouteTravelMode[]).map((mode) => {
              const isActive = routeMode === 'premium' && !isMixedMode && premiumTravelMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.routeChip, styles.routeChipPremium, isActive && styles.routeChipActive]}
                  onPress={() => selectPremiumMode(mode)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.routeChipText, styles.routeChipTextPremium, isActive && styles.routeChipTextActive]}>
                    {getTravelModeLabel(mode)}
                  </Text>
                  {!isPremiumUser ? (
                    <Text style={[styles.routeChipBadge, isActive && styles.routeChipBadgeActive]}>
                      Premium
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {/* 区間別 */}
            <TouchableOpacity
              style={[styles.routeChip, styles.routeChipPremium, isMixedMode && styles.routeChipActive]}
              onPress={selectMixedMode}
              activeOpacity={0.7}
            >
              <Text style={[styles.routeChipText, styles.routeChipTextPremium, isMixedMode && styles.routeChipTextActive]}>
                区間別
              </Text>
              {!isPremiumUser ? (
                <Text style={[styles.routeChipBadge, isMixedMode && styles.routeChipBadgeActive]}>
                  Premium
                </Text>
              ) : null}
            </TouchableOpacity>
          </ScrollView>

          {/* 直線ルート説明 */}
          {routeMode === 'straight' ? (
            <Text style={styles.routeNote}>
              訪問順を線で表示しています。実際の移動ルートとは異なる場合があります。
            </Text>
          ) : null}

          {/* 非Premium: Premium案内 */}
          {routeMode === 'premium' && !isPremiumUser ? (
            <View style={styles.premiumCard}>
              <Text style={styles.premiumCardTitle}>実ルート表示はプレミアム機能です</Text>
              <Text style={styles.premiumCardDesc}>
                {getTravelModeLabel(premiumTravelMode)}での{getPremiumRouteDescription(premiumTravelMode)}
                {'\n'}
                移動時間・距離まで記録できます。
              </Text>
              <TouchableOpacity
                style={styles.premiumCardBtn}
                onPress={() => setRouteMode('straight')}
                activeOpacity={0.7}
              >
                <Text style={styles.premiumCardBtnText}>今は直線ルートで表示</Text>
              </TouchableOpacity>
              {__DEV__ && uid ? (
                <Text style={styles.premiumCardDevGuide}>
                  {'[DEV] Firestore Console で Premium を付与:\n'}
                  {'users/' + uid + '/entitlements/premium\n'}
                  {'{ active: true, source: "manual_dev", updatedAt: <serverTimestamp> }'}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Premium: ルート生成UI */}
          {routeMode === 'premium' && isPremiumUser ? (
            <RouteGenerationPanel
              travelMode={premiumTravelMode}
              isMixedMode={isMixedMode}
              status={routeGenerationStatus}
              error={routeGenerationError}
              segments={routeSegments}
              groups={groupsWithLocation}
              segmentTravelModes={segmentTravelModes}
              onGenerate={() => void handleGenerateRoutes(false)}
              onRefresh={() => void handleGenerateRoutes(true)}
              onSegmentModeChange={(fromId, toId, mode) => {
                setSegmentTravelModes((prev) =>
                  prev.map((e) =>
                    e.fromPlaceGroupId === fromId && e.toPlaceGroupId === toId
                      ? { ...e, travelMode: mode }
                      : e
                  )
                );
                setRouteSegments([]);
                setRouteGenerationStatus('idle');
              }}
            />
          ) : null}
        </View>

        {/* 位置情報なし場所の案内 */}
        {groups.length > groupsWithLocation.length ? (
          <View style={styles.noLocationNote}>
            <Text style={styles.noLocationText}>
              ＊ 位置情報がない場所 {groups.length - groupsWithLocation.length}件は地図に表示されていません。
            </Text>
          </View>
        ) : null}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── RouteGenerationPanel ──────────────────────────────────────────────────────
// (既存の実装を維持。ルートロジックは変更しない)

type RouteGenerationPanelProps = {
  travelMode: PremiumRouteTravelMode;
  isMixedMode: boolean;
  status: RouteGenerationStatus;
  error: string | null;
  segments: RouteSegmentSummary[];
  groups: PlaceGroupDoc[];
  segmentTravelModes: SegmentModeEntry[];
  onGenerate: () => void;
  onRefresh: () => void;
  onSegmentModeChange: (fromId: string, toId: string, mode: PremiumRouteTravelMode) => void;
};

function RouteGenerationPanel({
  travelMode,
  isMixedMode,
  status,
  error,
  segments,
  groups,
  segmentTravelModes,
  onGenerate,
  onRefresh,
  onSegmentModeChange,
}: RouteGenerationPanelProps) {
  const modeLabel = isMixedMode ? '区間別' : getTravelModeLabel(travelMode);
  const routeColor = isMixedMode ? '#7B68EE' : getRouteColor(travelMode);
  const generatedSegments = segments.filter((s) => s.status === 'generated');
  const failedSegments = segments.filter((s) => s.status === 'failed' || s.status === 'stale');

  if (status === 'loading') {
    return (
      <View style={panelStyles.card}>
        <ActivityIndicator size="small" color={routeColor} />
        <Text style={panelStyles.loadingText}>ルートを取得中...</Text>
      </View>
    );
  }

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

  // 区間別モード
  if (isMixedMode) {
    return (
      <View style={panelStyles.card}>
        <Text style={panelStyles.cardTitle}>区間ごとの移動手段</Text>
        {groups.length >= 2
          ? groups.slice(0, -1).map((fromGroup, idx) => {
              const toGroup = groups[idx + 1];
              const currentMode = getSegmentMode(segmentTravelModes, fromGroup.id, toGroup.id);
              const matchSeg =
                status === 'success'
                  ? segments.find(
                      (s) =>
                        s.fromPlaceGroupId === fromGroup.id &&
                        s.toPlaceGroupId === toGroup.id &&
                        s.travelMode === currentMode
                    )
                  : undefined;
              return (
                <View key={fromGroup.id} style={panelStyles.segmentModeBlock}>
                  <Text style={panelStyles.segmentModeTitle} numberOfLines={1}>
                    #{idx + 1} {fromGroup.label} → #{idx + 2} {toGroup.label}
                  </Text>
                  <View style={panelStyles.segmentModeChips}>
                    {(['walking', 'driving', 'transit'] as PremiumRouteTravelMode[]).map((mode) => {
                      const isActive = currentMode === mode;
                      return (
                        <TouchableOpacity
                          key={mode}
                          style={[panelStyles.segmentModeChip, isActive && panelStyles.segmentModeChipActive]}
                          onPress={() => onSegmentModeChange(fromGroup.id, toGroup.id, mode)}
                          activeOpacity={0.7}
                        >
                          <Text style={[panelStyles.segmentModeChipText, isActive && panelStyles.segmentModeChipTextActive]}>
                            {getTravelModeLabel(mode)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {matchSeg?.status === 'generated' ? (
                    <Text style={[panelStyles.segmentInfo, { color: getRouteColor(currentMode) }]}>
                      {[
                        getTravelModeLabel(currentMode),
                        matchSeg.durationSeconds != null ? formatDuration(matchSeg.durationSeconds) : null,
                        matchSeg.distanceMeters != null ? formatDistance(matchSeg.distanceMeters) : null,
                      ].filter(Boolean).join(' / ')}
                    </Text>
                  ) : null}
                </View>
              );
            })
          : null}

        {status === 'success' && failedSegments.length > 0 ? (
          <Text style={panelStyles.failedNote}>
            ＊ 一部区間はルートを取得できませんでした。直線で表示しています。
          </Text>
        ) : null}

        {status === 'success' && generatedSegments.length > 0 ? (
          <TouchableOpacity style={panelStyles.regenBtn} onPress={onRefresh} activeOpacity={0.7}>
            <Text style={panelStyles.regenBtnText}>選択した移動手段でルートを更新</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[panelStyles.generateBtn, { backgroundColor: routeColor }]}
            onPress={onGenerate}
            activeOpacity={0.7}
          >
            <Text style={panelStyles.generateBtnTextWhite}>選択した移動手段でルートを生成</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 全体モード — 生成済み
  if (status === 'success' && generatedSegments.length > 0) {
    return (
      <View style={panelStyles.card}>
        <Text style={[panelStyles.cardTitle, { color: routeColor }]}>{modeLabel}ルート</Text>
        {segments.map((seg) => {
          const fromIdx = groups.findIndex((g) => g.id === seg.fromPlaceGroupId);
          const toIdx = groups.findIndex((g) => g.id === seg.toPlaceGroupId);
          const fromLabel = fromIdx >= 0 ? `#${fromIdx + 1} ${groups[fromIdx].label}` : seg.fromPlaceGroupId.slice(0, 6);
          const toLabel = toIdx >= 0 ? `#${toIdx + 1} ${groups[toIdx].label}` : seg.toPlaceGroupId.slice(0, 6);

          if (seg.status === 'failed' || seg.status === 'stale') {
            return (
              <View key={seg.id} style={panelStyles.segmentRow}>
                <Text style={panelStyles.segmentLabel} numberOfLines={1}>{fromLabel} → {toLabel}</Text>
                <Text style={panelStyles.segmentFailed}>この区間はルートを取得できませんでした。直線で表示しています。</Text>
              </View>
            );
          }

          const durationStr = seg.durationSeconds != null ? formatDuration(seg.durationSeconds) : null;
          const distanceStr = seg.distanceMeters != null ? formatDistance(seg.distanceMeters) : null;
          const infoStr = [modeLabel, durationStr, distanceStr].filter(Boolean).join(' / ');
          return (
            <View key={seg.id} style={panelStyles.segmentRow}>
              <Text style={panelStyles.segmentLabel} numberOfLines={1}>{fromLabel} → {toLabel}</Text>
              <Text style={[panelStyles.segmentInfo, { color: routeColor }]}>{infoStr}</Text>
            </View>
          );
        })}

        {failedSegments.length > 0 ? (
          <Text style={panelStyles.failedNote}>
            ＊ 一部区間はルートを取得できませんでした。直線で表示しています。
          </Text>
        ) : null}

        <TouchableOpacity style={panelStyles.regenBtn} onPress={onRefresh} activeOpacity={0.7}>
          <Text style={panelStyles.regenBtnText}>ルートを更新</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 全体モード — 未生成
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
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  cardDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  generateBtn: {
    alignSelf: 'flex-start', marginTop: 4,
    borderRadius: borderRadius.md, paddingHorizontal: 16, paddingVertical: 8,
  },
  generateBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  generateBtnTextWhite: { fontSize: 13, fontWeight: '700', color: colors.white },
  loadingText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 13, fontWeight: '700', color: colors.error },
  errorDetail: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  segmentRow: { gap: 2, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  segmentLabel: { fontSize: 12, color: colors.textSecondary },
  segmentInfo: { fontSize: 13, fontWeight: '600' },
  segmentFailed: { fontSize: 12, color: colors.textTertiary, lineHeight: 18 },
  failedNote: { fontSize: 11, color: colors.textTertiary, lineHeight: 16, marginTop: 4 },
  regenBtn: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  regenBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  // 区間別モード
  segmentModeBlock: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border, gap: 6 },
  segmentModeTitle: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  segmentModeChips: { flexDirection: 'row', gap: 6 },
  segmentModeChip: {
    borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.surface,
  },
  segmentModeChipActive: { backgroundColor: colors.mapAccent, borderColor: colors.mapAccent },
  segmentModeChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  segmentModeChipTextActive: { color: colors.white },
});

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  loadingText: { fontSize: 14, color: colors.textTertiary },
  emptyEmoji: { fontSize: 48, opacity: 0.5, marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 4 },

  bottomSheet: { flex: 1, backgroundColor: colors.background },
  bottomSheetContent: { paddingTop: 4, paddingBottom: 4 },

  // Selected Place Card
  selectedCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedNumBadge: {
    backgroundColor: colors.mapAccent,
    borderRadius: borderRadius.md,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  selectedNum: { fontSize: 12, fontWeight: '700', color: colors.white },
  selectedTime: { fontSize: 13, fontWeight: '600', color: colors.mapAccent },
  confirmedChip: {
    marginLeft: 'auto',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  confirmedChipYes: { backgroundColor: '#E6F4F0', borderColor: colors.success },
  confirmedChipNo: { backgroundColor: colors.surfaceIvory, borderColor: colors.warning },
  confirmedChipText: { fontSize: 11, fontWeight: '600' },
  confirmedChipTextYes: { color: colors.success },
  confirmedChipTextNo: { color: colors.warning },
  selectedName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
  selectedCategory: { fontSize: 12, color: colors.textSecondary },
  selectedMemo: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },
  selectedActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  actionButtonAccent: { borderColor: colors.mapAccent, backgroundColor: colors.mapAccentLight },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  actionButtonAccentText: { color: colors.mapAccent },

  // Photo strip
  photoSection: { marginTop: 10 },
  photoStrip: { paddingHorizontal: 16, gap: 8 },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.border,
  },
  // UI-8: fallback 写真は viewer を開かないため少し opacity を下げる
  photoThumbFallback: {
    opacity: 0.75,
  },

  // Compact timeline
  timelineSection: { paddingHorizontal: 16, paddingTop: 18 },
  timelineList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 11,
  },
  timelineLeft: { width: 36, alignItems: 'center' },
  timelinePin: {
    width: 28,
    height: 22,
    borderRadius: 7,
    backgroundColor: colors.mapAccentLight,
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelinePinSelected: { backgroundColor: colors.mapAccent },
  timelinePinText: { fontSize: 10, fontWeight: '700', color: colors.mapAccent },
  timelinePinTextSelected: { color: colors.white },
  timelineLine: { flex: 1, width: 1.5, backgroundColor: colors.border, marginTop: 2 },
  timelineRight: { flex: 1, paddingLeft: 10, gap: 2 },
  timelineTime: { fontSize: 12, fontWeight: '600', color: colors.mapAccent },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  timelineLabelSelected: { color: colors.mapAccent },
  timelineCategory: { fontSize: 12, color: colors.textSecondary },
  timelineChevron: { fontSize: 18, color: colors.textTertiary, alignSelf: 'center', paddingLeft: 4 },

  // Route section
  routeSection: { paddingHorizontal: 16, paddingTop: 20 },
  routeChipRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  routeChipActive: { backgroundColor: colors.mapAccent, borderColor: colors.mapAccent },
  routeChipPremium: { borderStyle: 'dashed', borderColor: colors.textTertiary },
  routeChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  routeChipTextActive: { color: colors.white },
  routeChipTextPremium: { color: colors.textTertiary },
  routeChipBadge: {
    fontSize: 9, fontWeight: '700', color: colors.textTertiary,
    letterSpacing: 0.3, backgroundColor: colors.surfaceIvory,
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
  },
  routeChipBadgeActive: { color: colors.white, backgroundColor: 'rgba(255,255,255,0.25)' },
  routeNote: { fontSize: 11, color: colors.textTertiary, marginTop: 8, lineHeight: 16 },

  // Premium card
  premiumCard: {
    marginTop: 10,
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  premiumCardTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  premiumCardDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  premiumCardBtn: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 6,
  },
  premiumCardBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  premiumCardDevGuide: {
    fontSize: 10, color: colors.textTertiary, marginTop: 8,
    lineHeight: 15, fontFamily: 'monospace' as const,
  },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10,
  },

  noLocationNote: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: colors.surfaceIvory, borderRadius: borderRadius.md, padding: 12,
  },
  noLocationText: { fontSize: 12, color: colors.textTertiary, lineHeight: 18 },
});
