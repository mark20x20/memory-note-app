# Phase 12.5: UI フローと画面設計

## 概要

Phase 12.5 で追加・変更する画面と、ユーザーフローを整理する。

---

## 追加・変更候補の画面

| 画面 | Route | Phase |
|---|---|---|
| ノート詳細（Places セクション追加） | `/(app)/notes/[noteId]/index` | 12.5E |
| 訪れた場所一覧 | `/(app)/notes/[noteId]/places` | 12.5E |
| 場所候補確認 | `/(app)/notes/[noteId]/places/[placeGroupId]` | 12.5E |
| 手動場所編集 | `/(app)/notes/[noteId]/places/manual` | 12.5E |
| ノート地図（本格 Map SDK） | `/(app)/notes/[noteId]/map` | 12.5F |

---

## Detail 画面への追加（Phase 12.5E）

### 現状の Detail 画面構成（Phase 12 完了時点）

```
[ヘッダー]
[写真サムネイル一覧]
[地図プレビュー（MapPreview — Phase 8 の簡易版）]
[AI 日記セクション]
[編集ボタン / メンバー管理ボタン / 共有カードボタン]
```

### Phase 12.5E での追加（地図プレビューの後に挿入）

```
[ヘッダー]
[写真サムネイル一覧]
[地図プレビュー（将来的に Phase 12.5F で Map SDK に置換予定）]

↓ 以下を追加 ↓

[── 訪れた場所 ──────────────────]
 • 浅草寺       tourist_attraction  ✅
 • 仲見世通り   shopping            🔍 要確認
 • 浅草駅      station             ✅
[「場所をすべて見る」→ places 画面]
[「地図で見る」→ map 画面]

[AI 日記セクション]
[編集 / メンバー / 共有カード]
```

### 「訪れた場所」セクションの詳細仕様

```typescript
// 表示ロジック
if (placeEnrichmentStatus === 'idle') {
  // 「場所を推定する」ボタンを表示
  // ボタン押下 → enrichNotePlaces を呼び出す
}

if (placeEnrichmentStatus === 'fetching') {
  // ローディングスピナー
  // 「場所情報を取得中...」テキスト
}

if (placeEnrichmentStatus === 'completed') {
  // topPlaceLabels の先頭3件をカード表示
  // confidence に応じた ✅ / 🔍 マーク
  // 「場所をすべて見る」リンク
}

if (placeEnrichmentStatus === 'failed') {
  // 「場所の取得に失敗しました」
  // 「再試行する」ボタン
}
```

---

## 訪れた場所一覧画面（`/places`）

### 目的
ノート内のすべての PlaceGroup を一覧表示し、ユーザーが確認・修正できる。

### 画面構成

```
[ヘッダー: 「訪れた場所」]
[再推定ボタン（owner/editor のみ）]

[PlaceGroup カード × N]
  ┌─────────────────────────────────┐
  │ 📍 浅草寺                       │
  │    tourist_attraction  ✅ 確認済 │
  │    写真 8枚 / 距離 45m           │
  │    confidence: 88%              │
  │                           [>] │
  └─────────────────────────────────┘

  ┌─────────────────────────────────┐
  │ 🔍 仲見世通り？                  │
  │    shopping  要確認              │
  │    写真 3枚 / confidence: 62%    │
  │    「候補を選ぶ」                 │
  │                           [>] │
  └─────────────────────────────────┘

[GPS なし写真]
  ┌─────────────────────────────────┐
  │ 📷 場所情報なし（5枚）           │
  │    GPS データなし               │
  └─────────────────────────────────┘
```

### 権限制御
- owner / editor: 再推定・修正ボタンを表示
- viewer: 閲覧のみ（再推定・修正ボタンを非表示）

---

## 場所候補確認画面（`/places/[placeGroupId]`）

### 目的
特定の PlaceGroup に対して候補一覧を表示し、ユーザーが1件を選択または手動入力できる。

### 画面構成

