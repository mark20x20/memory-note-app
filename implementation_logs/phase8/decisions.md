# Phase 8 Decisions — Map / Place Grouping

## D1: 外部地図 SDK を使わず、地図風プレビュー UI にした理由

**決定:** `react-native-maps` / `expo-maps` を導入せず、React Native View の絶対配置で地図風 UI を実装する。

**理由:**
- `react-native-maps` は Expo Go での扱いがやや重く、iOS/Android の設定差分が大きい
- Phase 8 の目的は「位置情報が取れているか」「ノート内の場所が見えるか」の検証であり、
  本格地図 SDK は不要なスコープオーバー
- 地図風 UI でも PlaceGroup・ピン配置・位置情報件数の確認は十分できる
- 後続 Phase で `react-native-maps` または `expo-maps` に置き換え可能な構造（MapPreview コンポーネント境界）を維持する

## D2: 緯度経度の正規化方法

**決定:** 最小・最大緯度経度から表示範囲を計算し、0〜1 に正規化してピン位置を算出する。

**詳細:**
- `getMapBounds()` で全写真の lat/lng の min/max を取得
- 1点のみの場合は `SINGLE_POINT_EXTENT = 0.005度` の固定幅を確保
- 端パディング `BOUNDS_PADDING_RATIO = 0.1` (10%) でピンが端に寄りすぎないようにする
- `normalizeLocationToPoint()` で x=経度方向（東=1）、y=緯度方向（北=0、スクリーン座標反転）
- ピン表示位置は `INNER_PADDING = 0.1` でさらに内側にクランプ（バッジが画面外にはみ出さないよう）

## D3: 簡易 Place Grouping の基準

**決定:** 閾値 `PLACE_GROUP_THRESHOLD_DEGREES = 0.002` 度（約 220m）以内の写真を同グループとみなす。

**アルゴリズム:**
- 写真を順番に処理し、既存グループの中心から閾値以内なら追加
- グループ中心は含まれる写真の平均緯度経度で更新
- 代表写真（coverPhotoURL）はグループの最初の写真を使用
- 厳密な Haversine 距離計算ではなく、度の差分の絶対値で判定（Phase 8 では十分）

**Phase 9+ での置き換え方針:**
- `groupNearbyLocations()` の入出力インターフェース（`PhotoLocation[]` → `PlaceGroup[]`）を維持
- 関数内のアルゴリズムのみを Haversine / ML クラスタリングに置き換え可能

## D4: GPS 符号処理の扱い

**決定:** Phase 8 では既存の `latitude` / `longitude` をそのまま使用する。保存済みデータの破壊的変更はしない。

**背景:**
- Phase 6 (`usePhotoPicker.ts`) で EXIF から `latitude` / `longitude` を抽出して保存
- `GPSLatitudeRef` (N/S) / `GPSLongitudeRef` (E/W) の符号変換が対応済みか未確認
- 日本国内の写真（北緯・東経）は符号処理なしでも正の値になるため、通常は問題なし
- 南半球・西経の写真では符号が逆になる可能性がある → issues.md に記録

## D5: 本格地図 SDK 導入を後続 Phase へ回す

**決定:** `react-native-maps` / `expo-maps` の導入は Phase 10 以降に延期する。

**理由:**
- Phase 8 スコープ内で地図風 UI による位置情報表示の検証は完了できる
- SDK 導入にはネイティブ設定変更・API キー管理・ビルド設定が必要で、Phase 8 のスコープを超える
- MapPreview コンポーネントをそのまま SDK ベースの実装に差し替えられる設計にしておく
