# Phase 12.5G-4 Build Log

## 作成ファイル

- `app/(app)/notes/[noteId]/flows/[placeGroupId].tsx` — フロー閲覧画面（新規ルート）
- `implementation_logs/phase12_5g4_preview_edit_separation/build_log.md`
- `implementation_logs/phase12_5g4_preview_edit_separation/decisions.md`
- `implementation_logs/phase12_5g4_preview_edit_separation/issues.md`
- `implementation_logs/phase12_5g4_preview_edit_separation/next_steps.md`

## 更新ファイル

- `src/features/placeIntelligence/components/VisitTimelineSection.tsx`
  - カードタップ先を `flows/[placeGroupId]`（フロー閲覧）に変更
  - 0件時の「作成」ボタンを削除し、「編集画面から作成する」リンクに変更
  - 管理UIを排除してプレビュー寄りに整理

- `app/(app)/notes/[noteId]/edit.tsx`
  - `enrichNotePlacesCallable` / `GROUPING_PRESETS` を import
  - `recreatingFlow` state 追加
  - `handleRecreateFlow` 関数追加（forceRefresh: true、標準設定で再作成）
  - フロー管理セクション追加（フロー分割設定 / この日の流れを再作成 ボタン）

- `app/(app)/notes/[noteId]/places/[placeGroupId].tsx`
  - タイトルを「フローを編集」に変更（フロー閲覧と役割を明確に分ける）

- `app/(app)/notes/[noteId]/map.tsx`
  - 場所カードのタップ先を `flows/[placeGroupId]` に変更
  - cardAction の文言を「詳細を見る →」に統一

- `app/(app)/notes/[noteId]/index.tsx`
  - コメント更新（Phase 12.5G-4 の変更を記録）

- `app/(app)/notes/[noteId]/places/index.tsx`
  - コメント更新

## 削除ファイル

なし

## Functions変更有無

なし

## TypeScriptチェック結果

`npx tsc --noEmit` → Exit 0

## Expo lint結果

`npx expo lint` → Exit 0

## Firebase deploy実施有無

不要（Functions 変更なし）
