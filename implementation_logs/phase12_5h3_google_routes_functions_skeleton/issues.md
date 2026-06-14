# Phase 12.5H-3 Issues

## 実ルート生成は未実装

`generateNoteRoutes` は現時点で Google Routes API を呼び出さない。
`computeRouteSegment()` は `throw new Error('Not implemented yet')` を返す。
Phase 12.5H-5 で walking / driving の本実装を行う。

## Premium 判定は未実装

`generateNoteRoutes` 内の Premium チェックは TODO コメントのみ。
現在はスキップされ、誰でも callable を呼べるが、
実際のルート生成をしていないため API コストは発生しない。
Phase 12.5H-7 で RevenueCat 連携（または Firestore entitlement）を本実装する。

## permission check は最低限

現時点では `assertOwnerOrEditor()` / `assertNoteMember()` の基本チェックのみ。
以下は未実装:
- 生成回数クォータ（1日 10回 / forceRefresh 3回）
- ノートレベルの Premium 権限付与（owner が Premium なら editor も使える等）
これらは Phase 12.5H-4/H-5 以降で実装する。

## Firestore route cache 未実装

`getNoteRouteSegments` は常に `{ segments: [] }` を返す。
`deleteNoteRouteCache` は常に `{ deletedCount: 0 }` を返す。
`generateNoteRoutes` は Firestore に何も書き込まない。
Phase 12.5H-4 で `route_segments` サブコレクションの read/write を本実装する。

## Functions deploy 後も UI からはまだ呼ばない

モバイル側（`app/` / `src/`）に callable 呼び出しコードは追加していない。
map.tsx の `routeMode === 'premium'` 時は引き続き Premium 案内カードを表示するのみ。
Phase 12.5H-5 で UI 連携を実装する。

## computeRouteSegment の void 参照

`routesClient.ts` の skeleton 内で `ROUTES_API_ENDPOINT`, `TRAVEL_MODE_MAP`, `params` を
`void xxx` で参照しているのは TypeScript の「unused variable」警告回避のため。
Phase 12.5H-5 で実際の fetch 実装に差し替えると void 参照は不要になる。
