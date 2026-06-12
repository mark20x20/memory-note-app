// Phase 9: useGenerateDiary — AI日記生成フック
// Cloud Functions の generateMemoryDiary Callable Function を呼び出す。
// 生成中の UI ローディング状態と呼び出しエラーを管理する。

import { useState } from 'react';
import { aiDiaryRepository } from '@/core/repositories/aiDiaryRepository';

export interface UseGenerateDiaryResult {
  /** AI日記生成を開始する。生成ステータスは Firestore 経由で useNoteDetail に反映される */
  generate: (noteId: string) => Promise<void>;
  /** Functions呼び出し中（ネットワーク送信中）の状態 */
  isGenerating: boolean;
  /** Functions 呼び出し失敗時のエラーメッセージ（ユーザー向け） */
  error: string | null;
}

/**
 * AI日記生成フック。
 *
 * - generate() を呼ぶと Cloud Functions が起動し、Firestore の aiDiaryStatus が
 *   'generating' → 'completed' / 'failed' へと変化する。
 * - この変化は useNoteDetail の onSnapshot で自動的に Detail 画面へ反映される。
 * - isGenerating はあくまで「Functions 呼び出し中」の状態であり、
 *   Firestore の aiDiaryStatus とは独立している。
 */
export function useGenerateDiary(): UseGenerateDiaryResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (noteId: string): Promise<void> => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      await aiDiaryRepository.generateDiary(noteId);
    } catch {
      setError('AI日記の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, error };
}
