# Foursquare Places — Google Places 比較計画

## 目的

Google Places API (New) を第一候補として選定済みだが、Foursquare Places API との比較観点を整理しておく。  
**現時点では Foursquare の実装は行わない。** 比較候補として残し、Google Places の精度が期待を下回る場合の代替として位置づける。

---

## 比較軸

### 1. 日本の観光地での精度

| 観点 | Google Places | Foursquare |
|---|---|---|
| 主要観光地（浅草寺・金閣寺・富士山等） | ◎ | ○ |
| 中規模観光地（地方城跡・温泉地等） | ◎ | △ |
| 地方の小観光地 | ○ | △（データが薄い可能性） |
| 神社・仏閣の細分化 | ○（境内・本殿等も） | △ |

### 2. 日本の小規模カフェ・飲食店

| 観点 | Google Places | Foursquare |
|---|---|---|
| 東京・大阪の繁華街 | ◎ | ○ |
| 地方都市 | ○ | △ |
| 個人経営の小規模店舗 | △ | △ |
| ジャンル分類の細かさ | ◎（types が細かい） | ○ |

### 3. 駅周辺

| 観点 | Google Places | Foursquare |
|---|---|---|
| 主要ターミナル駅 | ◎ | ○ |
| 地方の小駅 | ○ | △ |
| ホーム・出口の細分化 | △ | △ |
| transit_station type の信頼性 | ◎ | ○ |

### 4. 海外観光地

| 観点 | Google Places | Foursquare |
|---|---|---|
| 欧米の有名観光地 | ◎ | ◎ |
| アジア（韓国・台湾・香港） | ◎ | ○ |
| 東南アジア（タイ・マレーシア等） | ◎ | ○ |
| 中東・アフリカ | ○ | △ |

### 5. レスポンスに含まれるカテゴリ

| 観点 | Google Places | Foursquare |
|---|---|---|
| カテゴリの種類数 | 多い（100種以上） | 多い（数百の階層型カテゴリ） |
| カテゴリの日本語対応 | `types` は英語固定 | カテゴリ名は英語固定 |
| スコアリングへの使いやすさ | ◎（types 配列が扱いやすい） | ○（階層型だが変換が必要） |

### 6. 日本語名称

| 観点 | Google Places | Foursquare |
|---|---|---|
| `languageCode: 'ja'` 対応 | ◎（`displayName.text` が日本語） | △（`locale` パラメータで一部対応） |
| 日本語住所 | ◎ | △ |
| 日本語の詳細度 | ◎ | △ |

### 7. 料金

| 観点 | Google Places | Foursquare |
|---|---|---|
| 無料枠 | $200/月 クレジット | Free Tier: 1,000 req/day（2025年） |
| 有料プラン | $0.010〜$0.032/req（SKUによる） | $0.005〜/req（プランによる） |
| 日本向けの安定性 | ◎ | ○ |
| コスト予測しやすさ | ◎（FieldMask で制御） | ○ |

### 8. APIキー管理

| 観点 | Google Places | Foursquare |
|---|---|---|
| 管理方法 | Firebase Secret Manager | Firebase Secret Manager |
| 制限設定 | Google Cloud Console で細かく設定可能 | Foursquare 管理画面 |
| OAuth 必要か | 不要（APIキーのみ） | 不要（APIキーのみ） |

### 9. 利用規約

| 観点 | Google Places | Foursquare |
|---|---|---|
| Firestore へのキャッシュ | 許可（30日以内） | 許可（条件あり） |
| 地図表示義務 | Places API の結果を地図に表示する場合は Google Maps 必須 | なし |
| データの再配布 | 禁止 | 禁止（ユーザーへの表示は許可） |
| 競合への提供 | 禁止 | 禁止 |

**注意:** Google Maps Platform の ToS では、`Places API (New)` の結果を地図上に表示する場合は Google Maps を使う必要がある。ただし、Firestore へのキャッシュ・自社アプリ内表示は許可範囲。

### 10. Firestore へ保存してよいフィールド

| フィールド | Google Places | Foursquare |
|---|---|---|
| place ID | ✅（キャッシュ用として許可） | ✅ |
| 施設名 | ✅（30日以内キャッシュ） | ✅ |
| 住所 | ✅ | ✅ |
| 座標 | ✅ | ✅ |
| カテゴリ / types | ✅ | ✅ |
| rating | ✅（30日以内キャッシュ） | ✅ |
| 写真 URL | ✅（有効期間あり）| 要確認 |
| 営業時間 | ⚠️（リアルタイム情報はキャッシュ禁止） | 要確認 |

**本アプリでの保存方針:** 施設名・座標・types・rating のみを保存する。営業時間・リアルタイム情報は保存しない。

### 11. Release v1 での採用現実性

| 観点 | Google Places | Foursquare |
|---|---|---|
| すぐに使えるか | ◎（API Key + Billing 設定のみ） | ○（API Key 取得が必要） |
| ドキュメントの品質 | ◎ | ○ |
| Cloud Functions での実装例 | 豊富 | 少ない |
| リスク | 課金超過 | 日本データの薄さ |
| 総合評価 | **◎ 採用推奨** | **△ 代替候補** |

---

## 結論

**現時点では Google Places API (New) を第一候補として維持する。**

Foursquare は以下の条件のいずれかに該当した場合にのみ代替として検討する：

1. Google Places の `languageCode: 'ja'` で日本語名称が全く返らない
2. 日本の小規模施設でほとんど候補が出ない
3. Google の課金コストが想定を大幅に超える

Foursquare の実際のテストは Phase 12.5C 実装直前に必要に応じて実施する。

---

## Foursquare を後日テストする場合のリクエスト例

```bash
# Foursquare Places API v3 - Nearby Search
curl -s \
  -H "Authorization: YOUR_FOURSQUARE_API_KEY" \
  "https://api.foursquare.com/v3/places/nearby?ll=35.7148%2C139.7967&radius=200&limit=10&fields=name,categories,distance,rating,location&locale=ja"
```

確認ポイント:
- `name` が日本語で返るか
- `categories` の階層と Google `types` との対応
- `locale=ja` の効果
