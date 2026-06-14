// Phase 12.5G-5: 写真フルスクリーンビューア
// Route: /(app)/notes/[noteId]/photos/viewer?initialIndex=0&placeGroupId=xxx
//
// - 黒背景でフルスクリーン表示
// - 横スワイプ（FlatList pagingEnabled）で写真間を移動
// - 写真番号 / 合計枚数を表示
// - 撮影時刻があれば表示
// - 閉じるボタンで戻る
// - placeGroupId を渡すとそのフローの写真だけ表示

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

// ── 定数 ────────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// ── コンポーネント ────────────────────────────────────────────────────────────

export default function PhotoViewerScreen() {
  const { noteId, placeGroupId, initialIndex: initialIndexParam } = useLocalSearchParams<{
    noteId: string;
    placeGroupId?: string;
    initialIndex?: string;
  }>();

  const initialIdx = Math.max(0, parseInt(initialIndexParam ?? '0', 10) || 0);

  const [allPhotos, setAllPhotos] = useState<PhotoDoc[]>([]);
  const [placeGroupPhotoIds, setPlaceGroupPhotoIds] = useState<string[] | null>(
    placeGroupId ? null : undefined as unknown as null
  );
  const [loading, setLoading] = useState(true);
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
      () => setLoading(false)
    );
    return unsub;
  }, [noteId]);

  // placeGroupId がある場合はそのフローの photoIds を購読
  useEffect(() => {
    if (!noteId || !placeGroupId) return;
    const unsub = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (groups) => {
        const group = groups.find((g) => g.id === placeGroupId);
        setPlaceGroupPhotoIds(group?.photoIds ?? []);
      },
      () => setPlaceGroupPhotoIds([])
    );
    return unsub;
  }, [noteId, placeGroupId]);

  // 表示する写真リスト
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

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <SafeAreaView edges={['top']} style={styles.headerArea}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.emptyArea}>
          <Text style={styles.emptyTxt}>写真がありません</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ヘッダー（閉じるボタン + 枚数） */}
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>{currentIndex + 1} / {photos.length}</Text>
        {/* 右端のスペーサー（中央揃え用） */}
        <View style={styles.closeBtn} />
      </SafeAreaView>

      {/* 写真 FlatList */}
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
        renderItem={({ item }) => {
          const takenAtStr = item.takenAt ? formatTakenAt(item.takenAt) : '';
          return (
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: item.downloadURL }}
                style={styles.photo}
                resizeMode="contain"
              />
              {takenAtStr ? (
                <SafeAreaView edges={['bottom']} style={styles.photoFooter}>
                  <Text style={styles.takenAt}>{takenAtStr}</Text>
                </SafeAreaView>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

// ── スタイル ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  counter: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
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
  photoFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  takenAt: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  emptyArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTxt: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
});
