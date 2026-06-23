// Phase 11: Member Repository
// Cloud Functions callable 経由でノートメンバーを管理する。
// クライアントから Firestore の members フィールドを直接変更しない。
// Functions 側で owner 権限確認・バリデーション・Firestore 更新を行う。

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/core/firebase/client';
import type { MemberRole } from '@/core/repositories/noteRepository';

// ── 型定義 ───────────────────────────────────────────────────────────────────

type AddMemberRequest = {
  noteId: string;
  email: string;
  role: 'editor' | 'viewer';
};

type AddMemberResponse = {
  success: boolean;
  uid: string;
  displayName: string;
};

type UpdateRoleRequest = {
  noteId: string;
  targetUid: string;
  role: 'editor' | 'viewer';
};

type UpdateRoleResponse = {
  success: boolean;
};

type RemoveMemberRequest = {
  noteId: string;
  targetUid: string;
};

type RemoveMemberResponse = {
  success: boolean;
};

// ── Repository ────────────────────────────────────────────────────────────────

export const memberRepository = {
  /**
   * メールアドレスでユーザーを検索してノートのメンバーに追加する。
   * 実行者が owner であることは Functions 側で確認する。
   * role は 'editor' または 'viewer' のみ指定可能（owner は追加不可）。
   */
  async addMemberByEmail(
    noteId: string,
    email: string,
    role: 'editor' | 'viewer'
  ): Promise<AddMemberResponse> {
    if (!functions) throw new Error('Firebase Functions not configured');
    const fn = httpsCallable<AddMemberRequest, AddMemberResponse>(
      functions,
      'addNoteMemberByEmail'
    );
    const result = await fn({ noteId, email: email.trim().toLowerCase(), role });
    return result.data;
  },

  /**
   * メンバーのロールを変更する。
   * 実行者が owner であることは Functions 側で確認する。
   * owner 自身のロール変更は Functions 側で拒否する。
   */
  async updateMemberRole(
    noteId: string,
    targetUid: string,
    role: 'editor' | 'viewer'
  ): Promise<void> {
    if (!functions) throw new Error('Firebase Functions not configured');
    const fn = httpsCallable<UpdateRoleRequest, UpdateRoleResponse>(
      functions,
      'updateNoteMemberRole'
    );
    await fn({ noteId, targetUid, role });
  },

  /**
   * メンバーをノートから削除する。
   * 実行者が owner であることは Functions 側で確認する。
   * owner 自身の削除は Functions 側で拒否する。
   */
  async removeMember(noteId: string, targetUid: string): Promise<void> {
    if (!functions) throw new Error('Firebase Functions not configured');
    const fn = httpsCallable<RemoveMemberRequest, RemoveMemberResponse>(
      functions,
      'removeNoteMember'
    );
    await fn({ noteId, targetUid });
  },

  /**
   * UI-15: 自分自身でノートから退出する。
   * editor / viewer が自分の uid のみを members から削除する。
   * owner は Functions 側で拒否される。
   */
  async leaveNote(noteId: string): Promise<void> {
    if (!functions) throw new Error('Firebase Functions not configured');
    const fn = httpsCallable<{ noteId: string }, { success: boolean }>(
      functions,
      'leaveNote'
    );
    await fn({ noteId });
  },

  /**
   * UI-16B: 共有ノートを個人ノートに戻す。
   * owner のみ実行可能。非 owner メンバーを全員削除し noteType を 'personal' に変更する。
   * Functions 側で owner 権限確認・メンバー削除・noteType 更新を行う。
   */
  async convertToPersonal(noteId: string): Promise<void> {
    if (!functions) throw new Error('Firebase Functions not configured');
    const fn = httpsCallable<{ noteId: string }, { success: boolean; removedCount: number }>(
      functions,
      'convertNoteToPersonal'
    );
    await fn({ noteId });
  },
} satisfies {
  addMemberByEmail: (noteId: string, email: string, role: Exclude<MemberRole, 'owner'>) => Promise<AddMemberResponse>;
  updateMemberRole: (noteId: string, targetUid: string, role: Exclude<MemberRole, 'owner'>) => Promise<void>;
  removeMember: (noteId: string, targetUid: string) => Promise<void>;
  leaveNote: (noteId: string) => Promise<void>;
  convertToPersonal: (noteId: string) => Promise<void>;
};
