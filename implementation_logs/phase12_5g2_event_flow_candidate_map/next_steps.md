# Phase 12.5G-2 Next Steps

## 1. Firebase Functions deploy

変更した enrichNotePlaces（grouping params + photoPreviewURLs 保存）を本番反映する。

```bash
cd firebase
firebase deploy --only functions
```

## 2. forceRefresh=true で再推定

既存ノートは旧構造のまま。新しいイベント分割・photoPreviewURLs を反映するには
Places 画面から「写真から場所を推定」を実行する（または Firestore で
`placeEnrichmentStatus` を `idle` にリセットしてから実行）。

## 3. この日の流れの写真表示確認

実機で VisitTimelineSection に写真サムネイルが表示されることを確認。
- coverPhotoURL のみの旧 PlaceGroup → 1枚表示
- photoPreviewURLs ありの新 PlaceGroup → 最大3枚表示
- 写真なし → サムネイル行非表示

## 4. 候補確認画面の候補地図確認

実機で [placeGroupId].tsx に候補地図が表示されることを確認。
- 候補ピン (#1, #2, ...) と候補リストの番号が一致していること
- 選択中候補が塗りつぶしピン（mapAccent色）で表示されること
- 地図が候補の範囲を包含する Region に初期化されること

## 5. 全体地図と候補地図の役割確認

- 全体地図 (map.tsx): PlaceGroup のみ表示 → 旅の俯瞰
- 候補確認地図 ([placeGroupId].tsx): PlaceCandidate を表示 → 場所特定

## 6. 分割プリセット動作確認

「細かく」選択後に推定 → イベントが多く分割されることを確認。
「ゆったり」選択後に推定 → イベントがまとまることを確認。

## 7. 今後の改善候補

- **候補地図のピン密集対策**: 地図ピン数の上限を設ける（例: 上位10件）
- **ルート Polyline**: 全体地図でイベント間をルート線で繋ぐ
- **EAS Build**: 実機ビルドで Maps 表示を確認
- **Android Maps API key**: Android 実機での地図表示に必要
