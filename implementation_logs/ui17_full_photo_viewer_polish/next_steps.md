# UI-17 Next Steps

## 推奨される次のアクション

### UI-18 候補: ピンチズーム対応
- `react-native-gesture-handler` + `react-native-reanimated` を活用
- pinch to zoom + double tap to zoom 実装
- スペック「pinch zoom is future-friendly but not required in the first pass」より

### UI-19 候補: サムネイルレール
- photos.length が多い場合（例: 8枚以上）に表示
- 現在表示中の写真をハイライト（border: 2, accent color）
- スペック「Thumbnail Rail — Use only when needed」より

### UI-20 候補: ホーム画面ポリッシュ
- スコープ外として明示された項目
- アプリ全体の完成度を上げる最終フェーズ

## デプロイ

- Firebase deploy 不要（Firestore/Storage/Functions に変更なし）
- Expo の OTA 更新または通常ビルドで反映可能
