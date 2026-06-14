# Phase 12.5H-4 Issues

## route_segments はまだ生成されないため通常は空

`generateNoteRoutes` は Phase 12.5H-4 でも Google Routes API を呼ばない。
したがって `getNoteRouteSegments` を呼んでも `{ segments: [] }` が返る。
Phase 12.5H-5 で `generateNoteRoutes` の本実装が完了して初めてデータが蓄積される。

## Google Routes API 本実装は未対応

`computeRouteSegment()` は `throw new Error('Not implemented yet')` のまま。
`generateNoteRoutes` 内の Routes API 呼び出し部分は TODO コメントのみ。
Phase 12.5H-5 で walking / driving の本実装を行う。

## Premium 判定未実装

`generateNoteRoutes` 内の Premium チェックは引き続き TODO コメントのみ。
`getNoteRouteSegments` と `deleteNoteRouteCache` は Premium 非依存のため問題なし。
Phase 12.5H-7 で RevenueCat 連携（または Firestore entitlement）を本実装する。

## batch delete 500件制限

`deleteNoteRouteCache` は Firestore `WriteBatch` を使用している。
Firestore の WriteBatch には 500 オペレーションの上限がある。
現状の route_segments 件数は (PlaceGroup数 - 1) × travelMode数（最大 ~30件）のため問題ないが、
将来的に件数が増える場合は `BulkWriter` または分割バッチへの対応が必要。
TODO コメントを routeFunctions.ts に記載済み。

## Firestore index deploy が必要

`firestore.indexes.json` に route_segments の composite index を追加したが、
未 deploy のため Firebase Console / Firestore には反映されていない。
`firebase deploy --only firestore:indexes` 実施前は、
`travelMode` でフィルタした `getNoteRouteSegments` クエリでエラーが発生する可能性がある
（データが存在しない間は問題なし）。

## GetNoteRouteSegmentsResult の travelMode フィールド

`GetNoteRouteSegmentsResult` 型には `travelMode` フィールドがある。
`getNoteRouteSegments` で travelMode を省略した場合、
戻り値の `travelMode` フィールドのデフォルト値として `'walking'` を返している。
将来 travelMode を省略した「全件取得」を正式サポートする場合は型定義の見直しが必要。
現状は travelMode を必ず指定する呼び出しパターンを想定しているため問題なし。
