# Phase 12.5H-5.5 Issues

## transit 未実装

区間別モードの per-segment セレクターに `[公共交通]` チップを disabled 表示しているが、
実際のルート生成は Phase 12.5H-6 で実装予定。
transit 区間を選択した場合、Functions 側でスキップされ（skippedCount++）、
地図上ではグレー破線の直線フォールバックが表示される。

## Premium 判定が仮実装

`map.tsx` の `isPremiumUser = true` は仮実装。
本番リリース前に RevenueCat または Firestore entitlement による
本実装（Phase 12.5H-7）に差し替えること。

## quota 未実装

`generateNoteRoutes` 内のルート生成回数クォータチェック（1日10回 / forceRefresh 1日3回）は
未実装。Phase 12.5H-7 で実装予定。
区間別モードでも無制限に Routes API を呼ぶことができる。

## mixed mode の選択状態永続化は未実装

`segmentTravelModes` state は画面をリロードすると失われる。
全体チップから区間別モードに切り替えた際に `groups` から初期化するのみ。
Firestore へのセグメント移動手段選択の保存・復元は実装していない。
（実装する場合は NoteDoc か PlaceGroupDoc に保存する設計が必要）

## 古い route cache との整合

Phase 12.5H-5 以前に生成された route_segments には `travelMode` フィールドがない可能性がある。
`RouteSegmentSummary.travelMode` はオプショナル（`travelMode?: PremiumRouteTravelMode`）のため、
undefined の場合は `getRouteColor(s.travelMode ?? 'walking')` でフォールバックする。
ただし、古いデータが travelMode なしで取得された場合、区間別モードの色分けが
正確でない可能性がある。

## segmentTravelModes の PlaceGroup 順序

`selectMixedMode()` で初期化する segmentTravelModes は `groups` state（Firestore realtime）
の順序に依存している。グループの追加・削除後にモードを切り替えると
segmentTravelModes が古い PlaceGroup ID を参照する可能性がある。
現状は `getSegmentMode` が見つからない場合 fallback ('walking') を返すので
画面が壊れることはないが、選択が失われる。