```
[ヘッダー: 「場所を確認」]

[地図ミニビュー（写真ピン表示 / Phase 8 の簡易版）]

[候補一覧]
  ┌─────────────────────────────────┐
  │ ⭐ 浅草寺（鹿苑寺）  [選択中]    │
  │    観光地 / 45m / ★4.7          │
  │    confidence: 88%              │
  └─────────────────────────────────┘
  ┌─────────────────────────────────┐
  │    仲見世通り                   │
  │    ショッピング / 80m / ★4.2    │
  │    confidence: 62%              │
  └─────────────────────────────────┘
  ┌─────────────────────────────────┐
  │    雷門                         │
  │    観光地 / 120m / ★4.5         │
  │    confidence: 55%              │
  └─────────────────────────────────┘

[「別の場所を入力する」→ manual 画面]
[「この候補で確定」ボタン]
```

---

## 手動場所編集画面（`/places/manual`）

### 目的
候補に適切なものがない場合に、ユーザーが場所名を直接入力する。

### 画面構成

```
[ヘッダー: 「場所を手動入力」]

[テキスト入力フィールド: 「場所名を入力（例: 自由が丘のカフェ）」]

[カテゴリ選択]
  ○ レストラン  ○ カフェ  ○ 観光地
  ○ 駅         ○ ホテル  ○ ショッピング
  ○ 公園       ○ その他

[「保存する」ボタン]
```

---

## ノート地図画面（`/(app)/notes/[noteId]/map`）（Phase 12.5F）

### 目的
ノート内の写真を本格的な地図 SDK 上にピン表示する。

### Phase 12.5F の前提条件
- `react-native-maps` または `expo-maps` の導入
- EAS Development Build が必要（Expo Go では動作しない）
- iOS: Apple Maps / Android: Google Maps

### 画面構成

```
[地図全画面表示]
  ↳ 写真グループのピン（カバー写真サムネイル + 枚数バッジ）
  ↳ ピン押下 → 場所名・写真サムネイル・件数のポップアップ
  ↳ ポップアップ → places/[placeGroupId] へ遷移

[「現在地に戻る」ボタン]
[「一覧に戻る」ボタン]
```

### フォールバック（Map SDK が使えない場合）
Phase 12.5F 実装前は、Phase 8 の `MapPreview`（View ベース）を引き続き表示する。

---

## 作成フロー（Create）への組み込み方針

### MVP では「保存後・Detail から手動実行」を推奨

```
[写真選択] → [ノート保存] → [Detail 画面]
                                  ↓
                        [「場所を推定する」ボタンを押す]
                                  ↓
                        [enrichNotePlaces 実行]
                                  ↓
                        [推定完了 → 「訪れた場所」セクションに表示]
```

**自動実行（保存時トリガー）は採用しない理由:**
- ノート保存の速度を落とさない
- ユーザーが場所推定を望まないケースへの対応（プライバシー観点）
- コスト制御（Places API を無意識に消費しない）
- GPS なし写真のみのノートへの無駄な API 呼び出しを防ぐ

---

## UI コンポーネント追加計画

| コンポーネント | 配置 | 説明 |
|---|---|---|
| `PlaceGroupCard` | `src/features/map/components/` | 場所カード（名称・カテゴリ・confidence） |
| `PlaceCandidateList` | `src/features/map/components/` | 候補一覧リスト |
| `PlaceStatusBadge` | `src/features/map/components/` | 確認済 / 要確認 バッジ |
| `VisitedPlacesSection` | `src/features/memoryNotes/components/` | Detail 画面の「訪れた場所」セクション |
| `usePlaceEnrichment` | `src/features/map/hooks/` | enrichNotePlaces 呼び出し + 状態管理 |
| `usePlaceGroups` | `src/features/map/hooks/` | PlaceGroup onSnapshot 購読 |
| `useSelectCandidate` | `src/features/map/hooks/` | 候補選択・確定 |
| `placeGroupRepository` | `src/core/repositories/` | Firestore PlaceGroup CRUD |

---

## カラー・デザイン方針

- `userConfirmed=true`: `colors.success` (#4CAF50) の ✅ バッジ
- `userConfirmed=false, confidence≥0.60`: `colors.warning` (#FF9500) の 🔍 バッジ
- `userConfirmed=false, confidence<0.60`: `colors.error` (#FF3B30) の ❓ バッジ
- カテゴリアイコン: SF Symbols / Material Icons の対応アイコンを使用
- 場所カードのアクセントカラー: `colors.mapAccent` (teal #4FA8A1)
