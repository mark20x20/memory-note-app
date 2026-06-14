# Phase 12.5G-5 Issues

## Polyline は実際の道路ルートではない

現在の Polyline は訪問イベント間を直線でつなぐ簡易ルート。
実際の移動経路（道路・電車・徒歩）とは一致しない。
将来的には Google Directions API を使い道路沿いルートを描画できるが、今回はスコープ外。

## 写真viewerのアニメーション/ズームは未実装

フルスクリーンビューアはシンプルな FlatList pagingEnabled。
ピンチズーム・ダブルタップズームは未実装。
パン操作・アニメーションも基本なし。
将来的に react-native-reanimated 等を使った拡張が必要。

## フロー単位viewerの initialIndex について

フロー閲覧画面からビューアを開く場合、`placeGroupId` の `photoIds` でノート写真を絞り込む。
絞り込んだ中での `initialIndex` を指定しているが、`photoPreviewURLs` は最大3枚の URL であり、
Firestore の `photos` サブコレクションから `photoIds` でフィルタした順と
必ずしも一致しない場合がある。
表示される写真の順序はソート順（`sortOrder`）に依存するため、
サムネイルと viewer の対応は概ね正しいが完全な保証はない。

## Android Map表示はEAS Buildで別途確認が必要

Polyline を含む地図表示は iOS シミュレータで確認できる。
Android は `GOOGLE_MAPS_ANDROID_API_KEY` の設定が必要なため、
EAS Build + 実機での別途確認が必要。

## StatusBar の挙動

写真ビューア画面で `StatusBar.setBarStyle('light-content')` を使っているが、
Android では `StatusBar backgroundColor="#000"` prop が効かないことがある。
実機での確認が必要。
