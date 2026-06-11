import { useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useCreateNote } from '@/features/memoryNotes/hooks/useCreateNote';
import { usePhotoPicker } from '@/features/photos/hooks/usePhotoPicker';
import { usePhotoUpload } from '@/features/photos/hooks/usePhotoUpload';
import { noteRepository } from '@/core/repositories/noteRepository';
import { useAuth } from '@/core/auth/AuthContext';

const CREATION_STEPS = [
  {
    step: 1,
    emoji: '📷',
    title: '写真を選ぶ',
    description: 'カメラロールから複数枚選択。GPS情報があれば自動で地図に配置されます。',
  },
  {
    step: 2,
    emoji: '🤖',
    title: 'AIが整理する',
    description: '日付・場所・タイトルを自動生成。内容は後から編集できます。',
  },
  {
    step: 3,
    emoji: '📖',
    title: 'ノートが完成',
    description: '写真・地図・日記がひとまとめに。友達や家族と共有もできます。',
  },
] as const;

export default function CreateScreen() {
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const {
    title, setTitle,
    memo, setMemo,
    noteType, setNoteType,
    isSaving, error, saveNote,
  } = useCreateNote();

  const {
    photos,
    isPicking,
    error: photoError,
    pickPhotos,
    removePhoto,
  } = usePhotoPicker();

  const {
    isUploading,
    uploadProgress,
    error: uploadError,
    uploadPhotos,
    resetUploadState,
  } = usePhotoUpload();

  /** ノート作成済みの場合のID（アップロード失敗時のリカバリ用） */
  const [createdNoteId, setCreatedNoteId] = useState<string | null>(null);

  const hasPhotos = photos.length > 0;
  const isProcessing = isSaving || isUploading;

  async function handleSave() {
    if (!uid) return;
    resetUploadState();
    setCreatedNoteId(null);

    // Step 1: Firestore にノートを作成
    const noteId = await saveNote(uid);
    if (!noteId) return; // saveNote が error をセット済み

    setCreatedNoteId(noteId);

    // Step 2: 写真があればアップロード
    if (photos.length > 0) {
      const uploaded = await uploadPhotos({ uid, noteId, photos });

      if (uploaded && uploaded.length > 0) {
        // Step 3: ノートに代表写真URLと枚数を保存（失敗しても続行）
        try {
          await noteRepository.updateCoverPhoto(noteId, {
            coverPhotoURL: uploaded[0].downloadURL,
            photoCount: uploaded.length,
          });
        } catch {
          // 非クリティカル — Detail は表示できる
        }
      } else {
        // アップロード失敗: エラーUI を表示し、ユーザーが手動でナビゲート
        return;
      }
    }

    router.replace(`/(app)/notes/${noteId}`);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="新しい思い出を作る"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero (写真未選択時のみ) ── */}
        {!hasPhotos && (
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>📸</Text>
            <Text style={styles.heroTitle}>写真を選んで{'\n'}思い出ノートを作ろう</Text>
            <Text style={styles.heroDescription}>
              写真を選ぶだけで、日付・場所・AIコメント付きの思い出ノートが自動で作れます
            </Text>
          </View>
        )}

        {/* ── 3ステップカード (写真未選択時のみ) ── */}
        {!hasPhotos && (
          <View style={styles.stepsSection}>
            <Text style={styles.sectionLabel}>作成の流れ</Text>
            <View style={styles.stepsCard}>
              {CREATION_STEPS.map((item, index) => (
                <View key={item.step}>
                  <View style={styles.stepRow}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{item.step}</Text>
                    </View>
                    <Text style={styles.stepEmoji}>{item.emoji}</Text>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{item.title}</Text>
                      <Text style={styles.stepDescription}>{item.description}</Text>
                    </View>
                  </View>
                  {index < CREATION_STEPS.length - 1 && (
                    <View style={styles.stepConnector} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── 選択済み写真サムネイル ── */}
        {hasPhotos && (
          <View style={styles.selectedPhotosSection}>
            <View style={styles.photoCountRow}>
              <View style={styles.photoCountChip}>
                <Text style={styles.photoCountText}>📷 {photos.length}枚選択中</Text>
              </View>
            </View>
            <View style={styles.thumbnailScrollContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailList}
              >
                {photos.map((photo) => (
                  <View key={photo.id} style={styles.thumbnailWrapper}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removePhoto(photo.id)}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ── 写真選択ボタン ── */}
        <View style={styles.photoButtonSection}>
          <TouchableOpacity
            style={[styles.photoButton, isPicking && styles.photoButtonLoading]}
            onPress={pickPhotos}
            disabled={isPicking || isProcessing}
            activeOpacity={0.85}
          >
            {isPicking ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={styles.photoButtonText}>
                {hasPhotos ? '📷　写真を追加する' : '📷　写真を選ぶ'}
              </Text>
            )}
          </TouchableOpacity>
          {!hasPhotos && !photoError && (
            <Text style={styles.noPhotoHint}>写真を選ばずにタイトルだけでも保存できます</Text>
          )}
          {photoError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{photoError}</Text>
            </View>
          ) : null}
        </View>

        {/* ── ノート情報フォーム ── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>ノート情報</Text>
          <View style={styles.formCard}>
            {/* タイトル */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                タイトル <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="例：夏の思い出、カフェ巡り..."
                placeholderTextColor={colors.textTertiary}
                maxLength={100}
                returnKeyType="next"
                editable={!isProcessing}
              />
            </View>

            {/* メモ */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>メモ</Text>
              <TextInput
                style={[styles.textInput, styles.memoInput]}
                value={memo}
                onChangeText={setMemo}
                placeholder="思い出のメモを入力（省略可）"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                maxLength={1000}
                textAlignVertical="top"
                editable={!isProcessing}
              />
            </View>

            {/* ノート種別 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ノートの種類</Text>
              <View style={styles.noteTypesRow}>
                <NoteTypeCard
                  emoji="👤"
                  label="個人ノート"
                  desc="自分だけの記録"
                  active={noteType === 'personal'}
                  onPress={() => setNoteType('personal')}
                  disabled={isProcessing}
                />
                <NoteTypeCard
                  emoji="🤝"
                  label="共有ノート"
                  desc="Phase 11 以降"
                  active={noteType === 'shared'}
                  disabled
                  onPress={() => {}}
                />
              </View>
            </View>

            {/* フォームエラー */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── 保存 / アップロード進捗 ── */}
        <View style={styles.saveSection}>
          {isUploading ? (
            /* アップロード中: 進捗バー表示 */
            <View style={styles.uploadProgressSection}>
              <Text style={styles.uploadProgressLabel}>
                写真をアップロード中... {Math.round(uploadProgress)}%
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(uploadProgress)}%` },
                  ]}
                />
              </View>
            </View>
          ) : uploadError && createdNoteId ? (
            /* アップロード失敗（ノートは作成済み） */
            <View style={styles.uploadErrorSection}>
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  ノートは作成済みですが、写真の保存に失敗しました。{'\n'}
                  ノートページから確認してください。
                </Text>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => router.replace(`/(app)/notes/${createdNoteId}`)}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>ノートを確認する</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* 通常: 保存ボタン */
            <>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (isProcessing || !title.trim()) && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isProcessing || !title.trim()}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>ノートを作成する</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.saveNote}>
                {hasPhotos
                  ? `選択した${photos.length}枚の写真をノートに保存します`
                  : 'タイトルのみでノートを作成します'}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NoteTypeCard({
  emoji,
  label,
  desc,
  active,
  disabled,
  onPress,
}: {
  emoji: string;
  label: string;
  desc: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.noteTypeCard,
        active && styles.noteTypeCardActive,
        disabled && styles.noteTypeCardDimmed,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.noteTypeEmoji}>{emoji}</Text>
      <Text style={styles.noteTypeLabel}>{label}</Text>
      <Text style={styles.noteTypeDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 48,
  },
  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 28,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Steps
  stepsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceIvory,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepEmoji: {
    fontSize: 20,
    marginTop: -1,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  stepConnector: {
    width: 1.5,
    height: 10,
    backgroundColor: colors.border,
    marginLeft: 27,
  },
  // Selected photos
  selectedPhotosSection: {
    paddingTop: 24,
    paddingBottom: 8,
    gap: 12,
  },
  photoCountRow: {
    paddingHorizontal: 20,
  },
  photoCountChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  photoCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  thumbnailScrollContainer: {
    height: 100,
  },
  thumbnailList: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 88,
    height: 88,
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: colors.surfaceIvory,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: -1,
  },
  // Photo button
  photoButtonSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  photoButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  photoButtonLoading: {
    opacity: 0.75,
  },
  photoButtonText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  noPhotoHint: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Form
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  required: {
    color: colors.error,
  },
  textInput: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.textPrimary,
  },
  memoInput: {
    minHeight: 88,
    paddingTop: 11,
  },
  noteTypesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteTypeCard: {
    flex: 1,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 5,
  },
  noteTypeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  noteTypeCardDimmed: {
    opacity: 0.4,
  },
  noteTypeEmoji: {
    fontSize: 24,
  },
  noteTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noteTypeDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  // Save section
  saveSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  saveNote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Upload progress
  uploadProgressSection: {
    alignSelf: 'stretch',
    gap: 10,
  },
  uploadProgressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  // Upload error (note created but photos failed)
  uploadErrorSection: {
    alignSelf: 'stretch',
    gap: 12,
  },
});
