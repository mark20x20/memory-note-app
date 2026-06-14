# Phase 12.5H-1 Issues

## 実ルートAPIは未実装

Google Routes API / Directions API の呼び出しは今回スコープ外。
プレミアムモードを選んでも実際の道路沿いルートは表示されず、
直線Polylineがそのまま表示される。

## 課金判定は仮実装

`isPremiumUser = false` をハードコードしている。
実際は RevenueCat / App Store Subscription の状態を参照する必要がある。
TODO コメントあり: `// TODO: Replace with real subscription status from RevenueCat / App Store.`

## Firestoreキャッシュは未実装

`VisitRouteSegment` 型は定義したが、Firestoreへの保存・読み取りは未実装。
将来の Google Routes API キャッシュ設計時に別途対応が必要。

## Directions / Routes APIの料金・制限調査が必要

Google Routes API はリクエスト単位の課金。
ルート生成のタイミング（都度生成かキャッシュか）、
ユーザー1人あたりの月間リクエスト上限の設計が必要。

## 公共交通ルートは地域差がある

Google Routes API の Transit オプションは地域によってカバレッジが異なる。
日本国内では概ね充実しているが、地方や海外での精度は確認が必要。
また GTFS データの精度・リアルタイム性も考慮が必要。

## Android実機確認は未済

ルートモードUIを含む地図画面は iOS シミュレータで確認できるが、
Android は EAS Build + 実機確認が必要。
