// Phase 11: Permission helpers for note-level role-based access control.
// Uses the NoteDoc.members map to determine what the current user can do.
// All functions are pure — no side effects, no hooks.

import type { NoteDoc, MemberRole } from '@/core/repositories/noteRepository';

/** ノートにおける現在のユーザーのロールを返す。メンバーでない場合は null。 */
export function getCurrentUserRole(note: NoteDoc, uid: string): MemberRole | null {
  if (!note.members) return null;
  return note.members[uid] ?? null;
}

/** ノートを閲覧できるか（owner / editor / viewer） */
export function canView(note: NoteDoc, uid: string): boolean {
  return getCurrentUserRole(note, uid) !== null;
}

/** ノートを編集できるか（owner / editor） */
export function canEdit(note: NoteDoc, uid: string): boolean {
  const role = getCurrentUserRole(note, uid);
  return role === 'owner' || role === 'editor';
}

/** メンバーを管理できるか（owner のみ） */
export function canManageMembers(note: NoteDoc, uid: string): boolean {
  return getCurrentUserRole(note, uid) === 'owner';
}

/** ノートを削除できるか（owner のみ） */
export function canDelete(note: NoteDoc, uid: string): boolean {
  return getCurrentUserRole(note, uid) === 'owner';
}

/** AI日記の生成・再生成ができるか（owner / editor） */
export function canGenerateAiDiary(note: NoteDoc, uid: string): boolean {
  const role = getCurrentUserRole(note, uid);
  return role === 'owner' || role === 'editor';
}
