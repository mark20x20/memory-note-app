# 01 Google Routes API Overview

## 目的

Phase 12.5H-1 で追加したルート表示モードの土台を活かし、
有料プラン（Premium）ユーザー向けに実際の移動ルートを地図上に表示する機能を提供する。

訪問イベント（PlaceGroup）間の移動を「直線破線」から「実際の道路・徒歩・公共交通ルート」に変えることで、
思い出の記録としてのリアリティと体験価値を高める。

---

## 無料ルートと Premium ルートの違い

| 項目 | 無料（straight） | Premium |
|------|-----------------|---------|
| ルート種別 | PlaceGroup 間を直線破線でつなぐ | 実際の道路・徒歩・公共交通ルートを描画 |
| ルート精度 | 直線のみ（道路を考慮しない） | Google Routes API による実ルート |
| 距離情報 | なし | 区間ごとの距離（メートル） |
| 所要時間 | なし | 区間ごとの所要時間（秒→分換算） |
| 移動手段 | なし | 徒歩 / 車 / 公共交通 |
| Firestore キャッシュ | なし | route_segments サブコレクションに保存 |
| API コスト | 0 | Google Routes API の従量課金 |
| 生成タイミング | 常時（リアルタイム描画） | ユーザーが「ルートを生成」を押したとき |

---

## Google Routes API を使う理由

1. **Directions API より高精度・モダン**: Routes API (v2) は Directions API の後継。
   polylineEncoding の品質が高く、encoded polyline の decode 後に高密度な座標列を得られる。
2. **移動手段のサポート**: `WALK`, `DRIVE`, `TRANSIT` の3モードを単一 API でカバーできる。
3. **距離・時間の正確さ**: `distanceMeters`, `duration` が response に含まれ、区間ごとの数値を取得できる。
4. **ルートポリライン**: `encodedPolyline` を decode することで、地図に正確なルート線を描画できる。

---

## Directions API ではなく Routes API を想定する理由

| 比較点 | Directions API (旧) | Routes API (v2, 推奨) |
|--------|---------------------|----------------------|
| メンテ状況 | レガシー（廃止予定検討中） | Google 推奨の現行 API |
| Transit | 対応済み | 対応済み（TRANSIT モード） |
| Encoded polyline | あり | あり（品質向上） |
| Waypoint 数上限 | 23 | 25（intermediate waypoints） |
| 料金体系 | SKU 単位 | SKU 単位（同等） |

Routes API のほうがモダンで長期的なサポートが期待できるため採用する。

---

## travel mode の扱い

### walking（徒歩）

- `travelMode: "WALK"`
- 歩道・横断歩道を考慮したルート
- 距離が短い区間（〜3km）では最も正確
- Transit に比べて API コストが低い

### driving（車）

- `travelMode: "DRIVE"`
- 道路規則（一方通行・高速道路）を考慮
- 観光旅行の移動（レンタカー・タクシー）を記録するのに適する

### transit（公共交通）

- `travelMode: "TRANSIT"`
- 電車・バスを含む経路を返す
- 地域によってデータカバレッジに差がある（日本国内は比較的充実）
- ステップ詳細（乗換情報）を取得するには `computeRoutes` の `transitPreferences` を使う
- **初期実装では簡易表示**（乗換詳細は Phase 12.5H-6 以降）

---

## 今回（Phase 12.5H-2）実装しないこと

```text
- Google Routes API の実際の呼び出し
- Cloud Functions route generation の実装
- Firestore route_segments の読み書き実装
- RevenueCat / App Store Subscription 統合
- Premium 判定の本実装
- UI 変更（Phase 12.5H-1 の UI を維持）
- EAS Build / Android 確認
- Transit 乗換詳細取得
```

今フェーズ（12.5H-2）の成果物は設計ドキュメントのみ。

---

## リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| Routes API 料金が予想外に高額 | コスト超過 | Firestore キャッシュ + 生成回数制限 + TTL 再利用 |
| Transit カバレッジが地域で異なる | 一部ユーザーでルートが取れない | fallback: 取得失敗時は直線ルート表示 |
| PlaceGroup の座標精度が低い | ルートがおかしい | 座標が変わった場合はキャッシュ無効化 |
| 共有ノートで誰の Premium 権限を使うか | 権限設計の複雑化 | 初期は owner/editor のみ生成可能、viewer はキャッシュ閲覧のみ |
| encodedPolyline の decode ライブラリ | 依存ライブラリの選定 | `@googlemaps/polyline-codec` or 自前実装（軽量） |
| 生成が重複した場合（同一ユーザー二重タップ） | API 無駄遣い | Functions 側で `generating` 状態フラグ管理 |
