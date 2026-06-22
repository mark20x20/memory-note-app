// UI-2: PhotosPanel — Edit画面の写真タブ
// 表示: 写真グリッド, カバー写真バッジ, 写真タップでviewer遷移, カバーに設定ボタン
// 並び替え: UI-3以降

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { noteRepository } from '@/core/repositories/noteRepository';
import type { PhotoDoc } from '@/core/repositories/photoRepository';
import type { NoteDoc } from '@/core/repositories/noteRepository';

type PhotosPanelProps = {
  noteId: string;
  photos: PhotoDoc[];
  photosLoading: boolean;
  note: NoteDoc;
  isBusy: boolean;
};

export function PhotosPanel({
  noteId,
  photos,
  photosLoading,
  note,
  isBusy,
}: PhotosPanelProps) {
  async function handleSetCover(photo: PhotoDoc) {
    try {
      await noteRepository.updateCoverPhoto(noteId, {
        coverPhotoURL: photo.downloadURL,
        photoCount: note.photoCount ?? photos.length,
      });
      Alert.alert('設定しました', 'カバー写真を変更しました。');
    } catch {
      Alert.alert('エラー', 'カバー写真の設定に失敗しました。');
    }
  }

  if (photosLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>写真を読み込み中...</Text>
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📷</Text>
        <Text style={styles.emptyTitle}>写真がありません</Text>
        <Text style={styles.emptyDesc}>
          新規ノート作成時に写真を追加できます。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.photoCount}>{photos.length}枚</Text>
        <Text style={styles.photoHint}>タップで拡大 · カバーに設定可</Text>
      </View>
      <View style={styles.grid}>
        {photos.map((photo, idx) => {
          const isCover = photo.downloadURL === note.coverPhotoURL;
          return (
            <View key={photo.id} style={styles.gridItem}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push(
                    `/(app)/notes/${noteId}/photos/viewer?initialIndex=${idx}` as any
                  )
                }
              >
                <Image
                  source={{ uri: photo.downloadURL }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
                {isCover ? (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>カバー</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              {!isCover ? (
                <TouchableOpacity
                  style={[styles.setCoverButton, isBusy && styles.buttonDisabled]}
                  onPress={() => handleSetCover(photo)}
                  disabled={isBusy}
                >
                  <Text style={styles.setCoverButtonText}>カバーに設定</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </View>
      <Text style={styles.reorderHint}>
        並び替えはUI-3で実装予定です。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  photoCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  photoHint: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '31%',
    gap: 4,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceIvory,
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  coverBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
  setCoverButton: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    alignItems: 'center',
  },
  setCoverButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  reorderHint: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  // Loading / Empty
  centered: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 36,
    opacity: 0.35,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
