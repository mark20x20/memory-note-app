# Phase 12.5: Provider Strategy — 外部APIプロバイダ比較と選定

## 比較対象

| プロバイダ | カテゴリ |
|---|---|
| Google Places API (New) | 商用 Places |
| Google Geocoding API | 逆ジオコーディング |
| Apple MapKit JS / iOS native | Apple エコシステム |
| OpenStreetMap / Nominatim | OSS・無料 |
| Foursquare Places API | 商用 Places |
| Geoapify / Mapbox | 代替商用 |
| AI のみで推測（OpenAI） | AIのみ案 |

---

## 比較表

| 軸 | Google Places | Google Geocoding | Apple MapKit JS | OSM / Nominatim | Foursquare | Geoapify / Mapbox | AI のみ |
|---|---|---|---|---|---|---|---|
| レストラン・観光地精度 | ◎ (世界最高水準) | △ (住所のみ) | ○ (iOS 強い) | △ (精度低め) | ○ (POI 強い) | ○ | × (幻覚リスク) |
| 日本国内対応 | ◎ | ◎ | ◎ | ○ | ○ | ○ | — |
| 海外対応 | ◎ | ◎ | ○ (iOS依存) | ○ | ○ | ○ | — |
| 費用 | 要注意 (課金) | 要注意 (課金) | 無料枠あり | 無料 | 要注意 | 有料 / 無料枠 | OpenAI 費用のみ |
| APIキー管理 | Functions secret 必須 | Functions secret 必須 | App secret | 不要 | Functions secret 必須 | Functions secret 必須 | OpenAI key 既存 |
| Expo / RN 相性 | Cloud Functions 経由なら◎ | Cloud Functions 経由なら◎ | iOS ネイティブ必須 | HTTP 呼び出し可 | Cloud Functions 経由 | HTTP 呼び出し可 | Cloud Functions 経由 |
| Cloud Functions 実装 | ◎ (HTTP client) | ◎ (HTTP client) | × (iOS のみ) | ◎ (HTTP client) | ◎ (HTTP client) | ◎ (HTTP client) | ◎ |
| 利用規約・キャッシュ制約 | 厳格 (Google ToS) | 厳格 (Google ToS) | 厳格 (Apple ToS) | 寛容 (ODbL) | 厳格 | 緩め | OpenAI ToS |
| Release v1 現実性 | ◎ | ◎ | △ (Android不可) | ○ | ○ | ○ | × |

---

## 各プロバイダ詳細

### Google Places API (New)
- **強み**: 世界最高水準の施設データ。日本全国対応。Nearby Search で半径指定が可能。フィールドマスク指定でレスポンスを絞れるためコスト制御しやすい。
- **弱み**: 課金あり。Nearby Search は $0.032/リクエスト程度。キャッシュは可能（24時間ルール）。
- **利用規約制約**: 結果を他の地図サービスに表示する場合は Google Maps 必須。Firestore へのキャッシュは ToS で許容範囲。
- **推奨用途**: 施設名・カテゴリ・評価の取得。MVPの第一候補。

### Google Geocoding API
- **強み**: 住所 ↔ 座標変換の精度が高い。
- **弱み**: 施設名・POI は出てこない。Places API の補助として使う位置づけ。
- **推奨用途**: ラベルが施設名で取れない場合の「行政区・地名」フォールバック。

### Apple MapKit JS / iOS native
- **強み**: iOS では精度高い。無料枠あり。
- **弱み**: Android 非対応（完全に除外）。Cloud Functions から呼びにくい（iOS ネイティブ SDK）。
- **推奨用途**: 採用しない（Android 非対応）。

### OpenStreetMap / Nominatim
- **強み**: 無料。ライセンス寛容。セルフホスト可能。
- **弱み**: 日本の施設名精度が低い。公開 Nominatim は利用制限あり（1 req/sec）。レストランや小規模観光地に弱い。
- **推奨用途**: フォールバック・エリア地名取得。MVP では使用しない（精度不足）。

