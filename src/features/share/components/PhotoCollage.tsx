// Phase 12: PhotoCollage — 写真コラージュコンポーネント
// 写真枚数に応じてレイアウトを切り替える。
// 1枚: 大きく表示 / 2枚: 左右 / 3枚: 大+小2 / 4枚以上: 2x2グリッド（+N表示）

import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';
import type { PhotoDoc } from '@/core/repositories/photoRepository';

type Props = {
  photos: PhotoDoc[];
  /** 最大表示枚数。超えた分は +N で表示。デフォルト 4。 */
  maxPhotos?: number;
};

export function PhotoCollage({ photos, maxPhotos = 4 }: Props) {
  const displayPhotos = photos.slice(0, maxPhotos);
  const overflowCount = photos.length - maxPhotos;

  if (displayPhotos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📷</Text>
        <Text style={styles.emptyText}>写真なし</Text>
      </View>
    );
  }

  if (displayPhotos.length === 1) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: displayPhotos[0].downloadURL }} style={styles.single} resizeMode="cover" />
      </View>
    );
  }

  if (displayPhotos.length === 2) {
    return (
      <View style={[styles.container, styles.rowLayout]}>
        <Image source={{ uri: displayPhotos[0].downloadURL }} style={styles.half} resizeMode="cover" />
        <View style={styles.gap} />
        <Image source={{ uri: displayPhotos[1].downloadURL }} style={styles.half} resizeMode="cover" />
      </View>
    );
  }

  if (displayPhotos.length === 3) {
    return (
      <View style={[styles.container, styles.rowLayout]}>
        <Image source={{ uri: displayPhotos[0].downloadURL }} style={styles.twoThirds} resizeMode="cover" />
        <View style={styles.gap} />
        <View style={styles.oneThirdColumn}>
          <Image source={{ uri: displayPhotos[1].downloadURL }} style={styles.oneThirdTop} resizeMode="cover" />
          <View style={styles.vertGap} />
          <Image source={{ uri: displayPhotos[2].downloadURL }} style={styles.oneThirdBottom} resizeMode="cover" />
        </View>
      </View>
    );
  }

  // 4枚以上: 2x2グリッド
  return (
    <View style={[styles.container, styles.grid]}>
      <View style={styles.gridRow}>
        <Image source={{ uri: displayPhotos[0].downloadURL }} style={styles.gridCell} resizeMode="cover" />
        <View style={styles.gap} />
        <Image source={{ uri: displayPhotos[1].downloadURL }} style={styles.gridCell} resizeMode="cover" />
      </View>
      <View style={styles.vertGap} />
      <View style={styles.gridRow}>
        <Image source={{ uri: displayPhotos[2].downloadURL }} style={styles.gridCell} resizeMode="cover" />
        <View style={styles.gap} />
        <View style={styles.gridCellWrapper}>
          <Image source={{ uri: displayPhotos[3].downloadURL }} style={styles.gridCell} resizeMode="cover" />
          {overflowCount > 0 ? (
            <View style={styles.overflowOverlay}>
              <Text style={styles.overflowText}>+{overflowCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const GAP = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyEmoji: {
    fontSize: 32,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  // 1枚
  single: {
    flex: 1,
    width: '100%',
  },

  // 2枚: 左右
  rowLayout: {
    flexDirection: 'row',
  },
  half: {
    flex: 1,
    height: '100%',
  },
  gap: {
    width: GAP,
    height: GAP,
  },
  vertGap: {
    height: GAP,
  },

  // 3枚: 大+小2
  twoThirds: {
    flex: 2,
    height: '100%',
  },
  oneThirdColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  oneThirdTop: {
    flex: 1,
  },
  oneThirdBottom: {
    flex: 1,
  },

  // 4枚: 2x2グリッド
  grid: {
    flexDirection: 'column',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    height: '100%',
  },
  gridCellWrapper: {
    flex: 1,
    position: 'relative',
  },

  // +N オーバーレイ
  overflowOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
