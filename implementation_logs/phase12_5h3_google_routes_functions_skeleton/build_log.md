# Phase 12.5H-3 Build Log

## 作成ファイル

- `firebase/functions/src/route/types.ts`
  - `PremiumRouteTravelMode`, `RouteSegmentStatus`, `GenerateNoteRoutesInput`, `GenerateNoteRoutesResult`
  - `GetNoteRouteSegmentsInput`, `GetNoteRouteSegmentsResult`, `RouteSegmentSummary`
  - `DeleteNoteRouteCacheInput`, `DeleteNoteRouteCacheResult`
  - `RouteLatLng`, `RouteSegmentDoc`（Firestore ドキュメント型）

- `firebase/functions/src/route/routesClient.ts`
  - `computeRouteSegment()` skeleton（Phase 12.5H-5 で実装予定）
  - `ComputeRouteSegmentParams`, `ComputeRouteSegmentResult` 型
  - `ROUTES_API_ENDPOINT`, `TRAVEL_MODE_MAP` 定数（将来の実装参照用）
  - `RoutesApiRequestBody` 型（将来の request body 型、参照用）

- `firebase/functions/src/route/polylineUtils.ts`
  - `decodePolyline(encoded: string): RouteLatLng[]`
  - Google Encoded Polyline Algorithm の自前 decode 実装（外部パッケージなし）

- `firebase/functions/src/route/routeCache.ts`
  - `buildRouteSegmentId()` — segmentId 命名: `{from}_{to}_{travelMode}`
  - `calcRouteExpiresAt()` — TTL 計算（デフォルト 30日）
  - `isRouteSegmentStale()` — stale 判定（status / expiresAt / placeGroupVersionHash）

- `firebase/functions/src/route/routeFunctions.ts`
  - `generateNoteRoutes` — Callable skeleton（auth/validation/権限確認まで実装、API 本呼び出し未実装）
  - `getNoteRouteSegments` — Callable skeleton（auth/validation/権限確認まで実装、Firestore 読み取り未実装）
  - `deleteNoteRouteCache` — Callable skeleton（auth/validation/権限確認まで実装、Firestore 削除未実装）
  - `GOOGLE_ROUTES_API_KEY` を `defineSecret()` で参照

- `implementation_logs/phase12_5h3_google_routes_functions_skeleton/build_log.md`（本ファイル）
- `implementation_logs/phase12_5h3_google_routes_functions_skeleton/decisions.md`
- `implementation_logs/phase12_5h3_google_routes_functions_skeleton/issues.md`
- `implementation_logs/phase12_5h3_google_routes_functions_skeleton/next_steps.md`

## 更新ファイル

- `firebase/functions/src/index.ts`
  - Phase 12.5H-3 セクションを追加
  - `generateNoteRoutes`, `getNoteRouteSegments`, `deleteNoteRouteCache` を export

## 削除ファイル

なし

## Functions変更有無

あり（新規 Callable 3関数を追加）

## TypeScriptチェック結果

`npm run build`（= `tsc`）: Exit 0

## Functions build結果

```
> build
> tsc

Exit-0
```

型エラー・lint エラーなし

## Firebase deploy実施有無

未実施（ユーザーが手動で実施）
