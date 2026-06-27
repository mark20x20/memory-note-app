# UI-24 Calendar Screen Polish — ビルドログ

## 日付
2026-06-28

## 概要
`app/(app)/calendar.tsx` を新規作成。
カレンダーはカスタムグリッドで実装（外部ライブラリ追加なし）。
既存の `useMemoryNotesList` / `NoteDoc` を使用してノートを日付別に表示。
日付キーは `note.createdAt`（NoteDoc に memoryDate フィールドなし）。

## 変更ファイル
- `app/(app)/calendar.tsx` — 新規作成

## 参照したUI資料
- `generated_ui/CodexPlan/screen_specs/05_calendar_screen.md`
- `generated_ui/CodexPlan/01_ui_foundation.md`

## 参照した実装ログ
- `implementation_logs/ui23_settings_screen_polish/decisions.md` — カスタムヘッダーパターン
- `implementation_logs/ui19_home_screen_polish/` — NoteCard デザイン参考

## 参照したコード
- `src/features/memoryNotes/hooks/useMemoryNotesList.ts` — notes 購読
- `src/core/repositories/noteRepository.ts` — NoteDoc 型確認
- `src/shared/theme/colors.ts` / `spacing.ts` — カラー・border radius

## 実行コマンド結果

### `npx tsc --noEmit`
Exit 0（エラーなし）

### `npx expo lint`
Exit 0（エラーなし）

## git status（実装後）
```
?? app/(app)/calendar.tsx
?? implementation_logs/ui24_calendar_screen_polish/
```
