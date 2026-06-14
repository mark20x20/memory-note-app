# Phase 12.5G-5 Build Log

## 作成ファイル

- `app/(app)/notes/[noteId]/photos/viewer.tsx`
  - 写真フルスクリーンビューア（新規ルート）
  - `noteId` + オプション `placeGroupId` + `initialIndex` を query param で受け取る
  - FlatList pagingEnabled で横スワイプ
  - 写真番号/合計枚数表示、撮影時刻表示、閉じるボタン

## 更新ファイル

- `app/(app)/notes/[noteId]/index.tsx`
  - 写真グリッドの各サムネイルを `TouchableOpacity` でラップ
  - タップ → `photos/viewer?initialIndex=${photoIdx}` へ遷移

- `app/(app)/notes/[noteId]/flows/[placeGroupId].tsx`
  - 写真サムネイル（最大3枚）を `TouchableOpacity` でラップ
  - タップ → `photos/viewer?placeGroupId=${placeGroupId}&initialIndex=${ti}` へ遷移

- `src/features/placeIntelligence/components/EventMapPreview.tsx`
  - `Polyline` を react-native-maps からインポート追加
  - PlaceGroup が2件以上かつ座標がある場合に訪問順ルート線を描画
  - 破線（lineDashPattern）、ティール色、幅2

- `app/(app)/notes/[noteId]/map.tsx`
  - `Polyline` を react-native-maps からインポート追加
  - groupsWithLocation が2件以上の場合に訪問順ルート線を描画
  - 破線、ティール色（#4FA8A1）、幅2.5

## 削除ファイル

なし

## Functions変更有無

なし（Cloud Functions 変更なし）

## TypeScriptチェック結果

Exit 0（エラーなし）

## Expo lint結果

Exit 0（警告・エラーなし）

## Firebase deploy実施有無

なし（不要）
