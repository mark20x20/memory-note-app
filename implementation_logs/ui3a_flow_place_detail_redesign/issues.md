# UI-3A Issues & Resolutions

## 解決済み

### 1. FlowsPanel / PlacesPanel 二重購読
- **問題:** UI-2 時点で両パネルが独立して `subscribePlaceGroupsByNoteId` を呼んでいた
- **解決:** `usePlaceGroups` フックを作成し `edit.tsx` で1回だけ購読。props 経由で各パネルへ渡す

### 2. places/[placeGroupId].tsx の `handleSaveMemo` 未使用警告
- **発生:** リデザインでメモ編集UIを削除したが関数定義が残っていた
- **解決:** `handleSaveMemo` 関数と `updatePlaceGroupManuallyCallable` import を削除

### 3. PlaceGroupDoc.photoIds の型
- **問題:** `group.photoIds` は `string[] | undefined` であり、filter 内で `(group.photoIds as string[])` のキャストが必要
- **解決:** `group.photoIds && group.photoIds.length > 0` でガードしてからキャストを使用

## 未解決 / 将来対応

### 1. 「地図で確認」ボタンの遷移先
- `/(app)/notes/${noteId}/map` へ遷移しているが、このルートが存在するか未確認
- 存在しない場合は 404 になる。地図画面実装時に修正が必要

### 2. flows/[placeGroupId].tsx — prev/next ナビゲーション
- groups 配列の順序は `usePlaceGroups` 経由の購読結果に依存
- Flow Detail は `usePlaceGroups(noteId)` を独立して呼んでいるため、edit.tsx の購読と二重になっている
- Flow Detail 専用の共有 context か props drilling で将来解消可能

### 3. eventMemo 編集の削除による機能後退
- places/[placeGroupId].tsx から eventMemo 編集を削除した
- flows/[placeGroupId].tsx に eventMemo 編集UIがある想定だが、UI-3A の flows リデザインに含まれているか要確認
