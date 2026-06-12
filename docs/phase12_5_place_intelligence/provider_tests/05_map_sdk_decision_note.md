# Map SDK 選定メモ — Phase 12.5F 向け

## 対象

Phase 12.5F（Map SDK / Pin Plotting）では、現在の `MapPreview`（React Native View ベースの擬似地図）を、本格的な地図 SDK によるピン表示に置き換える。

このドキュメントでは、候補 SDK の比較と現時点の推奨をまとめる。

---

## 比較対象

| SDK | バージョン (2025年6月時点) | 分類 |
|---|---|---|
| `react-native-maps` | 1.x | 実績あり・安定版 |
| `expo-maps` | beta (Expo SDK 54) | 実験的・Expo 公式 |
| Mapbox Maps SDK | `@rnmapbox/maps` 10.x | 商用・カスタムスタイル |

---

## 比較表

| 評価軸 | react-native-maps | expo-maps (beta) | Mapbox |
|---|---|---|---|
| **Expo Go で動くか** | ❌ ネイティブモジュール必須 | 🔶 条件付き（SDK 53+で一部対応） | ❌ ネイティブ必須 |
| **Development Build 必要か** | ✅ 必要 | ✅ 基本的に必要 | ✅ 必要 |
| **iOS 対応** | ✅ Apple Maps / Google Maps | ✅ Apple Maps | ✅ Mapbox独自 |
| **Android 対応** | ✅ Google Maps | ✅ Google Maps | ✅ Mapbox独自 |
| **地図プロバイダ** | iOS: Apple Maps, Android: Google Maps | iOS: Apple Maps, Android: Google Maps | Mapbox（独自スタイル） |
| **カスタムピン（写真サムネイル）** | ✅ `<Marker>` に `<Image>` を配置可能 | △ 制限あり（beta）| ✅ カスタムシンボル可 |
| **Firebase Storage URL の写真** | ✅ React Native `<Image>` で問題なし | 🔶 要確認 | ✅ 可 |
| **依存関係の重さ** | 中（Google Maps / Apple Maps の SDK に依存） | 軽め（Expo 管理） | 重い（Mapbox SDK 全体） |
| **Expo managed workflow との相性** | ○（EAS Build で問題なし） | ◎（Expo 公式） | △（追加設定が必要） |
| **Android Maps API キー** | 必要（`app.json` に設定） | 必要 | 必要（Mapbox token） |
| **iOS Maps API キー** | 不要（Apple Maps はデフォルト） | 不要 | 必要（Mapbox token） |
| **ドキュメント・コミュニティ** | ◎（豊富・実績多数） | △（beta・変更多い） | ○（英語中心） |
| **導入リスク** | 低（実績多数） | 高（beta・破壊的変更の可能性） | 中（安定しているが重い） |
| **Release v1 での現実性** | **◎ 採用推奨** | **△ 様子見** | **○ 代替候補** |

---

## 各 SDK の詳細

### react-native-maps

```
Expo install: npx expo install react-native-maps
```

- iOS: Apple Maps（`PROVIDER_DEFAULT`）または Google Maps（`PROVIDER_GOOGLE`、追加設定必要）
- Android: Google Maps（`PROVIDER_GOOGLE`）。`app.json` に `googleMapsApiKey` 設定が必要
- `<MapView>` + `<Marker>` のコンポーネントモデルが React Native に自然に溶け込む
- カスタムピン: `<Marker>` の `children` に `<Image>` を配置してサムネイル付きピンを作れる
- EAS Build で iOS / Android の両方でビルド可能

**Phase 12.5F での使い方（概要）:**
```tsx
import MapView, { Marker } from 'react-native-maps';

<MapView
  style={{ flex: 1 }}
  initialRegion={{
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }}
>
  {placeGroups.map(group => (
    <Marker
      key={group.id}
      coordinate={{ latitude: group.latitude, longitude: group.longitude }}
      title={group.label}
    >
      {/* カスタムピン: サムネイル画像 + 枚数バッジ */}
    </Marker>
  ))}
</MapView>
```

### expo-maps (beta)

```
Expo install: npx expo install expo-maps
```

- Expo SDK 53+ で実験的対応。API は安定していない可能性がある
- `expo-maps` は `react-native-maps` のラッパーではなく、Expo が独自実装している
- Expo Go での対応状況: SDK 54 時点では **EAS Development Build が必要な場合が多い**（Expo Go では地図が表示されないことがある）
- **Phase 12.5F では採用しない**。beta 段階が解除された時点で再検討する

### Mapbox (`@rnmapbox/maps`)

- カスタムスタイル・オフライン地図・より高度なピンカスタマイズが可能
- Mapbox アクセストークンが必要（`MAPBOX_PUBLIC_TOKEN` を `app.json` に設定）
- **モバイルアプリバンドルにトークンが含まれる**（`GOOGLE_MAPS_API_KEY` と同様）
- Places API の代わりに Mapbox Geocoding API も使える
- **Phase 12.5F では第二候補。** react-native-maps で対応できない高度な表示要件が出た場合に検討

---

## 現時点の推奨

```
第一候補: react-native-maps

理由:
- 実績が多く、iOS / Android 両対応
- Expo managed workflow + EAS Build との相性が良い
- <Marker> に <Image> を配置してカバー写真付きピンを実現できる
- Firebase Storage URL の写真を React Native <Image> で問題なく表示できる
- カスタムクラスタリング等の高度な機能も npm で対応可能

注意:
- Expo Go だけでは確認できない（EAS Development Build が必要）
- Android: app.json に googleMapsApiKey を設定する必要がある
  → Maps SDK for Android の APIキーを Google Cloud Console で発行・制限設定する
  → この APIキーは app.json に入れるが、Android アプリにバンドルされることを理解した上で使用する
  → API制限: Maps SDK for Android のみに制限する
- Phase 12.5F 開始前に eas.json の development profile を確認・作成しておく
```

---

## EAS Build 準備チェック（Phase 12.5F 前に実施）

- [ ] `eas.json` が存在し、`development` profile が設定されているか
- [ ] `npx eas whoami` でログイン済みか
- [ ] Android 向け Google Maps APIキー（Maps SDK for Android）の取得・設定計画があるか
- [ ] iOS 向けは Apple Maps がデフォルトのため追加設定不要（確認）

---

## 最終決定のタイミング

**Phase 12.5F の実装開始直前（Phase 12.5E 完了後）に最終決定する。**

その時点で `expo-maps` の安定版が出ていれば再評価する。それまでは `react-native-maps` を第一候補として設計を進める。
