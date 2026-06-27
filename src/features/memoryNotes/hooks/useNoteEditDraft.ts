// UI-2: useNoteEditDraft — Edit画面全体のdraft stateを一元管理するフック
//
// - note を useNoteDetail 経由でリアルタイム購読
// - draft を note から初期化（1回のみ）
// - isDirty で未保存変更を検出
// - saveDraft で noteRepository.updateNote を呼び出す
// - resetDraft でdraftをoriginalに戻す
// - coverPhotoURL更新は noteRepository.updateCoverPhoto で別途呼び出す（このhookの責任外）

import { useState, useEffect, useRef } from 'react';
import { useNoteDetail } from './useNoteDetail';
import { noteRepository } from '@/core/repositories/noteRepository';
import type { NoteDoc } from '@/core/repositories/noteRepository';
import type { NoteEditDraft } from '../types/edit';

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function noteToInitialDraft(note: NoteDoc): NoteEditDraft {
  // UI-26: memoryDate 優先。既存ノートは null → createdAt fallback は表示側で処理
  const memoryDate =
    note.memoryDate?.toDate?.() ??
    note.createdAt?.toDate?.() ??
    null;
  return {
    title: note.title,
    memo: note.memo ?? '',
    aiDiary: note.aiDiary ?? '',
    noteType: note.noteType,
    memoryDate,
  };
}

// ── 戻り値の型 ────────────────────────────────────────────────────────────────

export interface UseNoteEditDraftResult {
  note: NoteDoc | null;
  isLoadingNote: boolean;
  draft: NoteEditDraft | null;
  updateField: <K extends keyof NoteEditDraft>(key: K, value: NoteEditDraft[K]) => void;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  resetDraft: () => void;
  saveDraft: () => Promise<void>;
}

// ── フック ────────────────────────────────────────────────────────────────────

export function useNoteEditDraft(noteId: string | null): UseNoteEditDraftResult {
  const { note, isLoading: isLoadingNote } = useNoteDetail(noteId);

  const [draft, setDraft] = useState<NoteEditDraft | null>(null);
  const [original, setOriginal] = useState<NoteEditDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initialized = useRef(false);

  // noteId が変わったら初期化フラグをリセット
  useEffect(() => {
    initialized.current = false;
    setDraft(null);
    setOriginal(null);
    setSaveError(null);
  }, [noteId]);

  // noteが取得できたら1回だけdraftを初期化する
  useEffect(() => {
    if (note && !initialized.current) {
      const d = noteToInitialDraft(note);
      setDraft(d);
      setOriginal(d);
      initialized.current = true;
    }
  }, [note]);

  // isDirty: フィールドを1つずつ比較（JSON.stringifyは参照型に弱いためフィールド比較）
  // UI-26: memoryDate は Date 型なので getTime() で比較
  const isDirty =
    draft !== null &&
    original !== null &&
    (draft.title !== original.title ||
      draft.memo !== original.memo ||
      draft.aiDiary !== original.aiDiary ||
      draft.noteType !== original.noteType ||
      (draft.memoryDate?.getTime() ?? null) !== (original.memoryDate?.getTime() ?? null));

  function updateField<K extends keyof NoteEditDraft>(key: K, value: NoteEditDraft[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function resetDraft() {
    if (original) {
      setDraft({ ...original });
    }
  }

  async function saveDraft(): Promise<void> {
    if (!noteId || !draft || !note) return;
    if (!draft.title.trim()) {
      setSaveError('タイトルを入力してください');
      throw new Error('タイトルを入力してください');
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const hasAiDiary =
        note.aiDiaryStatus === 'completed' || note.aiDiaryStatus === 'edited';
      await noteRepository.updateNote(noteId, {
        title: draft.title,
        memo: draft.memo,
        noteType: draft.noteType,
        ...(hasAiDiary ? { aiDiary: draft.aiDiary } : {}),
        // UI-26: memoryDate を常に保存（null も含めて更新）
        memoryDate: draft.memoryDate,
      });
      // 保存成功後はoriginalを更新してisDirtyをfalseにする
      setOriginal({ ...draft });
    } catch {
      const msg = '保存に失敗しました。もう一度お試しください。';
      setSaveError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    note,
    isLoadingNote,
    draft,
    updateField,
    isDirty,
    isSaving,
    saveError,
    resetDraft,
    saveDraft,
  };
}
