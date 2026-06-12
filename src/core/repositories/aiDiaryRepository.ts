// Phase 9: AI Diary Repository
// Cloud Functions の generateMemoryDiary Callable Function を呼び出す。
// OpenAI API キーはモバイル側には存在しない。すべて Functions 側で処理される。

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/core/firebase/client';

type GenerateMemoryDiaryRequest = {
  noteId: string;
};

type GenerateMemoryDiaryResponse = {
  success: boolean;
  aiDiary?: string;
  error?: string;
};

export const aiDiaryRepository = {
  /**
   * Cloud Functions の generateMemoryDiary を呼び出してAI日記を生成する。
   * 生成結果は Functions 側で Firestore に保存される。
   * モバイル側は onSnapshot で aiDiaryStatus の変化を受け取る。
   */
  async generateDiary(noteId: string): Promise<GenerateMemoryDiaryResponse> {
    if (!functions) {
      throw new Error('Firebase Functions not configured');
    }
    const fn = httpsCallable<GenerateMemoryDiaryRequest, GenerateMemoryDiaryResponse>(
      functions,
      'generateMemoryDiary'
    );
    const result = await fn({ noteId });
    return result.data;
  },
};
