// UI-2: OverviewPanel — Edit画面の概要タブ
// 表示: カバー写真, タイトル入力, 共有設定, 日付表示
// UI-16: 「ノートの種類」→「共有設定」, ラベル変更, personal→shared に確認Alert

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import type { NoteDoc } from '@/core/repositories/noteRepository';
import type { PhotoDoc } from '@/core/repositories/photoRepository';
import type { NoteEditDraft } from '@/features/memoryNotes/types/edit';

function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

type OverviewPanelProps = {
  draft: NoteEditDraft;
  updateField: <K extends keyof NoteEditDraft>(key: K, value: NoteEditDraft[K]) => void;
  note: NoteDoc;
  photos: PhotoDoc[];
  isBusy: boolean;
  /** UI-16B: 現在のユーザーが owner かどうか */
  isOwner: boolean;
  /** UI-16B: personal → shared への移行（メンバー招待画面へ誘導） */
  onRequestShare: () => void;
  /** UI-16B: shared → personal への変換（owner のみ） */
  onConvertToPersonal: () => void;
};

export function OverviewPanel({
  draft,
  updateField,
  note,
  photos,
  isBusy,
  isOwner,
  onRequestShare,
  onConvertToPersonal,
}: OverviewPanelProps) {
  const coverPhoto = photos.find((p) => p.downloadURL === note.coverPhotoURL) ?? photos[0] ?? null;
  const dateStr = note.createdAt?.toDate ? formatDate(note.createdAt.toDate()) : null;

  // UI-16B: personal → shared はメンバー招待画面へ誘導（noteType は招待成功時に CF が更新）
  const handleRequestConvertToShared = () => {
    if (isBusy || draft.noteType === 'shared') return;
    Alert.alert(
      'このノートを共有しますか？',
      '共有ノートに変更すると、メンバーを招待できるようになります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '共有して招待する',
          onPress: () => onRequestShare(),
        },
      ]
    );
  };

  // UI-16B: shared → personal（owner のみ）
  const handleRequestConvertToPersonal = () => {
    if (isBusy || draft.noteType === 'personal' || !isOwner) return;
    Alert.alert(
      '個人ノートに戻しますか？',
      'メンバー全員がこのノートにアクセスできなくなります。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '個人に戻す',
          style: 'destructive',
          onPress: () => onConvertToPersonal(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* カバー写真 */}
      <View style={styles.coverSection}>
        <Text style={styles.fieldLabel}>カバー写真</Text>
        {coverPhoto ? (
          <View style={styles.coverPreview}>
            <Image
              source={{ uri: coverPhoto.downloadURL }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            <Text style={styles.coverHint}>
              写真タブで変更できます
            </Text>
          </View>
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverPlaceholderEmoji}>📷</Text>
            <Text style={styles.coverPlaceholderText}>
              写真タブからカバー写真を設定できます
            </Text>
          </View>
        )}
      </View>

      {/* タイトル */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>タイトル</Text>
        <TextInput
          style={styles.input}
          value={draft.title}
          onChangeText={(v) => updateField('title', v)}
          placeholder="タイトルを入力"
          placeholderTextColor={colors.textTertiary}
          maxLength={100}
          editable={!isBusy}
        />
      </View>

      {/* 日付 */}
      {dateStr ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>日付</Text>
          <View style={styles.readonlyRow}>
            <Text style={styles.readonlyText}>📅 {dateStr}</Text>
          </View>
        </View>
      ) : null}

      {/* UI-16: 共有設定 (旧: ノートの種類) */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>共有設定</Text>
        <View style={styles.noteTypeRow}>
          {/* 自分だけ (personal) */}
          <TouchableOpacity
            style={[
              styles.noteTypeButton,
              draft.noteType === 'personal' && styles.noteTypeButtonActive,
              // shared かつ非 owner は無効化
              draft.noteType === 'shared' && !isOwner && styles.noteTypeButtonDisabled,
            ]}
            onPress={handleRequestConvertToPersonal}
            disabled={isBusy || draft.noteType === 'personal' || (draft.noteType === 'shared' && !isOwner)}
            activeOpacity={draft.noteType === 'shared' && !isOwner ? 1 : 0.7}
          >
            <Text
              style={[
                styles.noteTypeButtonText,
                draft.noteType === 'personal' && styles.noteTypeButtonTextActive,
                draft.noteType === 'shared' && !isOwner && styles.noteTypeButtonTextDisabled,
              ]}
            >
              🔒 自分だけ
            </Text>
          </TouchableOpacity>

          {/* メンバーと共有 (shared) */}
          <TouchableOpacity
            style={[
              styles.noteTypeButton,
              draft.noteType === 'shared' && styles.noteTypeButtonActive,
            ]}
            onPress={handleRequestConvertToShared}
            disabled={isBusy}
          >
            <Text
              style={[
                styles.noteTypeButtonText,
                draft.noteType === 'shared' && styles.noteTypeButtonTextActive,
              ]}
            >
              👥 メンバーと共有
            </Text>
          </TouchableOpacity>
        </View>

        {/* shared のとき: owner は個人に戻せる、非 owner は案内のみ */}
        {draft.noteType === 'shared' && !isOwner ? (
          <Text style={styles.sharingCaption}>
            個人設定への変更はノートのオーナーのみ行えます
          </Text>
        ) : null}
      </View>

      {/* 写真枚数 */}
      {photos.length > 0 ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>写真</Text>
          <View style={styles.readonlyRow}>
            <Text style={styles.readonlyText}>📷 {photos.length}枚</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  coverSection: {
    gap: 6,
  },
  coverPreview: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    gap: 0,
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.xl,
  },
  coverHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 6,
    textAlign: 'center',
  },
  coverPlaceholder: {
    height: 100,
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coverPlaceholderEmoji: {
    fontSize: 28,
    opacity: 0.35,
  },
  coverPlaceholderText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  readonlyRow: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  readonlyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  noteTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  noteTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  noteTypeButtonDisabled: {
    opacity: 0.4,
  },
  noteTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  noteTypeButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  noteTypeButtonTextDisabled: {
    color: colors.textTertiary,
  },
  sharingCaption: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
    marginTop: 2,
  },
});
