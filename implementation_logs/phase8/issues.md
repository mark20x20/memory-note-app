# Phase 8 Issues — Map / Place Grouping

## I1: EXIF がない写真では地図表示できない

**状況:** GPS データが埋め込まれていない写真（スクリーンショット、一部 HEIC 等）は
`latitude` / `longitude` が null になるため、地図に表示されない。

**影響:** 位置情報なし写真のみのノートでは地図セクションが empty 表示になる。

**対応:** Phase 8 の empty 状態で「位置情報がある写真を追加すると…」という案内文を表示済み。
本格対応（手動ピン、場所検索）は Phase 10 以降。

## I2: iOS/Android/Expo Go で EXIF GPS 取得に差がある可能性

**状況:** `expo-image-picker` の EXIF 取得は iOS では動作確認済みだが、
Android では EXIF が取得できないケースや、Expo Go のバージョンによって差異がある。

**影響:** Android で撮影した写真の `latitude` / `longitude` が null になる可能性がある。

**対応:** Phase 6 のコードを確認し、`requestMediaLibraryPermissionsAsync` に加えて
`requestCameraPermissionsAsync` の要不要も確認が必要（Issue 継続）。

## I3: 地図風 UI は実地図ではない

**状況:** Phase 8 の MapPreview は React Native View ベースの擬似地図。
実際の地図タイル・道路・地名は表示されない。

**影響:** ユーザーが地名・道路・施設名で場所を確認できない。

**対応:** Phase 10 以降で `react-native-maps` または `expo-maps` に置き換え予定。

## I4: 場所名推定は未実装

**状況:** PlaceGroup に場所名フィールドがない。Reverse Geocoding API 未実装。

**影響:** ピンに「渋谷」「新宿」などの地名が表示されない。

**対応:** Phase 9 以降で Cloud Functions + Google Maps Geocoding API で対応予定。

## I5: GPS 符号処理（南半球・西経）の確認が必要

**状況:** Phase 6 で `GPSLatitudeRef` / `GPSLongitudeRef` の N/S/E/W 符号変換が
実装されているか未確認。日本国内（北緯・東経）では問題が出にくいが、
海外（南半球・西経）の写真では緯度経度の符号が逆になる可能性がある。

**対応:** Phase 9 以降で `usePhotoPicker.ts` を確認・修正予定。

## I6: MapPreview のピンが重なる場合の表示

**状況:** `PLACE_GROUP_THRESHOLD_DEGREES = 0.002` 度未満の微妙な差がある写真が複数ある場合、
グルーピングされずピンが近接・重複する可能性がある。

**影響:** ピンが見えにくくなる。

**対応:** Phase 10 以降でクラスタリングアルゴリズムを改善予定。

## I7: MapPreview でパーセント文字列を position に使用

**状況:** React Native の `StyleSheet.create` は絶対位置値に `"50%"` 形式を受け付けるが、
TypeScript の型定義（`DimensionValue`）に対して型キャストが必要。
MapPreview では `as unknown as number` でキャストしている。

**影響:** TypeScript の型チェックが弱くなる箇所がある。

**対応:** React Native 0.82 以降での `DimensionValue` 対応状況を確認し、型改善予定。
