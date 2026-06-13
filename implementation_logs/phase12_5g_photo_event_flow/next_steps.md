# Phase 12.5G-1 Next Steps

## 1. Firebase Functions deploy

変更した enrichNotePlaces（Cloud Functions）を本番反映するには deploy が必要。

```bash
cd firebase
firebase deploy --only functions
```

## 2. forceRefresh=true で既存ノートを再推定

既存ノートは旧アルゴリズム（groupNearbyLocations）で作成された PlaceGroup が残る。
新しい時系列イベント構造にするには Places 画面から「写真から場所を推定」を実行するか、
forceRefresh=true で enrichNotePlaces を呼び出す。

Firestore コンソールから `placeEnrichmentStatus` を `idle` にリセットすることでも再実行できる。

## 3. Map画面で複数イベントピン確認

実機で地図に #1 #2 #3 ピンが複数表示されることを確認。
各ピンの番号と下部カードの番号が一致していることを確認。
startAt がある場合は時刻が表示されることを確認。

## 4. Detail の「この日の流れ」確認

ノート詳細画面に「この日の流れ」セクションが表示されることを確認。
- 番号・時刻・場所名・写真枚数が表示される
- 未確認の PlaceGroup に「要確認」バッジが表示される
- タップで candidates 画面に遷移できる

## 5. 今後の改善候補

- **ルート線（Polyline）**: Map 画面でイベント間をルート線で繋ぐ
- **startAt 精度改善**: EXIF の撮影時刻がより正確な場合の対応
- **しきい値調整**: 実機テストで 80m / 90分 の妥当性を検証
- **候補確認画面ミニマップ**: places/[groupId] の中で候補の位置をミニマップ表示
- **EAS Build**: 実機ビルドで Maps 表示を確認
