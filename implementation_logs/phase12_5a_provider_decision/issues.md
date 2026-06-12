# Phase 12.5A Provider Decision — Issues

## I1: Google Places API の日本語精度は実APIテストまで未確定

**状況:** `languageCode: 'ja'` での日本語名称返却は、実際に API を叩くまで品質が不明。  
特に：
- 地方の小規模観光地での精度
- 小規模カフェ・飲食店での精度
- 海外座標に対する `languageCode: 'ja'` の効果（一部施設は翻訳されない）

**影響:** 日本語名称が返らない場合、UI に英語名称が混在する可能性がある。

**対応方針:** `04_secret_and_billing_setup_checklist.md` の手順で APIキーを準備し、`test-google-places-nearby.mjs` を実行して確認する。

---

## I2: APIキー制限・Billing 設定は人間による確認が必要

**状況:** Google Cloud Console での Billing 有効化・Budget Alert 設定・APIキー API 制限は、Claude Code では実行できない（ブラウザ操作が必要）。

**影響:** Billing が未設定だと Places API の呼び出しが 403 エラーになる。Budget Alert がないと課金超過に気づかない。

**対応方針:** `04_secret_and_billing_setup_checklist.md` のチェックリストに従って人間が手動で設定する。

---

## I3: Places API の Google Maps ToS（キャッシュ制約）の最新確認が必要

**状況:** Google Maps Platform の ToS は 2024年に改定されている。`02_provider_strategy.md` では「30日キャッシュ」と記載しているが、最新の ToS を実装前に確認する必要がある。

**特に確認が必要な点:**
- Firestore へのキャッシュ許可範囲
- キャッシュ禁止フィールド（`currentOpeningHours` 等）
- アトリビューション表示義務

**対応方針:** Phase 12.5C 実装前に Google Maps Platform ToS（https://cloud.google.com/maps-platform/terms）の最新版を確認する。

---

## I4: Map SDK は Development Build が必要になる可能性が高い

**状況:** `react-native-maps` は Expo Go では動作しない（ネイティブモジュール必須）。Phase 12.5F では EAS Development Build が必要になる。

**影響:** 
- Phase 12.5F のテストサイクルが長くなる（ビルド時間が必要）
- iOS では Apple Developer Program が必要

**対応方針:** Phase 12.5E（UI 実装）完了後に `eas.json` の development profile を準備する。それまでは Phase 8 の `MapPreview` を継続使用する。

---

## I5: テスト結果を git に保存する場合の個人情報・座標リスク

**状況:** `02_google_places_test_results_template.md` にテスト結果を貼り付けて git に保存する場合、個人が撮影した写真の GPS 座標と場所名が対になった情報が記録される可能性がある（テスト座標は公開座標なので問題ないが、今後の実テストでは注意が必要）。

**対応方針:** テスト結果ファイルは公開座標（浅草寺・渋谷等）のみを記録する。ユーザー固有の GPS 座標は記録しない。

---

## I6: Android 向け Google Maps APIキーが必要（Phase 12.5F）

**状況:** `react-native-maps` で Android に Google Maps を使う場合、`app.json` の `android.googleMapsApiKey` に Maps SDK for Android の APIキーを設定する必要がある。このキーは APK バンドルに含まれる。

**影響:** APIキーがアプリバンドルに含まれることになるが、これは Google の想定する使い方であり、API 制限（Maps SDK for Android のみ）と Android アプリのパッケージ名制限を設定することで悪用を防ぐ。

**対応方針:** Phase 12.5F 実装時に、Places API キーとは別に Maps SDK 専用のキーを発行し、Android パッケージ名 + Maps SDK for Android に制限する。

---

## I7: Foursquare との精度比較は Phase 12.5C 直前まで未実施

**状況:** Phase 12.5A では Foursquare の実際のテストを実施しない。Google Places の精度が期待を下回った場合にのみ代替として検討する方針だが、その判断タイミングが曖昧。

**対応方針:** Google Places テスト実行後に `02_google_places_test_results_template.md` の「採用判断」セクションで明確に判断する。「条件付き採用」または「要再検討」の場合は即座に Foursquare テストを実施する。
