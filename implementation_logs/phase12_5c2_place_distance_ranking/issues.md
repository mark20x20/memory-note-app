# Phase 12.5C-2 Place Distance Ranking — Issues

## I1: GPS自体がズレている場合は距離順でも正解が出ない可能性

**状況:** 写真の GPS メタデータは端末の位置精度に依存する。屋内・高層ビル・地下では誤差が10〜50m程度になる場合がある。

**影響:** グループ代表点（写真の平均 GPS）と実際の訪問場所が数十メートルずれた場合、距離順でも目的の店が上位に出ないことがある。

**対応方針:** ユーザーが候補から選択または手動入力できるUXで補完する。将来的にはノートのメモ・タイトルとの文字列照合（Phase 12.5D以降）で精度改善。

---

## I2: 店名がGoogle Placesに登録されていない場合は候補に出ない

**状況:** Google Places データベースに登録されていない場所（新規オープン店・個人経営の小規模店・私有地）は Nearby Search で返却されない。

**影響:** 実際に訪問した場所が候補に出ず、常に `updatePlaceGroupManually` での手動入力が必要になる。

**対応方針:** `updatePlaceGroupManually` callable は実装済み。Phase 12.5E の手動入力画面（SCR-PLACE-004）で対応。

---

## I3: 写真の店名看板は現在 OCR していない

**状況:** 写真に写っている店名看板の文字を読み取る OCR / Vision 機能は未実装。

**影響:** 看板に「Wasabi Plus」と書いてあっても、GPS 位置から候補を絞り込むしか方法がない。

**対応方針:** 将来的に Firebase ML Kit または Google Cloud Vision API で実装検討。現時点では対象外。

---

## I4: 候補10件に増えることでUIが縦に長くなる

**状況:** Phase 12.5C Callable Test の開発用テスト画面では candidates を縦リストで表示している。10件になると縦スクロールが増える。

**影響:** 開発用テスト画面での視認性が若干低下するが、機能には影響なし。

**対応方針:** Phase 12.5E の本番 UI（SCR-PLACE-002）ではリスト形式で適切にデザインする。

---

## I5: 日次 API 制限は未実装

**状況:** `usage_counters/{uid}/places_api_calls/{YYYYMMDD}` による日次制限は Phase 12.5C でも 12.5C-2 でも未実装。

**影響:** 同一ユーザーが `enrichNotePlaces` / `refreshPlaceCandidates` を繰り返し呼び出すと Google Places API リクエストが増加する。

**対応方針:** Phase 12.5D で実装予定。暫定措置として Google Cloud Console のハードリミット（1日10,000リクエスト）で保護。

---

## I6: `rankPreference: "DISTANCE"` と confidence ソートの混在 → 解決済み

**状況（解決済み）:** Phase 12.5C-2 追加修正で `distanceMeters` 昇順ソートに変更した。
confidence は表示用の参考値として保持し、距離が同値の場合の tie-breaker としてのみ使用する。

**変更後の保存順序:** distanceMeters 昇順（近い順）。距離が同じ場合のみ confidence 降順。
