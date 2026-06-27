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
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { formatDateLabel, addDays } from '@/features/memoryNotes/utils/noteDate';
import { useCreateNote } from '@/features/memoryNotes/hooks/useCreateNote';
import { usePhotoPicker } from '@/features/photos/hooks/usePhotoPicker';
import { usePhotoUpload } from '@/features/photos/hooks/usePhotoUpload';
import { noteRepository } from '@/core/repositories/noteRepository';
import { useAuth } from '@/core/auth/AuthContext';

const AUTO_ORGANIZE_ITEMS = [
  {
    emoji: '🗺️',
    title: '場所と流れを整理',
    desc: '写真のGPS情報から、その日の動きを自動で並べます',
  },
  {
    emoji: '✏️',
    title: 'AI日記の下書き',
    desc: '写真とメモをもとに、自然な日記の下書きを作ります',
  },
  {
    emoji: '📤',
    title: '共有カードを作成',
    desc: '思い出を友達や家族と美しいカードでシェアできます',
  },
] as const;

export default function CreateScreen() {
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const {
    title, setTitle,
    memo, setMemo,
    noteType, setNoteType,
    memoryDate, setMemoryDate,
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

  const [createdNoteId, setCreatedNoteId] = useState<string | null>(null);

  const hasPhotos = photos.length > 0;
  const isProcessing = isSaving || isUploading;
  const canCreate = !!title.trim() && !isProcessing;

  async function handleSave() {
    if (!uid) return;
    resetUploadState();
    setCreatedNoteId(null);

    const noteId = await saveNote(uid);
    if (!noteId) return;

    setCreatedNoteId(noteId);

    if (photos.length > 0) {
      const uploaded = await uploadPhotos({ uid, noteId, photos });

      if (uploaded && uploaded.length > 0) {
        try {
          await noteRepository.updateCoverPhoto(noteId, {
            coverPhotoURL: uploaded[0].downloadURL,
            photoCount: uploaded.length,
          });
        } catch {
          // non-critical
        }
      } else {
        return;
      }
    }

    router.replace(`/(app)/notes/${noteId}`);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Warm custom header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="戻る"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>思い出ノートを作る</Text>
          <Text style={styles.headerSubtitle}>
            写真を選ぶだけで、場所・流れ・日記をまとめます
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Photo Hero Card ── */}
        <View style={styles.photoSection}>
          {hasPhotos ? (
            /* Photos selected: featured cover + strip */
            <View style={styles.photoCoverCard}>
              {/* Featured first photo */}
              <View style={styles.photoCoverWrap}>
                <Image
                  source={{ uri: photos[0].uri }}
                  style={styles.photoCoverImage}
                  resizeMode="cover"
                />
                {/* Count badge */}
                <View style={styles.photoCountBadge}>
                  <Text style={styles.photoCountBadgeText}>
                    📷 {photos.length}枚選択中
                  </Text>
                </View>
              </View>

              {/* Remaining photos strip */}
              {photos.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoStrip}
                >
                  {photos.slice(1).map((photo) => (
                    <View key={photo.id} style={styles.photoStripItem}>
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.photoStripImage}
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
              )}

              {/* Add more photos button */}
              <View style={styles.photoAddButtonWrap}>
                <TouchableOpacity
                  style={[
                    styles.photoAddButton,
                    (isPicking || isProcessing) && styles.photoButtonDisabled,
                  ]}
                  onPress={pickPhotos}
                  disabled={isPicking || isProcessing}
                  activeOpacity={0.85}
                >
                  {isPicking ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Text style={styles.photoAddButtonText}>＋ 写真を追加する</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* No photos: large tappable hero card */
            <TouchableOpacity
              style={[
                styles.photoEmptyCard,
                (isPicking || isProcessing) && styles.photoButtonDisabled,
              ]}
              onPress={pickPhotos}
              disabled={isPicking || isProcessing}
              activeOpacity={0.88}
            >
              {isPicking ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : (
                <>
                  <View style={styles.photoEmptyIconWrap}>
                    <Text style={styles.photoEmptyIcon}>📷</Text>
                  </View>
                  <Text style={styles.photoEmptyTitle}>写真を選ぶ</Text>
                  <Text style={styles.photoEmptyHelper}>
                    複数枚まとめて追加できます
                  </Text>
                  <View style={styles.photoEmptyButton}>
                    <Text style={styles.photoEmptyButtonText}>
                      カメラロールから選ぶ
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Photo error */}
          {photoError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{photoError}</Text>
            </View>
          ) : null}

          {!hasPhotos && !photoError && (
            <Text style={styles.photoSkipHint}>
              写真なしでタイトルだけでも保存できます
            </Text>
          )}
        </View>

        {/* ── Auto Organize Preview ── */}
        <View style={styles.autoOrganizeSection}>
          <Text style={styles.sectionLabel}>作成後に自動で整理されます</Text>
          <View style={styles.autoOrganizeCard}>
            {AUTO_ORGANIZE_ITEMS.map((item, index) => (
              <View key={item.title}>
                <View style={styles.autoOrganizeRow}>
                  <View style={styles.autoOrganizeIconWrap}>
                    <Text style={styles.autoOrganizeEmoji}>{item.emoji}</Text>
                  </View>
                  <View style={styles.autoOrganizeText}>
                    <Text style={styles.autoOrganizeTitle}>{item.title}</Text>
                    <Text style={styles.autoOrganizeDesc}>{item.desc}</Text>
                  </View>
                </View>
                {index < AUTO_ORGANIZE_ITEMS.length - 1 && (
                  <View style={styles.autoOrganizeDivider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Basic info form ── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>ノートの情報</Text>
          <View style={styles.formCard}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>タイトル</Text>
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

            {/* Memo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>メモ（省略可）</Text>
              <TextInput
                style={[styles.textInput, styles.memoInput]}
                value={memo}
                onChangeText={setMemo}
                placeholder="思い出のメモを自由に書いてください"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                maxLength={1000}
                textAlignVertical="top"
                editable={!isProcessing}
              />
            </View>

            {/* Memory Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>思い出の日付</Text>
              <View style={styles.dateSelector}>
                <TouchableOpacity
                  style={styles.dateStepper}
                  onPress={() => setMemoryDate(addDays(memoryDate, -1))}
                  disabled={isProcessing}
                  hitSlop={8}
                >
                  <Text style={styles.dateStepperText}>‹</Text>
                </TouchableOpacity>
                <View style={styles.dateLabelWrap}>
                  <Text style={styles.dateLabelText}>{formatDateLabel(memoryDate)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.dateStepper}
                  onPress={() => setMemoryDate(addDays(memoryDate, 1))}
                  disabled={isProcessing}
                  hitSlop={8}
                >
                  <Text style={styles.dateStepperText}>›</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  setMemoryDate(today);
                }}
                disabled={isProcessing}
                hitSlop={8}
              >
                <Text style={styles.dateTodayLink}>今日に設定</Text>
              </TouchableOpacity>
            </View>

            {/* Note type */}
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
                  desc="ノート作成後に設定"
                  active={noteType === 'shared'}
                  disabled
                  onPress={() => {}}
                />
              </View>
            </View>

            {/* Form error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Save / progress section ── */}
        <View style={styles.saveSection}>
          {isSaving ? (
            /* Note creation in progress */
            <View style={styles.creatingContainer}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.creatingText}>
                思い出ノートを作成しています...
              </Text>
            </View>
          ) : isUploading ? (
            /* Photo upload in progress */
            <View style={styles.uploadProgressSection}>
              <Text style={styles.uploadProgressLabel}>
                写真をアップロードしています... {Math.round(uploadProgress)}%
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(uploadProgress)}%` as `${number}%` },
                  ]}
                />
              </View>
            </View>
          ) : uploadError && createdNoteId ? (
            /* Upload failed but note was created */
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
            /* Normal: create button */
            <>
              <TouchableOpacity
                style={[styles.saveButton, !canCreate && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!canCreate}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>思い出ノートを作成</Text>
              </TouchableOpacity>
              <Text style={styles.saveNote}>
                {!title.trim()
                  ? 'タイトルを入力するとノートを作成できます'
                  : hasPhotos
                    ? `${photos.length}枚の写真とともに思い出を保存します`
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

  // ── Header ──────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    flexShrink: 0,
  },

  // ── Scroll ──────────────────────────────────────
  scroll: {
    paddingBottom: 48,
  },

  // ── Photo section ──────────────────────────────────────
  photoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },

  // No photos: large tappable card
  photoEmptyCard: {
    height: 220,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  photoEmptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  photoEmptyIcon: {
    fontSize: 36,
  },
  photoEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  photoEmptyHelper: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  photoEmptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  photoEmptyButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  photoButtonDisabled: {
    opacity: 0.6,
  },

  // Photos selected: cover card
  photoCoverCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photoCoverWrap: {
    height: 200,
    position: 'relative',
  },
  photoCoverImage: {
    width: '100%',
    height: '100%',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoCountBadgeText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '600',
  },
  photoStrip: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  photoStripItem: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  photoStripImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.surfaceIvory,
  },
  removeButton: {
    position: 'absolute',
    top: 3,
    right: 3,
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
  photoAddButtonWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  photoAddButton: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  photoSkipHint: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // ── Auto organize ──────────────────────────────────────
  autoOrganizeSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  autoOrganizeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  autoOrganizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  autoOrganizeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  autoOrganizeEmoji: {
    fontSize: 20,
  },
  autoOrganizeText: {
    flex: 1,
  },
  autoOrganizeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  autoOrganizeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  autoOrganizeDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },

  // ── Form ──────────────────────────────────────
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
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
  // UI-26: Date selector
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dateStepper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStepperText: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  dateLabelWrap: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  dateLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  dateTodayLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
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

  // ── Error ──────────────────────────────────────
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

  // ── Save section ──────────────────────────────────────
  saveSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 10,
    alignItems: 'center',
  },
  creatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  creatingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
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
  uploadErrorSection: {
    alignSelf: 'stretch',
    gap: 12,
  },
});