### Foursquare Places API
- **強み**: POI（Points of Interest）特化。レストラン・観光地の品質高い。
- **弱み**: 日本データは Google より薄い場合がある。課金あり。
- **推奨用途**: Google Places の代替候補として Phase 12.5C 実装前に最終確認が必要。

### Geoapify / Mapbox
- **強み**: Mapbox は地図表示とセットで強い。Geoapify は比較的安価。
- **弱み**: 日本特有 POI 精度は Google より劣ることが多い。
- **推奨用途**: Map SDK（Phase 12.5F）は Mapbox が候補。Places 取得は Google を優先。

### AI のみ（OpenAI）
- **強み**: すでに OpenAI キーがある。呼び出しは既存の Cloud Functions 経由。
- **弱み**: 座標だけを渡して場所名を断定させると幻覚が頻発する。信頼性ゼロ。
- **推奨用途**: 採用しない（候補一覧から選ぶ補助役のみ）。

---

## 推奨案

### MVP（Phase 12.5C）での推奨プロバイダ

**第一候補: Google Places API (New) — Nearby Search**

```
理由:
- 日本国内での施設名・カテゴリの精度が最高水準
- フィールドマスクで必要最低限のフィールドのみ取得 → コスト制御可能
- Cloud Functions から HTTP クライアントで呼び出し可能
- APIキーは Firebase Secret Manager で管理 → モバイルアプリ非公開
- 結果のキャッシュは Firestore に保存（24時間ルール内）
```

**フォールバック: Google Geocoding API**

```
理由:
- 施設名が取れない場合に行政区・地名を取得する
- 同じ Google プロジェクトのキーで利用可能
```

**補助: OpenAI（AI日記連携のみ）**

```
役割:
- 候補リストを受け取り、自然なラベルを生成する
- 「浅草寺エリア」「代官山 蔦屋書店周辺」など
- 候補外の場所を断定しない（hallucination 禁止）
```

---

### コスト見積もり（参考）

| API | 単価 | 想定呼び出し |
|---|---|---|
| Places Nearby Search | 約 $0.032/req | 1 note ≒ 1〜3 req（グループ単位） |
| Geocoding | 約 $0.005/req | フォールバック時のみ |
| OpenAI gpt-4o-mini | 約 $0.15/1M tokens | 候補テキスト ≒ 500 tokens/req |

ノート 1件あたり最大 $0.10〜$0.20 程度。月間 1,000 ノートで $100〜200 の試算。コスト上限設計は `07_privacy_security_cost_policy.md` を参照。

---

### 実装前に最終確認が必要な事項

1. **Google Places API (New) の日本語対応状況**: `languageCode: 'ja'` パラメータで日本語名称が返るか確認が必要。
2. **Foursquare Places との比較テスト**: 日本の小規模カフェ・観光地での精度比較を Phase 12.5C 開始前に実施することを推奨。
3. **Google Maps ToS との整合性**: Places API 結果を Firestore にキャッシュする場合の利用規約確認（24時間キャッシュルール）。
4. **課金アカウントの確認**: Google Cloud プロジェクトで課金が有効になっているか。

---

## Map SDK 選定（Phase 12.5F 向け）

Phase 12.5F では本格的な地図 SDK を導入する。候補は以下の通り。

| SDK | 特徴 | Expo 対応 |
|---|---|---|
| react-native-maps | iOS: Apple Maps, Android: Google Maps。Expo 公式サポート。 | ◎ |
| expo-maps (beta) | Expo SDK 51+ で実験的サポート。 | △ (beta) |
| Mapbox Maps SDK | カスタムスタイル・オフライン対応。 | ○ (別設定必要) |

**推奨: react-native-maps**（Expo 公式サポート・実績多数）。EAS Development Build が必要。

この決定は Phase 12.5F 実装直前に最終確認が必要。
