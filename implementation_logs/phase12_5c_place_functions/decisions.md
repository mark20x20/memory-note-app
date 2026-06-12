# Phase 12.5C Place Intelligence Cloud Functions — Decisions

## D1: Functions を place/ サブディレクトリに分割する

**決定:** `firebase/functions/src/place/` ディレクトリを新設し、以下の4ファイルに分割する。
- `types.ts`: 型定義（admin SDK 側）
- `placesClient.ts`: Google Places API クライアント
- `placeScoring.ts`: スコアリング・カテゴリマッピング
- `placeUtils.ts`: GPS グルーピング・ユーティリティ
- `placeFunctions.ts`: callable 関数本体

`index.ts` からは re-export のみ行う。既存の `generateMemoryDiary` / member Functions を一切変更しない。

**理由:** `index.ts` への直書きは既存 Phase 9/11 の関数と混在してメンテナンス性が低い。関心の分離により、Phase 12.5D のスコアリング拡張・Phase 12.5E の UI 連携が容易になる。

---

## D2: `GOOGLE_PLACES_API_KEY` は `defineSecret()` 経由でのみ参照する

**決定:** `defineSecret('GOOGLE_PLACES_API_KEY')` を `place/placeFunctions.ts` で定義し、Places API を呼ぶ3関数の `secrets` オプションに含める。
`index.ts` は re-export のみであり、secret への参照は持たない。

**理由:** Firebase Secret Manager のベストプラクティスに従う。モバイルアプリ・`.env` には一切記載しない。

---

## D3: Google Places API クライアントに Node.js 組み込み https モジュールを使用する

**決定:** `node-fetch` / `axios` などの外部パッケージを追加せず、Node.js 組み込みの `https` モジュールで API 呼び出しを実装する。

**理由:** `package.json` を変更しない方針に従う。Node 20 では `https.request` で十分。

---

## D4: 検索半径 200m → 0件なら 500m で再試行

**決定:** `searchNearbyPlaces` を 200m で呼び出し、0件の場合のみ 500m で再試行する。再試行は1回のみ。

**理由:** 通常の観光スポット・レストランは200m以内でヒットする。山間部・郊外では候補が少ないため500mのフォールバックで対応。リクエスト数を最小化するため再試行は1回のみ。

---

## D5: preliminary confidence は distance / category / rating の3因子

**決定:** Phase 12.5C では `dist * 0.6 + cat * 0.3 + rating * 0.1` の簡易スコアリングを実装する。
`05_candidate_scoring_and_ai_ranking.md` の7因子スコアリング（memo一致・title一致・写真集中度・複数グループボーナス）は Phase 12.5D に残す。

**理由:** Phase 12.5C の目的は候補取得・保存の基盤構築。AI ランキングを含む本格スコアリングは Phase 12.5D で実装する。

---

## D6: usage counter は per-note max 5 リクエストのみ実装

**決定:** `MAX_PLACE_GROUPS = 5` により1ノートあたり最大5回の Places API リクエストに制限する。
ユーザー単位の日次カウンター（`usage_counters/{uid}/places_api_calls/{YYYYMMDD}`）は今回実装しない。issues.md に TODO として記録する。

**理由:** 実装コストの観点から、まずノート単位の上限（=グループ数上限）で最低限のコスト制御を実現する。ユーザー単位の制限は Phase 12.5C 完了後・本番利用前に追加する。

---

## D7: selectPlaceCandidate と updatePlaceGroupManually を今回実装する

**決定:** 仕様に「可能なら今回実装してください」とあったため、両関数を実装した。
Firestore の読み書きのみであり Places API 呼び出しなし。実装コストが低く、UI (Phase 12.5E) に依存しない。

**理由:** Phase 12.5E の UI 実装前に callable が用意されていると、Callable テストが容易になる。

---

## D8: areaLabel は未実装（undefined）

**決定:** `visitedPlacesSummary.areaLabel` は今回設定しない。Phase 12.5D 以降で OpenAI または Geocoding API を使って実装する。

**理由:** areaLabel の生成には AI または追加 API が必要であり、Phase 12.5D の対象。

---

## D9: PlaceGroupDoc 作成時に selectedCandidateId は設定しない

**決定:** `enrichNotePlaces` で PlaceGroupDoc を初期作成する際、`selectedCandidateId` フィールドは設定しない（`userConfirmed = false`）。
最上位候補の名前を `label` に入れるが、ユーザーが `selectPlaceCandidate` を呼ぶまでは未確定扱いとする。

**理由:** `04_cloud_functions_api_design.md` の仕様通り。`userConfirmed = false` の PlaceGroup は UI 上で「要確認」として表示される。

---

## D10: forceRefresh 時に既存 place_groups を全削除してから再作成

**決定:** `enrichNotePlaces(forceRefresh: true)` では、まず既存 `place_groups` ドキュメントを全削除してから新規作成する。

**理由:** GPS グルーピング結果が変わる場合（写真追加後など）に古い PlaceGroup が残ると整合性が崩れる。candidates サブコレクションは Admin SDK の再帰削除が必要だが今回は割愛（孤立 candidates は Issues I3 に記録）。
