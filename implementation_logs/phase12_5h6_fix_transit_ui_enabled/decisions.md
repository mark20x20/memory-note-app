# Phase 12.5H-6 Fix: Transit UI Enabled — Decisions

## Root Cause

Phase 12.5H-6 の前セッション実装時に、Cloud Functions 側のトランジットブロックは削除されたが、
App 側 (map.tsx) に複数のガードが残存していた：

1. `loadRouteSegments` useEffect 内: `if (premiumTravelMode === 'transit') return;`
2. `handleGenerateRoutes` 内: `segmentTravelModes.filter((e) => e.travelMode !== 'transit')`
3. `generatedPolylines` 内: `premiumTravelMode !== 'transit'` 条件
4. `fallbackPolylines` 内: `premiumTravelMode !== 'transit'` 条件 + `if (selectedMode === 'transit') continue;`
5. Transit card JSX: "公共交通ルートは次のフェーズで対応予定です。"
6. RouteGenerationPanel 表示条件: `(premiumTravelMode !== 'transit' || isMixedMode)`
7. 区間別チップ: `isDisabled = mode === 'transit'`
8. 区間別メモ: "＊ 公共交通は次フェーズで対応予定（直線表示）"

## 方針

全ガードを順番に削除し、transit を walking / driving と同じパスで処理させる。
既存の `getRouteColor('transit')` = '#D97B4F' (orange) はそのまま使用。
`getTravelModeLabel('transit')` = '公共交通' もそのまま使用。

## 変更しないもの

- routeFunctionsClient.ts: PremiumRouteTravelMode 型が既に transit を含むため変更不要
- routeDisplayUtils.ts: transit 対応済みのため変更不要
- Firebase Functions: 前フェーズで対応済み
