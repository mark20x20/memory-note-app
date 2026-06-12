// Phase 9: AI日記セクションコンポーネント
// 4状態（idle / generating / completed / failed）に応じた UI を表示する。
// AI日記の生成失敗が他のセクション（写真・地図・メモ）に影響しないよう独立させる。
// Phase 11: canRegenerate prop を追加。viewer は再生成ボタンを表示しない。

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { colors } from '@/shared/theme/colors';
import type { NoteDoc } from '@/core/repositories/noteRepository';
import { useGenerateDiary } from '@/features/memoryNotes/hooks/useGenerateDiary';

// ────────────────────────────────────────────────────────────────────────────

type Props = {
  noteId: string;
  note: NoteDoc;
  /** Phase 11: false のとき生成・再生成ボタンを非表示にする（viewer 向け）。デフォルト true。 */
  canRegenerate?: boolean;
};

function formatTimestamp(ts: Timestamp | null | undefined): string | null {
  if (!ts || !(ts instanceof Timestamp)) return null;
  const d = ts.toDate();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ────────────────────────────────────────────────────────────────────────────

export function AiDiarySection({ noteId, note, canRegenerate = true }: Props) {
  const { generate, isGenerating } = useGenerateDiary();

  // フィールドなし / null / undefined は 'idle' として扱う
  const status = note.aiDiaryStatus ?? 'idle';

  const handleGenerate = () => {
    generate(noteId);
  };

  // ── 生成中 ─────────────────────────────────────────────────────────────────
  if (status === 'generating') {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary} size="small" style={styles.spinner} />
        <Text style={styles.generatingText}>AI日記を生成中...</Text>
        <Text style={styles.generatingSubtext}>しばらくお待ちください</Text>
      </View>
    );
  }

  // ── 生成成功 / 手動編集済み ────────────────────────────────────────────────────
  if ((status === 'completed' || status === 'edited') && note.aiDiary) {
    const dateStr = formatTimestamp(note.aiDiaryGeneratedAt ?? null);
    return (
      <View>
        <View style={styles.card}>
          <Text style={styles.diaryText}>{note.aiDiary}</Text>
        </View>
        {canRegenerate ? (
          <View style={styles.completedFooter}>
            {dateStr ? (
              <Text style={styles.generatedDate}>生成日: {dateStr}</Text>
            ) : (
              <View />
            )}
            <TouchableOpacity
              style={[styles.regenerateButton, isGenerating && styles.buttonDisabled]}
              onPress={handleGenerate}
              disabled={isGenerating}
              hitSlop={8}
            >
              <Text style={styles.regenerateButtonText}>
                {isGenerating ? '生成中...' : '再生成'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          dateStr ? (
            <View style={styles.completedFooter}>
              <Text style={styles.generatedDate}>生成日: {dateStr}</Text>
            </View>
          ) : null
        )}
      </View>
    );
  }

  // ── 生成失敗 ───────────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <View>
        <View style={[styles.card, styles.failedCard]}>
          <Text style={styles.failedEmoji}>⚠️</Text>
          <Text style={styles.failedText}>AI日記の生成に失敗しました</Text>
          <Text style={styles.failedSubtext}>
            {note.aiDiaryError ?? 'もう一度お試しください。'}
          </Text>
        </View>
        {canRegenerate ? (
          <TouchableOpacity
            style={[styles.retryButton, isGenerating && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            <Text style={styles.retryButtonText}>
              {isGenerating ? '生成中...' : '再試行'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  // ── idle（未生成）────────────────────────────────────────────────────────────
  if (!canRegenerate) {
    // viewer: 生成ボタンは表示しない
    return (
      <View style={styles.card}>
        <Text style={styles.idleDescription}>
          AIが写真・場所・日付から{'\n'}短い思い出日記を生成できます。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.idleDescription}>
        AIが写真・場所・日付から{'\n'}短い思い出日記を生成します。
      </Text>
      <TouchableOpacity
        style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={isGenerating}
      >
        <Text style={styles.generateButtonText}>
          {isGenerating ? '生成中...' : '✨ AI日記を生成する'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // 共通カード
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  failedCard: {
    borderColor: colors.error,
    borderWidth: 1,
    backgroundColor: '#FEF2F2',
  },

  // Generating state
  spinner: {
    marginBottom: 2,
  },
  generatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  generatingSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // Completed state
  diaryText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 26,
    textAlign: 'left',
    width: '100%',
  },
  completedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  generatedDate: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  regenerateButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  regenerateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Failed state
  failedEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  failedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
  },
  failedSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Idle state
  idleDescription: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  generateButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },

  // 無効状態
  buttonDisabled: {
    opacity: 0.5,
  },
});
