# UI-17 Known Issues

## 解決済み

### I-1: エラー状態が存在しなかった
**状況:** 元の `viewer.tsx` はエラーコールバックで `setLoading(false)` のみで、エラー UI がなかった。
**解決:** `loadError` state を追加し、エラー時に「写真の読み込みに失敗しました」を表示。

### I-2: ヘッダーが `backgroundColor: 'rgba(0,0,0,0.4)'` で重かった
**状況:** スペック「no heavy top bar, overlay only」に反していた。
**解決:** `rgba(15,14,13,0.48)` に変更しスペック準拠のビューア背景色系に統一。

### I-3: ボトムメタデータが `takenAt` のみで、場所名・メモが表示されなかった
**状況:** 元の実装は `takenAt` だけを `renderItem` 内に表示していた。
**解決:** ボトムパネルを `position: absolute` でオーバーレイし、`placeLabel`・`takenAt`・`eventMemo` を表示。

## 残存・既知

### I-4: ピンチズームなし（スコープ外）
写真のピンチズームは今回スコープ外。将来的に `react-native-reanimated` + gesture handler で実装予定。

### I-5: サムネイルレール（Thumbnail Rail）なし
スペックには「Many Photos の場合はサムネイルレールを表示」とある。今回は未実装。
photos.length > 10 などの閾値で表示するか、次フェーズの判断事項。

### I-6: photoPreviewURLs fallback URL のビューア対応なし（意図的スコープ外）
UI-8 の安全策に準拠し、`photoPreviewURLs` fallback URL で viewer を開く機能は実装しない。
