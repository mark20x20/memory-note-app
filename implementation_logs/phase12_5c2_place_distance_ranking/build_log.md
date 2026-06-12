# Phase 12.5C-2 Place Distance Ranking — Build Log

## 日時
2026-06-12

## ステータス
完了（Cloud Functions 実装 — Firebase deploy 未実施）

---

## 作成ファイル一覧

| ファイル | 内容 |
|---|---|
| `implementation_logs/phase12_5c2_place_distance_ranking/build_log.md` | 本ファイル |
| `implementation_logs/phase12_5c2_place_distance_ranking/decisions.md` | 設計上の決定事項 |
| `implementation_logs/phase12_5c2_place_distance_ranking/issues.md` | 既知の課題 |
| `implementation_logs/phase12_5c2_place_distance_ranking/next_steps.md` | 次のステップ |

---

## 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `firebase/functions/src/place/placesClient.ts` | `searchNearbyPlaces` の request body に `rankPreference: "DISTANCE"` を追加 |
| `firebase/functions/src/place/placeFunctions.ts` | `fetchAndSaveCandidates` および `enrichNotePlaces` 内の `scored.slice(0, 5)` を `scored.slice(0, 10)` に変更。関連コメント更新。 |

---

## 削除ファイル一覧

なし

---

## 変更差分サマリー

### `placesClient.ts`

```diff
   maxResultCount: 10,
   languageCode: 'ja',
+  rankPreference: 'DISTANCE',
```

### `placeFunctions.ts`

```diff
- const top5 = scored.slice(0, 5);   // fetchAndSaveCandidates
+ const top5 = scored.slice(0, 10);

- const top5 = scored.slice(0, 5);   // enrichNotePlaces
+ const top5 = scored.slice(0, 10);

- // candidates サブコレクションに保存（上位5件）
+ // candidates サブコレクションに保存（上位10件）

- * - 候補は confidence 降順でソートして上位5件のみ保存する。
+ * - 候補は confidence 降順でソートして上位10件保存する。
```

---

## ビルド・チェック結果

### Functions build

```
cd firebase/functions && npm run build
> tsc
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
Exit 0（エラー 0件、警告 5件 — すべて既存の pre-existing 警告）
```

既存警告（今回の変更とは無関係）:
- `placeFunctions.ts`: `Array<T>` 型表記 → `T[]` を推奨（既存コード）
- `placeFunctions.ts`: `'e' is defined but never used` × 2（既存コード）
- `placeUtils.ts`: `Array<T>` 型表記 × 2（既存コード）

## Firebase deploy

実施していない（ユーザーが実施）。
