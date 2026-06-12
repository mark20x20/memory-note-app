# Phase 12.5A Provider Decision — Decisions

## D1: Google Places API (New) を第一候補として検証フェーズに入る

**決定:** Phase 12.5A は実装前の検証・準備フェーズとして位置づける。Google Places API (New) の Nearby Search を第一候補として、APIキー取得・テスト実行・精度確認を完了させてから Phase 12.5B に進む。

**理由:** 実際にAPIを叩いて日本語精度・カテゴリ品質を確認しないと、Phase 12.5C のスコアリング設計が画に描いた餅になる。事前検証なしに実装を進めるリスクを排除する。

---

## D2: Foursquare は比較候補として残す（実装は行わない）

**決定:** Foursquare Places API の実際のテストは Phase 12.5A では実施しない。Google Places の精度が期待を下回る場合の代替として位置づけを明記した上で、比較観点ドキュメント（`03_foursquare_comparison_plan.md`）を作成した。

**理由:** 2つのAPIを同時に検証するとコストと工数が倍増する。Google Places が期待通りであれば不要になる。

---

## D3: APIキーは Secret Manager のみ。.env にも app.json にも書かない

**決定:** `GOOGLE_PLACES_API_KEY` は Firebase Secret Manager にのみ保存し、Cloud Functions の `defineSecret()` 経由でのみ参照する。テストスクリプトは環境変数（シェルの一時変数）から読む。

**理由:** APIキーがファイルに保存されると git 経由・バンドル経由での漏洩リスクがある。テスト後に `Remove-Item Env:GOOGLE_PLACES_API_KEY` で環境変数を削除する運用にする。

---

## D4: Nearby Search を Cloud Functions 経由で呼び出す設計を維持

**決定:** モバイルアプリから Google Places API を直接呼び出す設計は採用しない。Cloud Functions の `enrichNotePlaces` / `getPlaceCandidatesForGroup` 経由でのみ呼び出す。

**理由:** APIキーのモバイルアプリへの露出防止。rate limit / コスト制御をサーバ側で行うため。

---

## D5: Map SDK は Phase 12.5F で最終決定、現時点では react-native-maps を第一候補

**決定:** Phase 12.5F 開始前の時点では `react-native-maps` を第一候補として設計を進める。`expo-maps` は beta 段階が解除された時点で再評価する。Mapbox は高度な要件が出た場合の第二候補。

**理由:** `react-native-maps` は実績が多く、iOS / Android 両対応で EAS Build との相性が良い。`expo-maps` は 2025年時点でまだ beta であり、破壊的変更のリスクがある。

---

## D6: テストスクリプトは Node.js 標準 fetch を使用（追加パッケージなし）

**決定:** `test-google-places-nearby.mjs` は Node.js 20 の標準 `fetch` のみを使用する。`axios` 等の追加パッケージは導入しない。

**理由:** 追加パッケージをインストールすると `package.json` が変更され、本番依存に紛れ込む可能性がある。標準 fetch で十分な機能を持つ。

---

## D7: テスト結果はファイルに自動保存しない

**決定:** テストスクリプトは結果をファイルに書き出さない。コンソール出力のみ。結果のコピーはユーザーが手動で `02_google_places_test_results_template.md` に貼り付ける。

**理由:** 自動保存したファイルに座標・場所名が記録され、git に含まれるリスクがある。手動コピーにすることでユーザーが内容を確認する機会を作る。

---

## D8: FieldMask を Advanced Data SKU 相当に制限する

**決定:** `X-Goog-FieldMask` は `places.id, places.displayName, places.formattedAddress, places.types, places.location, places.rating` のみとする。

**理由:** `photos`, `reviews`, `regularOpeningHours` 等の Atmosphere Data SKU フィールドは高コスト（$0.032/req）。本アプリでは不要なフィールドを取得しない。
