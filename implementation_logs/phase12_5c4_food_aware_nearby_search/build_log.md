# Phase 12.5C-4 Food-aware Nearby Search — Build Log

## 日時
2026-06-13

## ステータス
完了（Firebase deploy 未実施）

---

## 作成ファイル一覧

| ファイル | 内容 |
|---|---|
| `implementation_logs/phase12_5c4_food_aware_nearby_search/build_log.md` | 本ファイル |
| `implementation_logs/phase12_5c4_food_aware_nearby_search/decisions.md` | 設計上の決定事項 |
| `implementation_logs/phase12_5c4_food_aware_nearby_search/issues.md` | 既知の課題 |
| `implementation_logs/phase12_5c4_food_aware_nearby_search/next_steps.md` | 次のステップ |

---

## 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `firebase/functions/src/place/placesClient.ts` | `searchNearbyPlaces` に `includedTypes?: string[]` を追加。`maxResultCount` を 10 → 20 に変更 |
| `firebase/functions/src/place/placeUtils.ts` | `NoteLike` 型と `isFoodRelatedNote` 関数を追加 |
| `firebase/functions/src/place/placeFunctions.ts` | `FOOD_INCLUDED_TYPES`・`MAX_SAVED_CANDIDATES` 定数追加。`mergeDedupe`・`searchPlacesForGroup` ヘルパー追加。`fetchAndSaveCandidates` に `isFoodRelated` 引数追加。`enrichNotePlaces`・`getPlaceCandidatesForGroup`・`refreshPlaceCandidates` を food-aware に更新 |
| `app/(app)/dev/place-callable-test.tsx` | `CandidateRow` のセクションタイトルに「最大20件」を追記 |

---

## 削除ファイル一覧

なし

---

## 変更差分サマリー

### `placesClient.ts`

```diff
- export async function searchNearbyPlaces(
-   apiKey: string, latitude: number, longitude: number, radiusMeters = 200
- ): Promise<GooglePlace[]> {
-   const requestBody = {
-     ...
-     maxResultCount: 10,
-     ...
-   };
+ export async function searchNearbyPlaces(
+   apiKey: string, latitude: number, longitude: number,
+   radiusMeters = 200, includedTypes?: string[]
+ ): Promise<GooglePlace[]> {
+   const requestBody: Record<string, unknown> = {
+     ...
+     maxResultCount: 20,
+     ...
+   };
+   if (includedTypes && includedTypes.length > 0) {
+     requestBody.includedTypes = includedTypes;
+   }
```

### `placeUtils.ts`

追加:
- `NoteLike` 型（title / memo / noteType を持つ最小型）
- `isFoodRelatedNote(note: NoteLike): boolean`（noteType / title / memo のキーワード判定）
- `FOOD_KEYWORDS_EN`・`FOOD_KEYWORDS_JA`・`FOOD_NOTE_TYPES` 定数

### `placeFunctions.ts`

追加:
- `MAX_SAVED_CANDIDATES = 20` 定数
- `FOOD_INCLUDED_TYPES = ['restaurant', 'cafe']` 定数
- `mergeDedupe(primary, secondary)` ヘルパー（providerPlaceId で重複排除）
- `searchPlacesForGroup(apiKey, lat, lng, isFoodRelated)` ヘルパー（検索戦略の分岐）

変更:
- `fetchAndSaveCandidates`: `isFoodRelated = false` 引数追加。`searchNearbyPlaces` 直接呼び出し → `searchPlacesForGroup` 経由に変更。`slice(0, 10)` → `slice(0, MAX_SAVED_CANDIDATES)`
- `enrichNotePlaces`: ループ前に `isFoodRelatedNote` で判定し `isFoodRelated` を決定。ループ内で `searchPlacesForGroup` を使用。`slice(0, 10)` → `slice(0, MAX_SAVED_CANDIDATES)`
- `getPlaceCandidatesForGroup`: `assertOwnerOrEditor` の戻り値を `noteSnap` として捕捉し `isFoodRelated` を決定。`fetchAndSaveCandidates` に `isFoodRelated` を渡す
- `refreshPlaceCandidates`: 同上

### `place-callable-test.tsx`

```diff
- <Text style={styles.candidatesTitle}>Candidates ({candidates.length}件, 距離順)</Text>
+ <Text style={styles.candidatesTitle}>Candidates ({candidates.length}件 / 最大20件, 距離順)</Text>
```

---

## ビルド・チェック結果

### Functions build
```
cd firebase/functions && npm run build
Exit 0（エラーなし）
```

### Root TypeScript チェック
```
npx tsc --noEmit
Exit 0（エラーなし）
```

### Expo Lint チェック
```
npx expo lint
Exit 0（エラー 0件、警告は pre-existing のみ）
```

---

## Firebase deploy

実施していない（ユーザーが実施）。
