# Phase 12.5H-2 Build Log

## 作成ファイル

- `docs/phase12_5h_google_routes/01_google_routes_overview.md`
  - 目的・無料 vs Premium の違い・Routes API を使う理由・travel mode・リスク

- `docs/phase12_5h_google_routes/02_cloud_functions_api_design.md`
  - generateNoteRoutes / getNoteRouteSegments / deleteNoteRouteCache の設計
  - input / output 型・処理フロー（擬似コード）
  - Google Routes API エンドポイント・リクエスト body 例
  - 権限設計・ファイル構成

- `docs/phase12_5h_google_routes/03_firestore_route_cache_model.md`
  - RouteSegmentDoc スキーマ
  - segmentId 命名規則
  - キャッシュ有効性判定ロジック
  - キャッシュ無効化条件
  - TTL 設計・Firestore Rules・インデックス・容量見積もり

- `docs/phase12_5h_google_routes/04_premium_access_and_cost_control.md`
  - アクセス制御方針（無料 / Premium / 権限別）
  - RevenueCat 統合前の仮実装と3つの方針案
  - コスト制御（生成回数制限・forceRefresh 制限・フォールバック）
  - Firestore カウンタ実装擬似コード
  - API 料金目安

- `docs/phase12_5h_google_routes/05_ui_flow_and_route_display.md`
  - 状態ごとのUI（無料直線 / 無料Premium選択 / Premium未生成 / 生成中 / 生成済み / 失敗）
  - Transit 表示例
  - EventMapPreview の扱い
  - Polyline 色設計（移動手段ごと）
  - 区間カードコンポーネント設計
  - ローカル State の設計

- `docs/phase12_5h_google_routes/06_implementation_plan.md`
  - Phase 12.5H-3〜12.5H-8 の段階的実装計画
  - 各フェーズの変更ファイル・deploy 要否
  - encodedPolyline decode 方針
  - API キースコープ・Firestore インデックス

## 更新ファイル

なし（設計ドキュメントのみ。app/src/firebase は変更なし）

## 削除ファイル

なし

## Functions変更有無

なし

## TypeScriptチェック結果

コード変更なし（実施不要）

## Expo lint結果

コード変更なし（実施不要）

## Firebase deploy実施有無

なし（不要）
