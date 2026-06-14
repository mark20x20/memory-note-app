# Phase 12.5H-5 Issues

## Premium 判定が仮実装

`map.tsx` の `isPremiumUser = true` および `routeFunctions.ts` の `isPremiumUser = true` は
仮実装。本番リリース前に RevenueCat または Firestore entitlement による
実装（Phase 12.5H-7）に差し替えること。

## quota 未実装

`generateNoteRoutes` 内のルート生成回数クォータチェック（1日10回 / forceRefresh 1日3回）は
未実装。Phase 12.5H-7 で実装予定。
現在は無制限に Routes API を呼ぶことができる。

## transit 未実装

`computeRouteSegment` は `transit` 引数に対して Error を throw する。
`generateNoteRoutes` も transit を受け取ると `HttpsError('unimplemented', ...)` を返す。
Phase 12.5H-6 で実装予定。

## Routes API 料金が発生する

`generateNoteRoutes` が呼ばれるたびに、キャッシュ未ヒットの区間数だけ
Google Routes API が呼ばれ料金が発生する。
`isPremiumUser = true` の仮実装中は、ログインユーザー全員が呼べる状態なので、
開発環境のみで使用すること。

## Google Routes API のレスポンス差分に注意

`description` フィールド（routeSummary）は DRIVE モードで得られやすいが、
WALK モードでは空の場合がある。
`encodedPolyline` が返ってこなかった場合は Error を throw するようにしており、
status: 'failed' のドキュメントが作られる。

## Android / EAS 未確認

iOS Simulator での動作のみ想定。
Android 実機での MapView Polyline 描画は Phase 12.5H-8（EAS Build）で確認予定。

## sortOrder がない PlaceGroup の順序

`generateNoteRoutes` は `sortOrder` フィールドで昇順ソートを試みる。
`sortOrder` がない（null / undefined）PlaceGroup が混在する場合、
Firestore の `orderBy('sortOrder', 'asc')` クエリがエラーになる可能性がある。
現状の設計では `sortOrder` は Phase 12.5G-1 で全 PlaceGroup に付与されているため問題ないが、
古いデータには sortOrder がない場合がある。
その場合は Firestore コンソールで sortOrder を手動設定するか、
Functions 側で `orderBy` をスキップする必要がある。
