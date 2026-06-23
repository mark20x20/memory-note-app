// Phase 11: useManageNoteMembers
// メンバー追加・ロール変更・削除の非同期状態管理フック。
// 実際の Firestore 書き込みは memberRepository（Cloud Functions 経由）で行う。

import { useState } from 'react';
import { memberRepository } from '@/core/repositories/memberRepository';
import type { MemberRole } from '@/core/repositories/noteRepository';

// ── 型定義 ───────────────────────────────────────────────────────────────────

export interface UseManageNoteMembersResult {
  addMember: (noteId: string, email: string, role: 'editor' | 'viewer') => Promise<void>;
  updateRole: (noteId: string, targetUid: string, role: 'editor' | 'viewer') => Promise<void>;
  removeMember: (noteId: string, targetUid: string) => Promise<void>;
  /** UI-15: 自分自身でノートから退出する。leaveNote Cloud Function を呼ぶ。 */
  leaveNote: (noteId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// Functions の HttpsError から日本語メッセージを生成する
function toUserMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) {
    // Firebase HttpsError は message にサーバー側のメッセージが入る
    return e.message || fallback;
  }
  return fallback;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useManageNoteMembers(): UseManageNoteMembersResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = async (
    noteId: string,
    email: string,
    role: Exclude<MemberRole, 'owner'>
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await memberRepository.addMemberByEmail(noteId, email, role);
    } catch (e) {
      const msg = toUserMessage(e, 'メンバーの追加に失敗しました。もう一度お試しください。');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (
    noteId: string,
    targetUid: string,
    role: Exclude<MemberRole, 'owner'>
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await memberRepository.updateMemberRole(noteId, targetUid, role);
    } catch (e) {
      const msg = toUserMessage(e, '権限の変更に失敗しました。もう一度お試しください。');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (noteId: string, targetUid: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await memberRepository.removeMember(noteId, targetUid);
    } catch (e) {
      const msg = toUserMessage(e, 'メンバーの削除に失敗しました。もう一度お試しください。');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // UI-15: 自分自身のノート退出。leaveNote Cloud Function を呼ぶ。
  const leaveNote = async (noteId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await memberRepository.leaveNote(noteId);
    } catch (e) {
      const msg = toUserMessage(e, 'ノートからの退出に失敗しました。もう一度お試しください。');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addMember,
    updateRole,
    removeMember,
    leaveNote,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
