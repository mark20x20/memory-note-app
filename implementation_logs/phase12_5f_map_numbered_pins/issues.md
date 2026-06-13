# Phase 12.5F-1 Map SDK / Numbered Pins — Issues

## I1: Android / Google Maps API key / EAS Build は未設定

**状況:** `react-native-maps` は Android では Google Maps を使用する。Google Maps API key の設定と EAS Development Build が必要。

**影響:** Android 実機での地図表示は現時点で未対応。

**将来対応:** Phase 12.5F-2 以降で EAS Development Build を導入し、`app.json` の `android.config.googleMaps.apiKey` を設定する（API key は Secret Manager または EAS Secret を使用し、ソースコード直書きは禁止）。

---

## I2: Expo Go での MapView 表示に制限がある可能性

**状況:** react-native-maps は Expo Go 環境での使用をサポートしているが、一部の高度な機能（カスタムマーカーのアニメーション等）は制限される場合がある。

**影響:** 基本的な MapView 表示・Marker 表示は動作する想定だが、実機テストで確認が必要。

**将来対応:** 問題が発生した場合は EAS Development Build へ移行する。

---

## I3: fitToCoordinates は初期実装で未対応

**状況:** 複数ピンをすべて含む表示範囲への自動フィットを `fitToCoordinates` で実装する代わりに、`calcRegionForGroups` で計算した `initialRegion` を使用している。

**影響:** 地図表示後にユーザーがズームアウトしても全ピンが入らない場合がある。また `ref` を使った命令的操作が必要なため、初期実装では省略した。

**将来対応:** MapView の `ref` を使って `mapRef.current?.fitToCoordinates(coordinates, { edgePadding })` を実装する。

---

## I4: 撮影時刻ベースの正確な旅順は未実装

**状況:** 旅順プレビューは PlaceGroup の `createdAt` 昇順（= placeGroupRepository の orderBy 順）を表示順として使用している。

**影響:** 実際の訪問順序と異なる可能性がある（写真の撮影時刻と推定処理の実行時刻が異なるため）。

**将来対応:** PlaceGroup に `startAt`（最初の写真撮影時刻）/ `endAt`（最後の写真撮影時刻）フィールドを追加し、`startAt` 昇順で並べ替えることで正確な旅順を実現する。

---

## I5: PlaceGroup の startAt / endAt フィールドが未整備

**状況:** 撮影時刻の集計フィールドが PlaceGroupDoc に存在しない。

**影響:** I4 の正確な旅順実装が未着手。

**将来対応:** Cloud Functions の `enrichNotePlaces` 処理で写真の撮影時刻を集計し、PlaceGroup ドキュメントに書き込む。

---

## I6: viewer の地図直 URL アクセス制御は client 側のみ

**状況:** `/notes/[noteId]/map` を viewer が直接 URL で開けば地図が表示される。

**影響:** 確認済みの場所だけでなく要確認の場所も見える。ただしセキュリティリスクは低い（Firestore Rules は Cloud Functions で保護済み）。

**将来対応:** 必要であれば client 側でも viewer には確認済み場所のみを表示するフィルタを追加する。
