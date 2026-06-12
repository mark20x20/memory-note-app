# Phase 10 Build Log — Note Detail / Edit / Delete

**Date:** 2026-06-12
**Status:** Completed

## 作業内容

### 新規作成ファイル

| ファイル | 概要 |
|---|---|
| `app/(app)/notes/[noteId]/index.tsx` | ノート詳細画面（[noteId].tsx から移行・編集ボタン追加） |
| `app/(app)/notes/[noteId]/edit.tsx` | ノート編集画面（タイトル・メモ・種別・AI日記・削除） |
| `src/features/memoryNotes/hooks/useUpdateNote.ts` | ノート更新フック |
| `src/features/memoryNotes/hooks/useDeleteNote.ts` | ノート削除フック（photos cleanup + Home 遷移） |
| `implementation_logs/phase10/build_log.md` | このファイル |
| `implementation_logs/phase10/decisions.md` | 設計決定記録 |
| `implementation_logs/phase10/issues.md` | 既知の問題・リスク |
| `implementation_logs/phase10/next_steps.md` | 次フェーズへの引き継ぎ |

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/core/repositories/noteRepository.ts` | NoteUpdateInput 型追加、updateNote / deleteNote 実装、aiDiaryStatus に 'edited' 追加 |
| `src/core/repositories/photoRepository.ts` | deletePhotosForNote 実装（Storage + Firestore 両方削除） |
| `src/features/memoryNotes/components/AiDiarySection.tsx` | 'edited' ステータスを 'completed' と同様に表示 |
| `firebase/storage.rules` | allow write → allow create, update に変更 + allow delete 追加 |
| `generated_ui/figma_make/reference_map.md` | SCR-NOTE-001 / SCR-NOTE-002 ステータス更新 |

### 削除ファイル

| ファイル | 理由 |
|---|---|
| `app/(app)/notes/[noteId].tsx` | `[noteId]/index.tsx` への nested route 移行のため |

### インストールパッケージ

なし（既存パッケージで対応）

## 確認コマンド結果

```
npx tsc --noEmit    → 通過（エラーなし）
npx expo lint       → 通過（エラーなし）
```
