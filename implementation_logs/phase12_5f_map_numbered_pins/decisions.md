# Phase 12.5F-1 Map SDK / Numbered Pins — Decisions

## D1: react-native-maps を採用する

**決定:** Expo Go で追加設定なしに動作する `react-native-maps` を採用した。

**Why:**
- expo-maps は EAS Development Build が必要（Expo Go では動作しない）
- react-native-maps は iOS では Apple Maps をデフォルトで使用し、Expo Go で動作確認できる
- Android の Google Maps API key 設定・EAS Build は次フェーズで扱う

**How to apply:**
- `MapView` に `provider` を指定しない → iOS: Apple Maps（Expo Go可）、Android: Google Maps（EAS Build後）

---

## D2: Expo Go / iOS 確認を優先する

**決定:** 初期実装は iPhone 実機の Expo Go で確認できる範囲を優先した。

**Why:**
- EAS Development Build はセットアップに時間がかかる
- iOS / Apple Maps は Maps API key 不要で即時確認できる
- Android 対応は D1 の EAS Build 導入後に対処する

---

## D3: 番号付きピン（#N）を表示する

**決定:** `NumberedMarkerView` カスタムコンポーネントで `#1`, `#2`, `#3` をピン内に表示する。

**Why:**
- 候補確認画面（places/[placeGroupId].tsx）のカード番号と対応させるため
- ユーザーが「リストの#2は地図のどこ？」と参照できるようにする
- DB 保存不要（表示配列の index + 1 で計算）

**How to apply:**
- `groupsWithLocation` 配列の index + 1 を番号とする
- 確認済み: teal 塗りつぶし / 要確認: 白地 + teal ボーダー

---

## D4: PlaceGroup カードとピン番号を対応させる

**決定:** 地図下部の横スクロールカードと Marker の番号を同じ配列 index から生成する。

**Why:**
- 同一配列から生成するため常に一致する
- カードをスクロールしながら地図と見比べやすい

---

## D5: MapPreview を残す

**決定:** Phase 8 の `MapPreview` コンポーネントは削除せず、Detail 画面の地図セクションにそのまま残す。

**Why:**
- MapPreview は外部SDK不要の軽量な疑似地図UIで、react-native-mapsが使えない環境でも機能する
- 今回の Map screen は「本格地図画面」として別途追加したもの
- フォールバックとして価値がある

---

## D6: タイムラインは仮表示に留める

**決定:** 旅順プレビューは「表示順（= createdAt 昇順）」を使い、撮影時刻ベースの正確な順序は実装しない。

**Why:**
- PlaceGroup に `startAt` / `endAt` 等の撮影時刻サマリーが未整備
- 正確な旅順には写真撮影時刻の集計が必要で、今フェーズの範囲外
- 「仮の順序」であることを UI 上で明示し、ユーザーの誤解を防ぐ

---

## D7: `npm install --legacy-peer-deps` で react-native-maps を導入

**決定:** `npx expo install` の peer dependency 競合（react@19.1.0 vs react@^19.1.4）を `--legacy-peer-deps` で回避した。

**Why:**
- Expo SDK 54 が依存する react-native@0.81.6 は react@^19.1.4 を要求
- プロジェクトは react@19.1.0 固定（Expo SDK 54.0.0 の指定）
- `--force` より `--legacy-peer-deps` の方が既存パッケージを破壊しない
- react-native-maps の実際の peer dep は `>= 17.0.1` なので機能上の問題はない
