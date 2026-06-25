// UI-17: Full Photo Viewer Polish
// Route: /(app)/notes/[noteId]/photos/viewer?initialIndex=0&placeGroupId=xxx
//
// - 黒背景でフルスクリーン表示
// - 横スワイプ（FlatList pagingEnabled）で写真間を移動
// - 写真番号 / 合計枚数を表示
// - 撮影時刻があれば表示
// - 閉じるボタンで戻る
// - placeGroupId を渡すとそのフローの写真だけ表示
// - UI-17: header overlay / bottom metadata panel / error state / placeGroup label

import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { photoRepository } from '@/core/repositories/photoRepository';
import { placeGroupRepository } from '@/core/repositories/placeGroupRepository';
import type { PhotoDoc } from '@/core/repositories/photoRepository';
import type { PlaceGroupDoc } from '@/features/map/types';

// ── 定数 ────────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** スペック準拠のビューア背景色 */
const VIEWER_BG = '#0F0E0D';

// ── ヘルパー ─────────────────────────────────────────────────────────────────

function formatTakenAt(takenAt: string): string {
  try {
    const d = new Date(takenAt);
    if (isNaN(d.getTime())) return '';
    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${Y}/${M}/${D} ${h}:${m}`;
  } catch {
    return '';
  }
}

// ── 閉じるボタン ──────────────────────────────────────────────────────────────

function CloseButton() {
  return (
    <TouchableOpacity style={styles.closeArea} onPress={() => router.back()} hitSlop={12} activeOpacity={0.7}>
      <Text style={styles.closeTxt}>✕</Text>
    </TouchableOpacity>
  );
}

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function PhotoViewerScreen() {
  const { noteId, placeGroupId, initialIndex: initialIndexParam } = useLocalSearchParams<{
    noteId: string;
    placeGroupId?: string;
    initialIndex?: string;
  }>();

  const initialIdx = Math.max(0, parseInt(initialIndexParam ?? '0', 10) || 0);

  const [allPhotos, setAllPhotos] = useState<PhotoDoc[]>([]);
  // placeGroupId がある場合は null (loading 中) → string[] に変化する
  // placeGroupId がない場合は undefined として扱い、フィルタをスキップする
  const [placeGroupPhotoIds, setPlaceGroupPhotoIds] = useState<string[] | null>(
    placeGroupId ? null : undefined as unknown as null
  );
  const [matchedGroup, setMatchedGroup] = useState<PlaceGroupDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIdx);

  const flatListRef = useRef<FlatList<PhotoDoc>>(null);
  const scrolled = useRef(false);

  // すべての note 写真を購読
  useEffect(() => {
    if (!noteId) return;
    const unsub = photoRepository.subscribePhotosByNoteId(
      noteId,
      (docs) => {
        setAllPhotos(docs);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setLoadError(true);
      }
    );
    return unsub;
  }, [noteId]);

  // placeGroupId がある場合はそのフローの photoIds + ラベルを購読
  useEffect(() => {
    if (!noteId || !placeGroupId) return;
    const unsub = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (groups) => {
        const group = groups.find((g) => g.id === placeGroupId);
        setPlaceGroupPhotoIds(group?.photoIds ?? []);
        setMatchedGroup(group ?? null);
      },
      () => setPlaceGroupPhotoIds([])
    );
    return unsub;
  }, [noteId, placeGroupId]);

  // 表示する写真リスト（UI-8 安全策: placeGroupPhotoIds が確定してからフィルタ）
  const photos: PhotoDoc[] =
    placeGroupId && placeGroupPhotoIds !== null && placeGroupPhotoIds !== (undefined as unknown as null)
      ? allPhotos.filter((p) => (placeGroupPhotoIds as string[]).includes(p.id))
      : allPhotos;

  // 初期インデックスへスクロール
  useEffect(() => {
    if (!loading && photos.length > 0 && !scrolled.current && initialIdx > 0) {
      const safeIdx = Math.min(initialIdx, photos.length - 1);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: safeIdx, animated: false });
        setCurrentIndex(safeIdx);
      }, 50);
      scrolled.current = true;
    }
  }, [loading, photos.length, initialIdx]);

  // ── 現在の写真とメタデータ ───────────────────────────────────────────────────

  const currentPhoto = photos[currentIndex] ?? null;
  const takenAtStr = currentPhoto?.takenAt ? formatTakenAt(currentPhoto.takenAt) : '';

  // placeGroupId モードのみ placeLabel / eventMemo を表示
  const placeLabel = matchedGroup
    ? (matchedGroup.userEditedLabel ?? matchedGroup.label ?? null)
    : null;
  const flowLabel =
    matchedGroup?.sortOrder != null ? `Flow ${matchedGroup.sortOrder + 1}` : null;
  const eventMemo = matchedGroup?.eventMemo ?? null;

  const hasMetadata = !!(takenAtStr || placeLabel || eventMemo);

  // ── ローディング ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={VIEWER_BG} />
        <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
      </View>
    );
  }

  // ── エラー ───────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={VIEWER_BG} />
        <SafeAreaView edges={['top']} style={styles.headerArea}>
          <View style={styles.headerRow}>
            <CloseButton />
            <View style={styles.closeArea} />
            <View style={styles.closeArea} />
          </View>
        </SafeAreaView>
        <Text style={styles.statusTxt}>写真の読み込みに失敗しました</Text>
      </View>
    );
  }

  // ── 空 ───────────────────────────────────────────────────────────────────────

  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={VIEWER_BG} />
        <SafeAreaView edges={['top']} style={styles.headerArea}>
          <View style={styles.headerRow}>
            <CloseButton />
            <View style={styles.closeArea} />
            <View style={styles.closeArea} />
          </View>
        </SafeAreaView>
        <Text style={styles.statusTxt}>写真がありません</Text>
      </View>
    );
  }

  // ── メイン ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={VIEWER_BG} />

      {/* 写真 FlatList（フルスクリーン） */}
      <FlatList
        ref={flatListRef}
        data={photos}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={Math.min(initialIdx, photos.length - 1)}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(Math.max(0, Math.min(idx, photos.length - 1)));
        }}
        renderItem={({ item }) => (
          <View style={styles.photoWrapper}>
            <Image
              source={{ uri: item.downloadURL }}
              style={styles.photo}
              resizeMode="contain"
            />
          </View>
        )}
      />

      {/* ヘッダーオーバーレイ：閉じるボタン + カウンター + Flow ラベル */}
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <CloseButton />
          <View style={styles.counterWrap}>
            <Text style={styles.counter}>{currentIndex + 1} / {photos.length}</Text>
            {flowLabel ? (
              <Text style={styles.flowSubLabel}>{flowLabel}</Text>
            ) : null}
          </View>
          {/* 右端スペーサー（カウンターを中央揃え） */}
          <View style={styles.closeArea} />
        </View>
      </SafeAreaView>

      {/* ボトムメタデータパネル：情報がある場合のみ表示 */}
      {hasMetadata ? (
        <SafeAreaView edges={['bottom']} style={styles.metaPanel}>
          {placeLabel ? (
            <Text style={styles.metaPlaceLabel} numberOfLines={1}>{placeLabel}</Text>
          ) : null}
          {takenAtStr ? (
            <Text style={styles.metaDate}>{takenAtStr}</Text>
          ) : null}
          {eventMemo ? (
            <Text style={styles.metaMemo} numberOfLines={3}>{eventMemo}</Text>
          ) : null}
        </SafeAreaView>
      ) : null}
    </View>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ローディング / エラー / 空 用コンテナ（中央揃え）
  container: {
    flex: 1,
    backgroundColor: VIEWER_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // メインビューア用コンテナ
  mainContainer: {
    flex: 1,
    backgroundColor: VIEWER_BG,
  },
  statusTxt: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
  },

  // ── 写真スライダー ──────────────────────────────────────────────────────────
  photoWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // ── ヘッダーオーバーレイ ────────────────────────────────────────────────────
  headerArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(15,14,13,0.48)',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  closeArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  counterWrap: {
    alignItems: 'center',
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: '#FFFFFF',
  },
  flowSubLabel: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    color: 'rgba(255,255,255,0.58)',
    marginTop: 2,
  },

  // ── ボトムメタデータパネル ──────────────────────────────────────────────────
  metaPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(15,14,13,0.60)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  metaPlaceLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metaDate: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 2,
  },
  metaMemo: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
  },
});
