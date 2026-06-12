# Phase 12.5C Place Intelligence Cloud Functions — Issues

## I1: Cloud Functions は deploy まで本番に反映されない

**状況:** `firebase/functions/src/place/placeFunctions.ts` の5関数は実装済みだが、Firebase への deploy は未実施。

**影響:** 本番環境 (`memory-note-app-dev`) および Expo アプリから callable を呼び出しても「関数が存在しない」エラーになる。

**対応方針:** Phase 12.5C 完了後に `npx firebase-tools deploy --only functions --project memory-note-app-dev` を実行する。Firestore Rules も同時 deploy 推奨。

---

## I2: Google Places API エラー時の候補ゼロ状態

**状況:** `searchNearbyPlaces` が HTTP エラーまたはネットワークエラーを投げた場合、`enrichNotePlaces` は `status=failed` を返し、PlaceGroupDoc は作成されない。

**影響:** エラー後にユーザーが再試行すると `placeEnrichmentStatus=fetching` への設定が先に走り、その後のエラーで再び `failed` になる。部分的に作成された PlaceGroupDoc が残る可能性がある。

**対応方針:** Phase 12.5D または後続フェーズで、失敗した PlaceGroup のみ再試行するロジックを追加する。現時点では `forceRefresh: true` での全再実行で回避可能。

---

## I3: forceRefresh 時の candidates サブコレクション孤立

**状況:** `enrichNotePlaces(forceRefresh: true)` では既存 `place_groups` ドキュメントを削除するが、candidates サブコレクションは削除しない（Admin SDK の `recursiveDelete` は今回未使用）。

**影響:** forceRefresh 後に孤立した candidates ドキュメントが Firestore に残る可能性がある。セキュリティルール上は他ユーザーはアクセス不可。ストレージコストは微小（1グループあたり最大5件 × 約300 bytes）。

**対応方針:** 将来的に Cloud Functions の Admin SDK `recursiveDelete` または定期クリーンアップジョブで対処する。

---

## I4: ユーザー単位の日次 API カウンターが未実装

**状況:** `07_privacy_security_cost_policy.md` で定義された `usage_counters/{uid}/places_api_calls/{YYYYMMDD}` コレクションによる日次制限は未実装。

**影響:** 1ユーザーが `enrichNotePlaces` を繰り返し呼び出すと、Google Places API のリクエスト数が増加する可能性がある。1呼び出しあたり最大5リクエスト（MAX_PLACE_GROUPS）の上限はある。

**対応方針:** Phase 12.5C 完了後・本番利用前に Firestore カウンター方式で実装する。上限超過時は `resource-exhausted` を返す。暫定措置として Google Cloud Console のハードリミット（1日10,000リクエスト）で保護する。

---

## I5: areaLabel が未実装

**状況:** `visitedPlacesSummary.areaLabel` は常に undefined（設定しない）。

**影響:** AI 日記プロンプト・共有カードでエリアレベルのラベルが使えない。

**対応方針:** Phase 12.5D で OpenAI API または Google Geocoding API を使って逆ジオコーディングで実装する。

---

## I6: Phase 12.5D の AI ランキングが未実装

**状況:** `05_candidate_scoring_and_ai_ranking.md` の7因子スコアリングおよび OpenAI AI ランキングは未実装。
現在は `distance * 0.6 + category * 0.3 + rating * 0.1` の簡易3因子スコアを使用している。

**影響:** メモ・タイトルとの文字列一致や写真集中度スコアが反映されないため、候補の精度が低い。

**対応方針:** Phase 12.5D で実装する。

---

## I7: Phase 12.5E の Places UI が未実装

**状況:** `enrichNotePlaces` callable を呼び出す UI（「場所を推定する」ボタン）、候補確認画面（SCR-PLACE-002）、手動入力画面（SCR-PLACE-004）が未実装。

**影響:** エンドユーザーは UI からは place Functions を呼び出せない。Firebase Functions Callable テストまたは Emulator で動作確認を行う必要がある。

**対応方針:** Phase 12.5E で実装する。

---

## I8: deleteNote 時の place_groups / candidates 連鎖削除が未実装

**状況:** Phase 10 のノート削除（`deletePhotosForNote` 相当）に place_groups / candidates の削除が未統合。

**影響:** ノートを削除した際に place_groups・candidates ドキュメントが残留する可能性がある。Firestore Rules により他ユーザーはアクセス不可だが、ストレージ使用量が微増する。

**対応方針:** Phase 12.5E 以降でノート削除 Cloud Function に Admin SDK の recursiveDelete を組み込む。

---

## I9: refreshPlaceCandidates のレート制限が未実装

**状況:** `refreshPlaceCandidates` は現在レート制限なし。仕様では「1グループあたり1日3回まで」を想定している。

**影響:** ユーザーが同一グループを連続して更新すると Places API リクエスト数が増加する。

**対応方針:** Phase 12.5D でレート制限を実装するか、または I4 のユーザー単位日次カウンターと合わせて実装する。
