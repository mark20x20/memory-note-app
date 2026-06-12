# Phase 12.5C-3 Place Retrieval Diagnostics / Rework — Build Log

## 日時
2026-06-12

## ステータス
完了（診断スクリプト作成・並び順統一 — Firebase deploy 未実施）

---

## 作成ファイル一覧

| ファイル | 内容 |
|---|---|
| `scripts/place-intelligence/diagnose-place-retrieval.mjs` | Nearby Search / Text Search 比較診断スクリプト |
| `implementation_logs/phase12_5c3_place_retrieval_diagnostics/build_log.md` | 本ファイル |
| `implementation_logs/phase12_5c3_place_retrieval_diagnostics/decisions.md` | 設計上の決定事項 |
| `implementation_logs/phase12_5c3_place_retrieval_diagnostics/issues.md` | 既知の課題 |
| `implementation_logs/phase12_5c3_place_retrieval_diagnostics/next_steps.md` | 次のステップ |

---

## 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/core/repositories/placeGroupRepository.ts` | `getPlaceCandidatesByGroupId` の orderBy を `confidence desc` → `distanceMeters asc` に変更 |
| `firebase/functions/src/place/placeFunctions.ts` | `getPlaceCandidatesForGroup` 内のキャッシュ取得クエリを `confidence desc` → `distanceMeters asc` に変更 |
| `firebase/functions/src/place/placesClient.ts` | `searchTextPlaces` helper を追加（本番組み込みは診断後の次フェーズ）。`TEXT_SEARCH_URL` 定数を追加。 |
| `app/(app)/dev/place-callable-test.tsx` | `CandidateRow` の表示順を「距離 (m)」→「rating」→「confidence (参考)」に変更。セクションタイトルに「距離順」を追記。 |

---

## 削除ファイル一覧

なし

---

## 変更差分サマリー

### `placeGroupRepository.ts`

```diff
- const q = query(colRef, orderBy('confidence', 'desc'));
+ const q = query(colRef, orderBy('distanceMeters', 'asc'));
```

### `placeFunctions.ts` (`getPlaceCandidatesForGroup`)

```diff
-     .orderBy('confidence', 'desc')
+     .orderBy('distanceMeters', 'asc')
```

### `placesClient.ts`

- `TEXT_SEARCH_URL` 定数追加
- `searchTextPlaces(apiKey, textQuery, latitude, longitude, radiusMeters, languageCode)` 追加

### `place-callable-test.tsx` (`CandidateRow`)

```diff
- <InfoRow label="confidence" value={...} />
- <InfoRow label="distanceMeters" value={...} />
+ <InfoRow label="距離 (m)" value={Math.round(distanceMeters)} />
+ <InfoRow label="rating" value={...} />
+ <InfoRow label="confidence (参考)" value={...} />
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

## Firebase deploy

実施していない（ユーザーが実施）。
