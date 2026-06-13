# Phase 12.5G-2 Build Log

## Created files

- `implementation_logs/phase12_5g2_event_flow_candidate_map/build_log.md`
- `implementation_logs/phase12_5g2_event_flow_candidate_map/decisions.md`
- `implementation_logs/phase12_5g2_event_flow_candidate_map/issues.md`
- `implementation_logs/phase12_5g2_event_flow_candidate_map/next_steps.md`

## Updated files

- `firebase/functions/src/place/types.ts`
  - `LocalPlaceGroup` に `photoPreviewURLs?: string[]` を追加
  - `PlaceGroupDoc` に `photoPreviewURLs?: string[]` を追加

- `src/features/map/types/index.ts`
  - `PlaceGroupDoc` に `photoPreviewURLs?: string[]` を追加

- `firebase/functions/src/place/placeUtils.ts`
  - `groupPhotosByTimeAndDistance` に `options?: { timeGapMs, distanceGapMeters }` を追加
  - グループ集約時に `photoPreviewURLs` (最大3枚) を収集して返すよう変更
  - デフォルト定数を `DEFAULT_DISTANCE_THRESHOLD_METERS` / `DEFAULT_TIME_THRESHOLD_MS` にリネーム

- `firebase/functions/src/place/placeFunctions.ts`
  - `enrichNotePlaces` request.data から `grouping` を読み取る
  - `timeGapMinutes` clamp: 15〜360、`distanceGapMeters` clamp: 20〜500
  - `groupPhotosByTimeAndDistance` に `groupingOptions` を渡す
  - PlaceGroupDoc 保存時に `photoPreviewURLs` を追加

- `src/features/placeIntelligence/api/placeFunctionsClient.ts`
  - `GroupingPreset` 型・`GROUPING_PRESETS` 定数を追加
  - `EnrichNotePlacesInput` に `grouping?: { timeGapMinutes?, distanceGapMeters? }` を追加

- `src/features/placeIntelligence/components/VisitTimelineSection.tsx`
  - 写真サムネイル表示（photoPreviewURLs → coverPhotoURL の順）を追加
  - 「場所を確認・編集 →」アクションリンクを追加
  - 確認済みバッジを緑色に変更

- `src/features/placeIntelligence/components/VisitedPlacesSection.tsx`
  - `GroupingPreset` state を追加
  - `GroupingPresetChips` コンポーネントを追加（細かく/標準/ゆったり）
  - idle 状態・completed 状態の再推定ボタンの前にプリセットチップを表示
  - `handleEnrich` が選択プリセットを `grouping` に変換して渡す

- `app/(app)/notes/[noteId]/index.tsx`
  - `VisitTimelineSection` を `VisitedPlacesSection` より前に移動（主役に格上げ）

- `app/(app)/notes/[noteId]/places/index.tsx`
  - `GroupingPreset` state を追加
  - プリセットチップ UI（細かく/標準/ゆったり）を推定ボタンの上に追加
  - グループカードに写真サムネイル表示を追加
  - `→ 候補を確認` を `→ 場所を確認・編集` に文言変更

- `app/(app)/notes/[noteId]/places/[placeGroupId].tsx`
  - `react-native-maps` の `MapView, Marker` をインポート
  - `getCandidatesWithLocation` / `calcCandidateRegion` ヘルパーを追加
  - `CandidateMarkerView` 番号付きピンコンポーネントを追加
  - 候補地図（高さ 200px）を現在の場所情報カードと候補リストの間に挿入
  - 地図ピン番号と候補リスト番号（`#N`バッジ）を一致させる

## Deleted files

なし

## Functions変更有無

あり。`enrichNotePlaces` が `grouping` パラメータを受け取り、
`photoPreviewURLs` を PlaceGroupDoc に保存する。
Firebase deploy が必要。

## TypeScriptチェック結果

```
npx tsc --noEmit → Exit 0（エラーなし）
```

## Expo lint結果

```
npx expo lint → Exit 0（警告・エラーなし）
```

## Functions build結果

```
cd firebase/functions && npm run build → Exit 0（エラーなし）
```

## Firebase deploy実施有無

未実施。ユーザーが実施する。
