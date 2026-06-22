// UI-2: MemoPanel — Edit画面のメモタブ
// 表示: memo multiline editor, aiDiary editor / readonly block, 文字数カウンター

import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import type { NoteEditDraft } from '@/features/memoryNotes/types/edit';

const MEMO_MAX = 1000;
const AI_DIARY_MAX = 500;

type MemoPanelProps = {
  draft: NoteEditDraft;
  updateField: <K extends keyof NoteEditDraft>(key: K, value: NoteEditDraft[K]) => void;
  hasAiDiary: boolean;
  isBusy: boolean;
};

export function MemoPanel({ draft, updateField, hasAiDiary, isBusy }: MemoPanelProps) {
  return (
    <View style={styles.container}>
      {/* メモ */}
      <View style={styles.field}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>メモ</Text>
          <Text style={styles.charCount}>
            {draft.memo.length}/{MEMO_MAX}
          </Text>
        </View>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={draft.memo}
          onChangeText={(v) => updateField('memo', v)}
          placeholder="メモを入力（任意）"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={6}
          maxLength={MEMO_MAX}
          textAlignVertical="top"
          editable={!isBusy}
        />
      </View>

      {/* AI日記 */}
      {hasAiDiary ? (
        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>AI日記</Text>
            <Text style={styles.charCount}>
              {draft.aiDiary.length}/{AI_DIARY_MAX}
            </Text>
          </View>
          <Text style={styles.fieldCaption}>内容を直接編集できます</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, styles.aiDiaryInput]}
            value={draft.aiDiary}
            onChangeText={(v) => updateField('aiDiary', v)}
            placeholder="AI日記を入力"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={8}
            maxLength={AI_DIARY_MAX}
            textAlignVertical="top"
            editable={!isBusy}
          />
        </View>
      ) : (
        <View style={styles.aiDiaryPending}>
          <Text style={styles.aiDiaryPendingEmoji}>✨</Text>
          <Text style={styles.aiDiaryPendingText}>
            AI日記がまだ生成されていません。{'\n'}
            ノート詳細画面から生成できます。
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 24,
  },
  field: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  charCount: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  fieldCaption: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: -2,
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
  inputMultiline: {
    minHeight: 120,
    paddingTop: 12,
  },
  aiDiaryInput: {
    minHeight: 160,
    lineHeight: 24,
  },
  aiDiaryPending: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  aiDiaryPendingEmoji: {
    fontSize: 28,
    opacity: 0.6,
  },
  aiDiaryPendingText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
