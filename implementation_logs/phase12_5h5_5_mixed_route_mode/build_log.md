# Phase 12.5H-5.5 Build Log

## 作成ファイル

- `implementation_logs/phase12_5h5_5_mixed_route_mode/build_log.md`（本ファイル）
- `implementation_logs/phase12_5h5_5_mixed_route_mode/decisions.md`
- `implementation_logs/phase12_5h5_5_mixed_route_mode/issues.md`
- `implementation_logs/phase12_5h5_5_mixed_route_mode/next_steps.md`

## 更新ファイル

- `firebase/functions/src/route/types.ts`
  - `SegmentTravelModeInput` 型を追加
  - `GenerateNoteRoutesInput.travelMode` をオプショナルに変更
  - `GenerateNoteRoutesInput.segmentTravelModes?: SegmentTravelModeInput[]` を追加
  - `GenerateNoteRoutesResult.travelMode` をオプショナルに変更
  - `GetNoteRouteSegmentsInput.travelMode` をオプショナルに変更
  - `GetNoteRouteSegmentsResult.travelMode` をオプショナルに変更
  - `RouteSegmentSummary.travelMode?: PremiumRouteTravelMode` を追加

- `firebase/functions/src/route/routeFunctions.ts`
  - `generateNoteRoutes`: `segmentTravelModes` 対応のバリデーション・ループを追加
  - `generateNoteRoutes`: 区間別モードで transit 区間をスキップ（throw しない）
  - `getNoteRouteSegments`: 各 segment summary に `travelMode` を追加
  - `getNoteRouteSegments`: result.travelMode を undefined 許容に変更

- `src/features/map/types/index.ts`
  - `SegmentTravelModeInput` 型を追加

- `src/features/map/api/routeFunctionsClient.ts`
  - `SegmentTravelModeInput` をインポート追加
  - `GenerateNoteRoutesInput.travelMode` をオプショナルに変更
  - `GenerateNoteRoutesInput.segmentTravelModes?: SegmentTravelModeInput[]` を追加
  - `GenerateNoteRoutesResult.travelMode` をオプショナルに変更
  - `GetNoteRouteSegmentsInput.travelMode` をオプショナルに変更
  - `GetNoteRouteSegmentsResult.travelMode` をオプショナルに変更

- `app/(app)/notes/[noteId]/map.tsx`
  - `SegmentTravelModeInput` をインポート追加
  - `SegmentModeEntry` 型エイリアスと `getSegmentMode()` ヘルパーを追加
  - `isMixedMode` state を追加
  - `segmentTravelModes` state を追加
  - `selectPremiumMode`: `setIsMixedMode(false)` を追加
  - `selectMixedMode()` 関数を追加（初期モード設定含む）
  - `loadRouteSegments`: `mode` 引数をオプショナルに変更（mixed mode で全件取得）
  - `handleGenerateRoutes(forceRefresh = false)`: 区間別モード対応・forceRefresh 引数追加
  - useEffect: `isMixedMode` 対応（全件ロード）
  - `generatedPolylines`: 全体モードと区間別モードを分岐（区間別は s.travelMode で色分け）
  - `fallbackPolylines`: 区間別モードは per-pair フォールバック
  - `showStraightLine`: 区間別モードでは全体直線を非表示
  - チップ UI: `[直線][徒歩][車][区間別][公共交通]` に変更
  - 区間別モード中も `RouteGenerationPanel` を表示
  - `RouteGenerationPanel`: 新 Props（`isMixedMode`, `segmentTravelModes`, `onRefresh`, `onSegmentModeChange`）追加
  - `RouteGenerationPanel`: 区間別モード時の per-segment セレクター UI を追加
  - `RouteGenerationPanel`: transit チップは disabled 表示
  - `panelStyles`: 区間別モード用スタイル（`segmentModeBlock`, `segmentModeChips` など）を追加

## 削除ファイル

なし

## Functions変更有無

あり（`generateNoteRoutes` に区間別モード対応を追加、`getNoteRouteSegments` の RouteSegmentSummary に travelMode を追加）

## App変更有無

あり（map.tsx に区間別モード UI・ロジックを追加）

## Firestore Rules変更有無

なし

## TypeScriptチェック結果

`npx tsc --noEmit`: Exit 0

## Expo lint結果

`npx expo lint`: Exit 0（警告 0、エラー 0）

## Functions build結果

```
> build
> tsc

Exit-0
```

## Firebase deploy実施有無

未実施（ユーザーが実施）
