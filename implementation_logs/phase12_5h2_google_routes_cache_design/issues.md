# Phase 12.5H-2 Issues

## Google Routes API 料金の正確な調査が必要

設計ドキュメントには参考価格（$0.005〜$0.01 / リクエスト）を記載しているが、
実際の料金は Google Maps Platform の最新の価格表を確認する必要がある。
SKU（Basic vs Advanced）の違いによって料金が変わる場合がある。
また、無料枠（$200 / 月のクレジット）との兼ね合いを確認すること。
参照: https://mapsplatform.google.com/pricing/

## Transit ルートは地域によってカバレッジが異なる

公共交通（TRANSIT モード）は GTFS データの有無に依存する。
日本国内（東京・大阪などの主要都市）は対応しているが、
地方や海外での精度は地域ごとに確認が必要。
Routes API ドキュメントで対応地域リストを調べること。

## RevenueCat 未統合

現時点では `isPremiumUser = false` のハードコードのまま。
実際のサブスク状態を判定するには RevenueCat の統合（Phase 12.5H-7）が必要。
Firestore entitlement（方針B）の採用を推奨しているが、
RevenueCat Webhook の設定・Firebase Custom Claims との比較検討が別途必要。

## Firestore Security Rules 未実装

`route_segments` サブコレクションの Firestore Rules はまだ作成していない。
Phase 12.5H-4 で実装予定。
実装前は Cloud Functions Admin SDK 経由でのみ書き込み、
クライアントからの読み取りも制限された状態になる。

## encodedPolyline の decode 方法の確認が必要

Google Routes API が返す `encodedPolyline` は Google Encoded Polyline Algorithm で符号化されている。
Cloud Functions 側で decode するため `@googlemaps/polyline-codec` の利用を検討しているが:
- package.json への追加が必要（Phase 12.5H-3 で判断）
- 軽量な自前実装（30行程度）も選択肢
- Firestore に decodedPolyline を保存するため、モバイル側での decode は不要になる

## 共有ノートで誰の Premium 権限を使うかの最終判断が未確定

設計ドキュメントでは「generateNoteRoutes を呼んだユーザー本人の Premium 状態を確認する」
初期方針を採用しているが、以下のユースケースで議論が必要:
- Premium の owner が生成したキャッシュを、無料 viewer も閲覧できる → OK（設計通り）
- 無料 editor がいて、Premium の owner が「全員のためにルートを生成する」 → OK
- Premium の editor が生成、無料の owner が確認 → Premium editor のコストで生成される

将来的に「ノート owner が Premium なら全 editor もルート生成可能」にする設計も検討中（Phase 12.5H-7）。

## API キーのスコープ設定が未確認

`GOOGLE_ROUTES_API_KEY` として新しいシークレットを作成する予定だが、
既存の `GOOGLE_PLACES_API_KEY` と同じキーに Routes API を追加するか、
別キーを作成するかの最終判断が必要（Phase 12.5H-3 時点で決定）。
セキュリティ観点では別キー・最小権限が推奨。

## PlaceGroup の座標が変わったときのキャッシュ無効化タイミング

Phase 12.5H-2 では設計のみ。
実際には:
- `selectPlaceCandidate` で候補を変更して座標が変わる
- `updatePlaceGroupManually` で手動更新される
などの操作でキャッシュが stale になる。
これらの Functions にキャッシュ無効化（stale 更新）を組み込む必要がある（Phase 12.5H-4+）。
