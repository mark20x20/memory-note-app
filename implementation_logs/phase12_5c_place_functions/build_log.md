# Phase 12.5C Place Intelligence Cloud Functions — Build Log

## 日時
2026-06-12

## ステータス
完了（Cloud Functions 実装 — Firebase deploy 未実施）

---

## 作成ファイル一覧

| ファイル | 内容 |
|---|---|
| `firebase/functions/src/place/types.ts` | Cloud Functions 側の型定義（PlaceGroupDoc / PlaceCandidateDoc / PhotoData / LocalPlaceGroup / GooglePlace 等） |
| `firebase/functions/src/place/placesClient.ts` | Google Places API (New) Nearby Search クライアント（Node.js https モジュール使用） |
| `firebase/functions/src/place/placeScoring.ts` | 候補スコアリング（簡易3因子版）・PlaceCategory マッピング |
| `firebase/functions/src/place/placeUtils.ts` | GPS グルーピング・Haversine 距離計算・キャッシュ有効期限チェック |
| `firebase/functions/src/place/placeFunctions.ts` | enrichNotePlaces / getPlaceCandidatesForGroup / refreshPlaceCandidates / selectPlaceCandidate / updatePlaceGroupManually の5 callable |
| `implementation_logs/phase12_5c_place_functions/build_log.md` | 本ファイル |
| `implementation_logs/phase12_5c_place_functions/decisions.md` | 設計上の決定事項 |
| `implementation_logs/phase12_5c_place_functions/issues.md` | 既知の課題 |
| `implementation_logs/phase12_5c_place_functions/next_steps.md` | 次のステップ |

---

## 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `firebase/functions/src/index.ts` | ヘッダーコメントに Phase 12.5C を追記。place Functions 5件を re-export |

---

## 削除ファイル一覧

なし

---

## Functions ビルド結果

```
cd firebase/functions && npm run build
> tsc
Exit 0（エラーなし）
```

## Root TypeScript チェック

```
npx tsc --noEmit
Exit 0（エラーなし）
```

## Expo Lint チェック

```
npx expo lint
Exit 0（警告・エラーなし）
```

## Functions Lint

`package.json` に lint スクリプトなし。未実施。

## Firebase deploy

実施していない（Phase 12.5C の受け入れ条件通り）。

---

## 実装サマリー

### 追加 Cloud Functions (callable)

| 関数名 | 目的 |
|---|---|
| `enrichNotePlaces` | ノート全体の場所推定トリガー |
| `getPlaceCandidatesForGroup` | PlaceGroup 単位の候補取得（キャッシュ対応） |
| `refreshPlaceCandidates` | 候補強制再取得 |
| `selectPlaceCandidate` | 候補選択・PlaceGroup 確定 |
| `updatePlaceGroupManually` | 手動ラベル・カテゴリ設定 |

### リージョン

全関数: `asia-northeast1`

### Secret Manager

`GOOGLE_PLACES_API_KEY` を `defineSecret()` 経由で参照。
Places API を呼ぶ3関数 (`enrichNotePlaces`, `getPlaceCandidatesForGroup`, `refreshPlaceCandidates`) の `secrets` オプションに含める。

### Firestore 書き込み先

```
memory_notes/{noteId}                                    — placeEnrichmentStatus / visitedPlacesSummary 更新
memory_notes/{noteId}/place_groups/{placeGroupId}        — PlaceGroupDoc 新規作成・更新
memory_notes/{noteId}/place_groups/{placeGroupId}/candidates/{candidateId} — PlaceCandidateDoc 保存
```

### Google Places API 呼び出し仕様

- Endpoint: `POST https://places.googleapis.com/v1/places:searchNearby`
- FieldMask: `places.id,places.displayName,places.formattedAddress,places.types,places.location,places.rating`
- 半径: 200m（0件なら500mで再試行）
- maxResultCount: 10
- 保存上限: 上位5件（confidence 降順）

### Package 変更

なし（package.json / package-lock.json 変更なし）
