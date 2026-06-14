# Phase 12.5H-3 Decisions

## Routes API skeleton を先に作る理由

Google Routes API の本呼び出し実装は、Secret・API キー・型設計が確定している必要がある。
先に型定義・ファイル構成・callable の骨組みを作ることで、
Phase 12.5H-5 の実装着手時に迷わず進められる。
また、`npm run build` でビルドが通ることを確認してから deploy することで、
型エラーが本番環境に混入するリスクを防げる。

## GOOGLE_ROUTES_API_KEY を別 Secret にした理由

1. セキュリティ: 最小権限の原則。Places API と Routes API を別キーにすることで、
   どちらかのキーが侵害されても被害を最小化できる。
2. コスト管理: 別キーにすることで GCP ダッシュボード上での API 使用量の把握が容易になる。
3. スコープ分離: Places API キーに Routes API の権限を追加する代わりに、
   Routes API 専用のキーを新規作成することで、将来的なキー revoke/rotate が独立できる。

既存の `GOOGLE_PLACES_API_KEY` に Routes API を追加する方法もあったが、
同じキーを複数の Callable で共有するとキーの権限範囲が広くなりすぎるため、
別キー方針を採用した。

## polyline decode を自前実装にした理由

1. package 追加不要: `@googlemaps/polyline-codec` を `npm install` すると
   Functions のバンドルサイズが増加し、コールドスタート時間が伸びる可能性がある。
2. 依存関係の最小化: 自前実装は 30〜50行程度で済み、外部ライブラリのメンテコストがかからない。
3. シンプルな仕様: Google Encoded Polyline Algorithm は公開仕様であり、
   安定した decode アルゴリズムを一度実装すれば変更が不要。
4. 型安全: `RouteLatLng[]` 型で返却するため、モバイル側との型整合性を Functions 側で保証できる。

## このフェーズで API 本呼び出しをしない理由

1. Secret / API キー確認: Secret Manager への登録は完了しているが、
   実際の API レスポンスを受け取るまでは型・エラー処理が未確定な部分がある。
2. 段階的リリース: skeleton → セキュリティルール実装 → 本実装 の順で進めることで、
   各フェーズの変更範囲を最小化し、問題が起きた場合の切り分けを容易にする。
3. Premium 判定が未実装: isPremiumUser が false のハードコードのまま API を呼ぶと、
   誤って全ユーザーがルート生成できてしまうリスクがある。
   Premium 判定が本実装されるまでは skeleton にとどめる。
4. Firestore ルールが未設定: route_segments サブコレクションの Security Rules が
   Phase 12.5H-4 で実装予定のため、現時点では Admin SDK 書き込みのみが安全。

## callable を先に export する理由

Firebase Functions は関数が `index.ts` から export されていて初めて deploy できる。
skeleton であっても export を追加することで:
1. Firebase Console で関数が登録されていることを確認できる
2. 将来の実装でファイル参照漏れが起きない
3. 他チームメンバーが呼び出せるインターフェースが先に確定する
