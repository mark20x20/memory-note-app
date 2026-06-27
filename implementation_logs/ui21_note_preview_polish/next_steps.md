# UI-21 Note Detail / Preview Screen Polish — 次のステップ

## 優先度: 高

### VisitTimelineSection の空状態確認
- `placeEnrichmentStatus` が null / 'pending' / 'processing' のとき、VisitTimelineSection が何を表示するか確認
- 「場所と流れを整理中です」のような warm なメッセージが出ていない場合は、wrapper で追加

### heroPlaceholder の高さ統一
- 写真なし時の placeholder 高さを `heroImage` と同じ 300px に変更
- または、写真の有無で `heroSection` の最小高さを制御

## 優先度: 中

### Alert テキスト修正（handleConvertToShared）
- "共有ノートに変更すると、メンバーを招待できるようになります。" →
  "メンバーを招待すると、このノートが共有ノートになります。" に変更
- UI-16B のセマンティクス（noteType は招待成功時に CF が変更）と一致させる

### Photo count の表示一貫性
- `note.photoCount`（Firestore の非正規化値）と `notePhotos.length`（実時購読）が合わない場合の処理
- Photo Strip のラベルを `notePhotos.length` に統一するか、`note.photoCount` を優先するか決定

### Place summary chip の maxWidth 調整
- 場所名が長い場合（例: 「東京都渋谷区神宮前 ○○カフェ」）で chip が切れる
- numberOfLines=1 でよいが、maxWidth を flex: 1 ベースに変更するか検討

## 優先度: 低

### Map Preview のセクションラベル追加
- 現在 EventMapPreview に section ラベルがない（「地図」や「この日の地図」）
- EventMapPreview 自身がラベルを内包しているかどうか確認

### Pull-to-refresh
- `useNoteDetail` と `useNotePhotos` は onSnapshot でリアルタイム購読済み
- ただし、ユーザーが手動で再取得したい場合の UI として Pull-to-refresh を追加検討

## 次推奨アクション

現在整っている画面:
- Onboarding ✓
- Home ✓
- Create ✓
- Preview ✓

次のポリッシュ候補:
- `UI-22: Edit Screen Polish` — 5タブ編集画面の warmデザイン統一
- または `UI-22: Settings Screen Polish` — 設定画面の整備
