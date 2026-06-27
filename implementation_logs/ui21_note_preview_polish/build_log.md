# UI-21 Note Detail / Preview Screen Polish — ビルドログ

## 日付
2026-06-27

## 概要
`app/(app)/notes/[noteId]/preview.tsx` を warm / photo-first な思い出閲覧画面にリライト。
既存のロジック・hooks・VisitTimelineSection・EventMapPreview・共有UX（UI-16B）は一切変更せず、
UIレイアウト・セクション構成・空状態を刷新した。

## 変更ファイル
- `app/(app)/notes/[noteId]/preview.tsx` — 全面リライト（ロジックは維持）

## 参照したUI資料
- `generated_ui/CodexPlan/screen_specs/03_memory_detail_screen.md`
- `generated_ui/CodexPlan/screen_specs/07_memory_preview_screen.md`
- `generated_ui/CodexPlan/01_ui_foundation.md`

## 参照した実装ログ
- `implementation_logs/ui16b_sharing_mode_semantics/` — 共有UX維持確認
- `implementation_logs/ui7_preview_default_integration/` — Navigation確認

## 参照したコード
- `src/features/memoryNotes/hooks/useNoteDetail.ts` — note実時購読
- `src/features/photos/hooks/useNotePhotos.ts` — 写真実時購読
- `src/features/placeIntelligence/hooks/usePlaceGroups.ts` — VisitTimelineSection が内部使用
- `src/features/map/types/index.ts` — VisitedPlacesSummary.topPlaceLabels[]
- `src/shared/theme/colors.ts` / `spacing.ts` — カラー・border radius

## 実行コマンド結果

### `npx tsc --noEmit`
Exit 0（エラーなし）

### `npx expo lint`
Exit 0（エラーなし）

## git diff --stat（実装後）
```
app/(app)/notes/[noteId]/preview.tsx | 変更
implementation_logs/ui21_note_preview_polish/ | 新規
```
