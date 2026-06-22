# UI-3A Next Steps

## UI-3A 完了確認チェックリスト

- [x] `usePlaceGroups` フック作成
- [x] FlowsPanel — props 経由に変更（二重購読解消）
- [x] PlacesPanel — props 経由に変更（二重購読解消）
- [x] `edit.tsx` — usePlaceGroups 追加、props 渡し
- [x] `flows/[placeGroupId].tsx` — リデザイン完了
- [x] `places/[placeGroupId].tsx` — リデザイン完了
- [x] TypeScript チェック Exit 0
- [x] Expo lint チェック Exit 0

## 次フェーズ候補

### UI-3B: Preview 画面の実データ接続
- `preview.tsx` の VisitTimelineSection / EventMapPreview を実データで動作させる
- `getPhotoLocationsFromPhotos` の実装確認

### UI-4: Map 画面実装
- `/(app)/notes/[noteId]/map` ルートの作成
- 「地図で確認」ボタンの遷移先として必要
- PlaceGroupDoc の座標をマップ上にプロット

### UI-5: Flow / Place 詳細の eventMemo 編集
- flows/[placeGroupId].tsx に eventMemo 編集UI追加（places から移動した機能の正式実装）

### Phase 13: AI 日記生成
- `aiDiaryStatus` フィールドの状態遷移 (pending → processing → completed)
- Cloud Functions によるテキスト生成
- MemoPanel の aiDiary エディタとの連携
