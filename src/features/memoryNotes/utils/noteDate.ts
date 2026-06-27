// UI-26: noteDate — ノートの「思い出の日付」取得・フォーマット用ユーティリティ
//
// 日付優先順位: memoryDate > createdAt > updatedAt
// 既存ノートは memoryDate がないため createdAt fallback で表示する。
//
// このファイルを変更することで、アプリ全体の日付表示ロジックを一元管理できる。

import type { NoteDoc } from '@/core/repositories/noteRepository';

/**
 * ノートから「思い出の日付」を返す。
 * memoryDate > createdAt > updatedAt の優先順位で取得する。
 * いずれもない場合は null を返す。
 */
export function getMemoryDate(note: NoteDoc): Date | null {
  if (note.memoryDate) {
    return note.memoryDate.toDate();
  }
  if (note.createdAt) {
    return note.createdAt.toDate();
  }
  if (note.updatedAt) {
    return note.updatedAt.toDate();
  }
  return null;
}

/**
 * ノートの日付を「YYYY年M月D日」形式でフォーマットして返す。
 * 日付がない場合は null を返す。
 */
export function formatMemoryDate(note: NoteDoc): string | null {
  const date = getMemoryDate(note);
  if (!date) return null;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * Date をローカルタイムで「YYYY-MM-DD」形式のキー文字列に変換する。
 * Calendar の日付 grouping に使用する。
 */
export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Date の「YYYY年M月D日」表示用フォーマット。
 */
export function formatDateLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 日付を n 日ずらした新しい Date を返す。
 */
export function addDays(date: Date, n: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + n);
  return result;
}
