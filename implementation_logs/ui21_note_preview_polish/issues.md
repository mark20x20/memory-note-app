# UI-21 Note Detail / Preview Screen Polish — 課題・既知の問題

## 解決済み

### #1 ScreenHeader の空タイトルが不自然
- **問題**: 旧実装で `ScreenHeader title=""` を使っており、ヘッダーに何も表示されなかった
- **解決**: カスタムヘッダーに置き換え。タイトルは Meta セクション内に配置

### #2 Quick Actions がスクロール最下部にあった
- **問題**: 地図・共有・メンバー導線が画面最下部にしかなく、スクロールが必要
- **解決**: Meta セクション直後に Quick Actions card として配置。スクロールなしでアクセス可能

### #3 AI日記の空状態・エラー状態が非表示だった
- **問題**: `aiDiaryStatus !== 'completed' && !== 'edited'` の場合、セクション自体が表示されなかった
- **解決**: generating / failed / idle それぞれに空状態 UI を追加

### #4 Memo の空状態
- **問題**: memo が空の場合にセクション自体が非表示
- **解決**: 「まだメモはありません」+ 編集誘導テキストを表示

## 残存課題

### #5 VisitTimelineSection の空状態テキスト
- **内容**: `placeEnrichmentStatus` が null / pending の場合の表示は `VisitTimelineSection` 内部に依存
- **影響**: ノート作成直後に「場所と流れを整理中です」が表示されるかはコンポーネント次第
- **対応**: VisitTimelineSection の内部実装確認 → 必要なら props や wrapper で空状態を追加

### #6 heroPlaceholder の背景が `surfaceIvory` のまま
- **内容**: 写真がない場合、200px の ivory 背景が表示される。hero=300px 時との高さの差が不自然
- **改善案**: placeholder も 300px にするか、または hero の高さを photos 有無で変える

### #7 Photo Strip のセクションラベルが冗長な可能性
- **内容**: 「写真（N枚）」ラベルは `note.photoCount` と `notePhotos.length` で数値が異なることがある（photoCount は Firestore、notePhotos は実時購読）
- **対応**: 購読が安定したら一致するはず。現状は `note.photoCount` を優先表示

### #8 Alert テキスト "共有ノートに変更すると" の誤解
- **内容**: `handleConvertToShared` の Alert テキストが「noteType が変更される」ように読める
- **判断**: UI-16B で「Alert は維持」とした。要件通り維持
- **将来対応**: Alert テキストを「メンバーを招待してみましょう」など実態に合った表現に変更検討
