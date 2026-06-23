// UI-2: MemoPanel — Edit画面のメモタブ
// 表示: memo multiline editor, aiDiary editor / readonly block, 文字数カウンター
// UI-11: aiDiaryStatus ごとに UI を切り替え (idle/generating/failed/completed/edited)

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import type { NoteEditDraft } from '@/features/memoryNotes/types/edit';

const MEMO_MAX = 1000;
const AI_DIARY_MAX = 500;

type MemoPanelProps = {
  draft: NoteEditDraft;
  updateField: <K extends keyof NoteEditDraft>(key: K, value: NoteEditDraft[K]) => void;
  /** note.aiDiaryStatus: 'idle' | 'generating' | 'completed' | 'failed' | 'edited' | null */
  aiDiaryStatus: string | null | undefined;
  isBusy: boolean;
  /** AI日記生成ボタンを表示する場合の生成ハンドラ */
  onGenerateDiary?: () => void;
  /** Functions 呼び出し中フラグ (useGenerateDiary.isGenerating) */
  isGeneratingDiary?: boolean;
  /** Functions 呼び出しエラー (useGenerateDiary.error) */
  generateDiaryError?: string | null;
  /** 生成ボタンを表示するか (canGenerateAiDiary) */
  canGenerate?: boolean;
};

export function MemoPanel({
  draft,
  updateField,
  aiDiaryStatus,
  isBusy,
  onGenerateDiary,
  isGeneratingDiary,
  generateDiaryError,
  canGenerate,
}: MemoPanelProps) {
  const hasAiDiary = aiDiaryStatus === 'completed' || aiDiaryStatus === 'edited';
  const isGenerating = aiDiaryStatus === 'generating' || isGeneratingDiary;
  const isFailed = aiDiaryStatus === 'failed';

  return (
    <View style={styles.container}>
      {/* ── Section 1: メモ ── */}
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

      {/* ── Section 2: AI日記 ── */}
      {hasAiDiary ? (
        /* completed / edited — 編集可能 */
        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <View style={styles.aiDiaryLabelRow}>
              <Text style={styles.fieldLabel}>AI日記</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {aiDiaryStatus === 'edited' ? '編集済み' : '生成済み'}
                </Text>
              </View>
            </View>
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
      ) : isGenerating ? (
        /* generating — スピナー */
        <View style={styles.aiDiaryStateCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.aiDiaryStateTitle}>AI日記を生成中...</Text>
          <Text style={styles.aiDiaryStateBody}>
            しばらくお待ちください。完了すると自動的に表示されます。
          </Text>
        </View>
      ) : isFailed ? (
        /* failed — エラーカード + 再生成ボタン */
        <View style={[styles.aiDiaryStateCard, styles.aiDiaryFailedCard]}>
          <Text style={styles.aiDiaryStateEmoji}>⚠️</Text>
          <Text style={[styles.aiDiaryStateTitle, styles.aiDiaryFailedTitle]}>
            AI日記の生成に失敗しました
          </Text>
          <Text style={styles.aiDiaryStateBody}>
            ネットワーク環境を確認してから再度お試しください。
          </Text>
          {canGenerate && onGenerateDiary ? (
            <TouchableOpacity
              style={[styles.generateButton, (isBusy || isGeneratingDiary) && styles.generateButtonDisabled]}
              onPress={onGenerateDiary}
              disabled={isBusy || isGeneratingDiary}
              activeOpacity={0.8}
            >
              {isGeneratingDiary ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={styles.generateButtonText}>再生成する</Text>
              )}
            </TouchableOpacity>
          ) : null}
          {generateDiaryError ? (
            <Text style={styles.generateErrorText}>{generateDiaryError}</Text>
          ) : null}
        </View>
      ) : (
        /* idle / null / undefined — 未生成 */
        <View style={styles.aiDiaryStateCard}>
          <Text style={styles.aiDiaryStateEmoji}>✨</Text>
          <Text style={styles.aiDiaryStateTitle}>AI日記がまだ生成されていません</Text>
          <Text style={styles.aiDiaryStateBody}>
            旅の写真や訪れた場所をもとに、AI が日記を自動生成します。
          </Text>
          {canGenerate && onGenerateDiary ? (
            <TouchableOpacity
              style={[styles.generateButton, (isBusy || isGeneratingDiary) && styles.generateButtonDisabled]}
              onPress={onGenerateDiary}
              disabled={isBusy || isGeneratingDiary}
              activeOpacity={0.8}
            >
              {isGeneratingDiary ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={styles.generateButtonText}>AI日記を生成する</Text>
              )}
            </TouchableOpacity>
          ) : null}
          {generateDiaryError ? (
            <Text style={styles.generateErrorText}>{generateDiaryError}</Text>
          ) : null}
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
  aiDiaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
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
  // State cards (idle / generating / failed)
  aiDiaryStateCard: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  aiDiaryFailedCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  aiDiaryStateEmoji: {
    fontSize: 28,
    opacity: 0.7,
  },
  aiDiaryStateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  aiDiaryFailedTitle: {
    color: colors.error,
  },
  aiDiaryStateBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  generateButton: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: 24,
    paddingVertical: 11,
    minWidth: 160,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
  generateErrorText: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    marginTop: 4,
  },
});
