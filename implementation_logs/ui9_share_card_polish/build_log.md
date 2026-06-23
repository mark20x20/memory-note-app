# UI-9 Build Log: Share Card Polish / SNS Share Experience

## 実施日: 2026-06-23

## 既存実装の確認結果

`share.tsx` と `@/features/share/` は Phase 12 で既に実装済みの成熟した状態だった。

| 機能 | 既存 | UI-9 変更 |
|---|---|---|
| フォーマットセレクター (1:1/4:5/9:16) | ✓ あり | 初期値を square→portrait に変更 |
| カードプレビュー | ✓ あり (ShareCardPreview) | タイトルフォント / 場所ヒント追加 |
| 写真コラージュ | ✓ あり (PhotoCollage 1-4枚対応) | 変更なし |
| useShareCardCapture (captureRef) | ✓ あり | 変更なし |
| 保存 (MediaLibrary) | ✓ あり | 変更なし |
| 共有 (Sharing) | ✓ あり | 変更なし |
| エラー/成功バナー | ✓ あり | 変更なし |

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `app/(app)/notes/[noteId]/share.tsx` | デフォルトformat修正 / サブタイトル追加 / cardWrapper radius拡大 |
| `src/features/share/components/ShareCardPreview.tsx` | タイトルフォント 17→20 / 場所概要 (visitedPlacesSummary) 追加 |

---

## share.tsx の変更内容

### 1. デフォルトフォーマット修正

```ts
// 変更前
const [selectedFormat, setSelectedFormat] = useState<ShareCardFormat>('square');

// 変更後
const [selectedFormat, setSelectedFormat] = useState<ShareCardFormat>('portrait');
```

理由: 仕様書 "Recommended Default: default to 4:5" に準拠。Instagram feed に最適。

### 2. サブタイトル追加

```tsx
<ScreenHeader title="共有カード" onBack={() => router.back()} />
<View style={styles.subHeader}>
  <Text style={styles.subHeaderText}>思い出をきれいにまとめる</Text>
</View>
```

仕様書: "subtitle such as 思い出をきれいにまとめる"

### 3. cardWrapper borderRadius 拡大 / shadow 強化

```ts
// 変更前
borderRadius: 16,
shadowOpacity: 0.12, shadowRadius: 12, elevation: 5

// 変更後
borderRadius: 24,
shadowOpacity: 0.14, shadowRadius: 16, elevation: 6
```

仕様書: "card radius: 32" に近づけた (キャプチャとの兼ね合いで 24 に調整)。

---

## ShareCardPreview.tsx の変更内容

### 1. タイトルフォント拡大

```ts
// 変更前
title: { fontSize: 17, lineHeight: 24 }

// 変更後
title: { fontSize: 20, lineHeight: 28 }
```

仕様書: "preview card title: 20"

### 2. 場所概要 (locationHint) 追加

```tsx
{/* 場所概要 */}
{note.visitedPlacesSummary?.areaLabel ? (
  <Text style={styles.locationHint} numberOfLines={1}>
    📍 {note.visitedPlacesSummary.areaLabel}
  </Text>
) : note.visitedPlacesSummary?.topPlaceLabels?.[0] ? (
  <Text style={styles.locationHint} numberOfLines={1}>
    📍 {note.visitedPlacesSummary.topPlaceLabels[0]}
  </Text>
) : null}
```

```ts
locationHint: {
  fontSize: 12,
  fontWeight: '500',
  color: colors.mapAccent,
}
```

データソース:
- `note.visitedPlacesSummary.areaLabel`: エリアレベルラベル（例: "東京 浅草"）
- `note.visitedPlacesSummary.topPlaceLabels[0]`: 確定場所名の先頭

表示優先順: `areaLabel` > `topPlaceLabels[0]` > 非表示

---

## プレビューからの導線確認

```
preview.tsx → (action link) → /(app)/notes/${noteId}/share → share.tsx ✓
share.tsx → ScreenHeader.onBack() → router.back() → preview.tsx ✓
```

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- Functions build: 不要
