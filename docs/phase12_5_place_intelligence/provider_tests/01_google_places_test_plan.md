# Google Places API New — テスト計画

## テスト目的

Phase 12.5C の Cloud Functions 実装に進む前に、Google Places API (New) が以下の要件を満たすことを確認する。

1. **日本語施設名の取得**: `languageCode: 'ja'` で日本語の `displayName.text` が返るか
2. **観光地・レストランの精度**: 主要観光スポットが近距離の上位候補に出るか
3. **海外での動作**: 日本以外の座標でも有効な候補が返るか
4. **カテゴリ種別**: `types` フィールドが想定通りの値（tourist_attraction, restaurant 等）を含むか
5. **コスト発生の把握**: FieldMask を使ったリクエストあたりのコストを実感する

---

## Google Places API (New) を使う理由

| 理由 | 詳細 |
|---|---|
| 施設精度 | 日本国内の観光地・飲食店での精度が商用 API 中最高水準 |
| 海外対応 | 日本以外（アジア・欧米）でも安定したデータカバレッジ |
| Field Mask | 必要なフィールドだけ指定可能 → コスト制御しやすい |
| Cloud Functions 相性 | Node.js から標準 fetch で呼び出せる（追加パッケージ不要） |
| Secret Manager | APIキーを Firebase Secret Manager で管理でき、モバイルアプリに露出しない |

---

## Nearby Search を使う理由

- `Nearby Search` は「指定座標の半径 N m 以内の施設候補」を返す
- 写真の GPS 座標（緯度経度）から候補を取得するユースケースに直接マッチする
- `Text Search` は自由テキスト検索であり、今回の「GPS → 施設候補」のユースケースには不向き

---

## FieldMask を使う理由

Google Places API (New) はリクエストする `X-Goog-FieldMask` の内容によって課金額が変わる。

```
Basic Data SKU ($0.005/req): id, displayName, types, formattedAddress
Advanced Data SKU ($0.010/req): rating, priceLevel
Atmosphere Data SKU ($0.032/req): photos, reviews, regularOpeningHours
```

本アプリでは `id, displayName, types, formattedAddress, location, rating` のみを使用することで、Advanced Data SKU の範囲に収める。

---

## `languageCode: 'ja'` の確認観点

| 確認項目 | 期待値 |
|---|---|
| `displayName.text` が日本語になるか | 「浅草寺」「渋谷駅」等の日本語文字列 |
| `formattedAddress` が日本語住所になるか | 「〒111-0032 東京都台東区...」形式 |
| 英語が混在するケースはあるか | 小規模施設では英語のみになる可能性 |
| 海外座標でも `languageCode: 'ja'` が使えるか | KLCCの場合は「ペトロナスツインタワー」等の日本語訳が出る場合がある |

---

## 半径 200m の妥当性

| シナリオ | 適切か |
|---|---|
| 観光地（浅草寺等）の境内内で撮影 | ◎ 200m で確実にカバー |
| 繁華街の道路上で撮影 | ○ 周辺施設は200m内に複数ある |
| 駅ホームで撮影 | ○ 駅施設は200m以内 |
| 屋内大型施設（ショッピングモール等）で撮影 | △ GPS が屋外エントランスを指す場合がある |
| 屋内・地下施設（GPS ドリフト有り） | △ 100m 以上ずれる可能性 → 候補多重マッチ |

**結論:** 200m はMVPとして妥当。GPS ドリフトが多い場合は 300m や 500m への拡大を Phase 12.5C で調整可能にする。

---

## maxResultCount の比較観点

| 設定値 | メリット | デメリット |
|---|---|---|
| 5 | レスポンスが小さい・処理が速い | 境界上の有力候補が漏れる可能性 |
| 10 | より多くの候補を取得できる | スコアリング対象が増える・レスポンスが増える |
| 20 | 最大値 | 不要な施設が多く混入する |

**推奨:** テストでは `maxResultCount: 10` を使い、有効候補数を確認する。本実装では上位 5 件を Firestore に保存する設計とする。

