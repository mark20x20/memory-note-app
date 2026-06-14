# Phase 12.5G-5 Next Steps

## 実機確認

- 写真viewer確認（ノート詳細から）
  - 写真グリッドのサムネイルタップ → フルスクリーンビューア起動
  - 横スワイプで写真切り替えができるか
  - 写真番号（例: 1 / 12）が正しく表示されるか
  - 閉じるボタンで元の画面に戻れるか
  - 撮影時刻が表示されるか（takenAt がある写真）

- フロー閲覧画面から写真viewer確認
  - サムネイルタップ → フロー内の写真のみで viewer が起動するか
  - 絞り込まれた写真のみが表示されるか

- Map画面の Polyline 確認
  - 訪問イベント #1 → #2 → #3 が破線でつながれているか
  - Polyline の順番が Marker 番号と一致しているか
  - 訪問地が1件のみの場合に線が出ないか

- EventMapPreview（ノート詳細の地図）の Polyline 確認
  - ノート詳細の地図に破線ルート線が表示されるか
  - 地図プレビューサイズ（180px）で見切れないか

## 将来の検討事項

- ズーム機能: ピンチイン/ピンチアウトで拡大表示（react-native-reanimated or react-native-gesture-handler）
- ダブルタップズーム: iOS Photos に近い UX
- Directions API: Google Directions を使った道路沿いルート（別フェーズ）
- EAS Build / Android 実機確認: Polyline の Android 動作確認
- 写真viewer からシェア機能: 外部アプリへ写真をシェア
