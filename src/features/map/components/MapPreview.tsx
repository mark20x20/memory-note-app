// Phase 8: Map / Place Grouping — 地図風プレビューコンポーネント
// NOTE: 外部地図 SDK（react-native-maps / expo-maps）は使用しない。
//       React Native View の絶対配置でピンを表示する「地図風 UI」。
//       Phase 9 以降で本格的な地図 SDK に置き換え可能な構造にする。

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';
import { colors } from '@/shared/theme/colors';
import type { PhotoLocation, PlaceGroup } from '../types';
import {
  getMapBounds,
  groupNearbyLocations,
  normalizeLocationToPoint,
} from '../utils/locationUtils';

// ────────────────────────────────────────────────────────────────────────────

type Props = {
  locations: PhotoLocation[];
  height?: number;
};

/**
 * 地図風プレビューコンポーネント。
 *
 * - 位置情報あり: ティール背景にピン（PlaceGroup バッジ）を絶対配置で表示
 * - 位置情報なし: empty 表示
 *
 * ピンのサイズ・余白を考慮して、表示領域に INNER_PADDING を設ける。
 */
export function MapPreview({ locations, height = 180 }: Props) {
  const groups = useMemo(() => groupNearbyLocations(locations), [locations]);
  const bounds = useMemo(() => getMapBounds(locations), [locations]);

  if (locations.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyEmoji}>📍</Text>
        <Text style={styles.emptyText}>位置情報付きの写真がありません</Text>
        <Text style={styles.emptySubtext}>
          位置情報がある写真を追加すると{'\n'}訪れた場所がここに表示されます
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.mapArea, { height }]}>
      {/* 疑似地図グリッド線 */}
      <MapGrid />

      {/* ピン（PlaceGroup） */}
      {groups.map((group) => {
        const point = normalizeLocationToPoint(
          { photoId: group.id, latitude: group.latitude, longitude: group.longitude },
          bounds
        );
        return (
          <MapPin
            key={group.id}
            group={group}
            normalizedX={point.x}
            normalizedY={point.y}
          />
        );
      })}

      {/* 位置情報付き写真数バッジ */}
      <View style={styles.locationCountBadge}>
        <Text style={styles.locationCountText}>📍 {locations.length}枚の位置情報</Text>
      </View>
    </View>
  );
}

// ── 疑似グリッド ─────────────────────────────────────────────────────────────

function MapGrid() {
  return (
    <>
      {/* 横線 */}
      {[0.25, 0.5, 0.75].map((ratio) => (
        <View
          key={`h${ratio}`}
          style={[styles.gridLine, styles.gridLineHorizontal, { top: `${ratio * 100}%` as DimensionValue }]}
        />
      ))}
      {/* 縦線 */}
      {[0.25, 0.5, 0.75].map((ratio) => (
        <View
          key={`v${ratio}`}
          style={[styles.gridLine, styles.gridLineVertical, { left: `${ratio * 100}%` as DimensionValue }]}
        />
      ))}
    </>
  );
}

// ── ピンバッジ ────────────────────────────────────────────────────────────────

const PIN_SIZE = 32; // バッジ直径 (px)
const PIN_STEM = 6;  // ピンの下の三角形高さ
const INNER_PADDING = 0.1; // ピンが端に食み出さないよう内側にオフセット

type MapPinProps = {
  group: PlaceGroup;
  normalizedX: number;
  normalizedY: number;
};

function MapPin({ group, normalizedX, normalizedY }: MapPinProps) {
  // 正規化座標 0〜1 → パーセント文字列（INNER_PADDING でクランプ）
  const clampedX = INNER_PADDING + normalizedX * (1 - 2 * INNER_PADDING);
  const clampedY = INNER_PADDING + normalizedY * (1 - 2 * INNER_PADDING);

  return (
    <View
      style={[
        styles.pinWrapper,
        {
          left: `${clampedX * 100}%` as DimensionValue,
          top: `${clampedY * 100}%` as DimensionValue,
        },
      ]}
    >
      <View style={styles.pinBadge}>
        <Text style={styles.pinCount}>{group.photoCount > 9 ? '9+' : group.photoCount}</Text>
      </View>
      <View style={styles.pinStem} />
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Empty state
  container: {
    backgroundColor: colors.mapAccentLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 4,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mapAccent,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Map area
  mapArea: {
    backgroundColor: colors.mapAccentLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },

  // Grid lines
  gridLine: {
    position: 'absolute',
    backgroundColor: colors.mapAccent,
    opacity: 0.12,
  },
  gridLineHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },

  // Pin
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    // ピンの中心を座標点に合わせる
    marginLeft: -(PIN_SIZE / 2),
    marginTop: -(PIN_SIZE + PIN_STEM),
  },
  pinBadge: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: colors.mapAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.mapAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  pinCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
    lineHeight: 14,
  },
  pinStem: {
    width: 0,
    height: 0,
    borderLeftWidth: PIN_STEM / 2 + 1,
    borderRightWidth: PIN_STEM / 2 + 1,
    borderTopWidth: PIN_STEM,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.mapAccent,
  },

  // Location count badge (bottom-left)
  locationCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mapAccent,
  },
});
