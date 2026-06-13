# Phase 12.5G-4 Issues

## flows と places のルート名が少し分かりにくい

現在:
- `flows/[placeGroupId]` = フロー閲覧
- `places/[placeGroupId]` = フロー編集

URL から役割が直感的に分かりにくい。
将来的には `flows/[flowId]` と `flows/[flowId]/edit` に整理することを検討。

## 今後 flows/[flowId]/edit に整理する可能性

現在は既存互換を優先して `places/[placeGroupId]` をフロー編集画面として使っているが、
長期的には `flows/[flowId]/edit` に統一する方がルートの意味が明確になる。
その場合 `places/` ディレクトリは場所一覧（`places/index.tsx`）と
手動入力（`places/manual.tsx`）のみに整理できる。

## viewer 直 URL 制御

viewer が `/(app)/notes/[noteId]/flows/[placeGroupId]` に直接アクセスした場合、
フロー閲覧は可能（編集ボタンは非表示）。
`places/[placeGroupId]` に直アクセスした場合も、候補選択・メモ編集は
`userCanEdit` でガードされている。
ただし URL 直アクセス時に「あなたには編集権限がありません」のような
明示的なメッセージは現状出ていない。

## 写真フルスクリーン表示は未実装

フロー閲覧画面にサムネイルを表示しているが、タップしてフルスクリーンで見る機能は未実装。
将来的な Phase で実装予定。
