# UI-26 memoryDate 実装 — ビルドログ

## 日付
2026-06-28

## 概要
`NoteDoc` に `memoryDate?: Timestamp | null` を追加。
新規ノート作成時・Edit 保存時に memoryDate を Firestore に書き込む。
Calendar / Preview / Home の日付表示を memoryDate 優先に変更。
既存ノートは createdAt fallback で壊れない。

## 新規作成ファイル
- `src/features/memoryNotes/utils/noteDate.ts` — 日付取得・フォーマット ユーティリティ

## 変更ファイル
- `src/core/repositories/noteRepository.ts` — NoteDoc / NoteInput / NoteUpdateInput に memoryDate 追加
- `src/features/memoryNotes/types/edit.ts` — NoteEditDraft に memoryDate: Date | null 追加
- `src/features/memoryNotes/hooks/useCreateNote.ts` — memoryDate state + setMemoryDate + saveNote に渡す
- `src/features/memoryNotes/hooks/useNoteEditDraft.ts` — noteToInitialDraft / isDirty / saveDraft に memoryDate 追加
- `src/features/memoryNotes/components/edit/panels/OverviewPanel.tsx` — 日付編集 UI（date selector）追加
- `app/(app)/create/index.tsx` — date selector UI 追加
- `app/(app)/calendar.tsx` — noteToDateKey を getMemoryDate に変更
- `app/(app)/notes/[noteId]/preview.tsx` — dateStr を formatMemoryDate に変更
- `app/(app)/home.tsx` — dateStr を formatMemoryDate に変更

## 変更しなかったもの
- `firebase/firestore.rules` — update 条件は ownerId / members 変更禁止のみで、フィールド追加は許可されている
- `firebase/firestore.indexes.json` — 月単位クエリ化は別タスク
- `package.json` — 外部 date picker ライブラリ追加なし

## 実行コマンド結果

### `npx tsc --noEmit`
Exit 0（エラーなし）

### `npx expo lint`
Exit 0（エラーなし）

## git diff --stat
```
app/(app)/calendar.tsx                             | 14 ++--
app/(app)/create/index.tsx                         | 80 ++++++++++++++++++++
app/(app)/home.tsx                                 |  8 +-
app/(app)/notes/[noteId]/preview.tsx               |  8 +-
src/core/repositories/noteRepository.ts            | 16 ++++
.../components/edit/panels/OverviewPanel.tsx       | 88 ++++++++++++++++++++--
src/features/memoryNotes/hooks/useCreateNote.ts    | 13 +++-
src/features/memoryNotes/hooks/useNoteEditDraft.ts | 12 ++-
src/features/memoryNotes/types/edit.ts             |  3 +
9 files changed, 216 insertions(+), 26 deletions(-)
```