---

## テスト座標一覧と期待候補

| ID | ラベル | 座標 | 期待される上位候補 |
|---|---|---|---|
| `asakusa_sensoji` | 浅草寺周辺 | 35.7148, 139.7967 | 浅草寺, 雷門, 仲見世通り |
| `shibuya_station` | 渋谷駅・スクランブル交差点 | 35.6595, 139.7005 | 渋谷駅, SHIBUYA SKY, スクランブル交差点 |
| `kyoto_kinkakuji` | 京都 金閣寺周辺 | 35.0394, 135.7292 | 金閣寺（鹿苑寺）, 鏡湖池 |
| `arashiyama` | 京都 嵐山周辺 | 35.0094, 135.6670 | 嵐山, 竹林の道, 渡月橋 |
| `klcc` | クアラルンプール KLCC | 3.1579, 101.7123 | Petronas Twin Towers, Suria KLCC, KLCC Park |

---

## 成功条件

```
✅ 浅草寺周辺で「浅草寺」または関連観光地が上位（1〜3位）に出る
✅ 渋谷周辺で「渋谷駅」または関連ランドマークが出る
✅ 金閣寺周辺で「金閣寺 / 鹿苑寺」が出る
✅ KLCC周辺で英語または現地表記の主要施設が出る
✅ languageCode: 'ja' により、日本語名称が取得できるケースがある
✅ `types` に tourist_attraction / restaurant / transit_station 等が含まれる
✅ 1リクエストあたりのレスポンス時間が 2秒以内
```

---

## 失敗時の判断フロー

| 失敗パターン | 判断 |
|---|---|
| 期待候補が全く出ない | 座標を再確認。半径を 300m に拡大してリトライ |
| `languageCode: 'ja'` でも英語名称のみ | 許容範囲（海外施設は英語が多い）。日本施設で英語のみは要調査 |
| `types` が汎用的すぎる（`point_of_interest` のみ） | スコアリングのカテゴリ重みを調整する方針で対応 |
| レスポンスが空（0件） | 座標精度の問題。半径拡大または Geocoding フォールバックを検討 |
| API キーエラー（403 / 400） | Secret Manager の設定手順に戻る |
| Billing エラー | Google Cloud Console でBillingを有効化する |

---

## APIキーを安全に扱う手順

1. **APIキーをファイルに書かない**: `.env`・`app.json`・ソースコードへの埋め込み禁止
2. **環境変数で渡す**: テストスクリプトは `GOOGLE_PLACES_API_KEY` 環境変数からのみ読む
3. **ログに出力しない**: スクリプト内で `console.log(apiKey)` を禁止
4. **git に含めない**: `.gitignore` で `.env` を除外済みを確認
5. **テスト後は環境変数を削除**: `Remove-Item Env:GOOGLE_PLACES_API_KEY`（PowerShell）
6. **本番は Secret Manager**: `firebase functions:secrets:set GOOGLE_PLACES_API_KEY`

---

## コスト発生に関する注意

- テストスクリプト 1実行 = 5座標 × 1リクエスト = **5リクエスト**
- Advanced Data SKU で $0.010/req とすると **$0.05/回**
- Google は月 $200 の無料枠を提供（2025年現在）
- 無料枠内であれば課金されないが、Billing を有効化しないと API は動かない
- **無料枠を超えた場合は課金が発生するため、Billing の Budget Alert を先に設定すること**

---

## テスト実施手順

```powershell
# 1. PowerShell でAPIキーを環境変数に設定（ファイルには書かない）
$env:GOOGLE_PLACES_API_KEY="YOUR_API_KEY_HERE"

# 2. テストスクリプトを実行
node scripts/place-intelligence/test-google-places-nearby.mjs

# 3. 出力を 02_google_places_test_results_template.md に貼り付けて記録

# 4. テスト後に環境変数を削除
Remove-Item Env:GOOGLE_PLACES_API_KEY
```
