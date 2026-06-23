# UI-8 Build Log: Photo Viewer Alignment / photoPreviewURLs Fallback Fix

## 実施日: 2026-06-23

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/features/photos/utils/photoViewerNavigation.ts` | 新規作成 — `canOpenGroupedPhotoViewer` helper |
| `app/(app)/notes/[noteId]/flows/[placeGroupId].tsx` | hero / strip の viewer 遷移を条件分岐 |
| `app/(app)/notes/[noteId]/map.tsx` | photo strip の viewer 遷移を条件分岐 |

変更なし:
- `app/(app)/notes/[noteId]/photos/viewer.tsx` — ロジックは正しい (対応策は呼び出し側で解決)
- `app/(app)/notes/[noteId]/places/[placeGroupId].tsx` — 既に `<Image>` のみ (viewer 遷移なし)
- `app/(app)/notes/[noteId]/preview.tsx` — `placeGroupId` を渡していない。安全。

---

## viewer.tsx の挙動確認

### placeGroupId あり

1. `photoRepository.subscribePhotosByNoteId` で全 PhotoDoc を購読
2. `placeGroupRepository.subscribePlaceGroupsByNoteId` でグループの `photoIds` を取得
3. `allPhotos.filter(p => placeGroupPhotoIds.includes(p.id))` でフィルタリング
4. `initialIndex` でスクロール位置を設定

### placeGroupId なし

1. 全 PhotoDoc をそのまま表示
2. `initialIndex` でスクロール位置を設定

### fallback 時に placeGroupId を渡した場合の旧バグ

- `group.photoIds` が null/undefined → `placeGroupPhotoIds = []`
- `allPhotos.filter(p => [].includes(p.id))` → 空配列
- 「写真がありません」が表示される（ストリップには画像が見えているのに）

---

## 新規ヘルパー: canOpenGroupedPhotoViewer

```ts
// src/features/photos/utils/photoViewerNavigation.ts
export function canOpenGroupedPhotoViewer(group: {
  photoIds?: string[] | null;
}): boolean {
  return Array.isArray(group.photoIds) && group.photoIds.length > 0;
}
```

構造的型付けを使い、`PlaceGroupDoc` への直接依存を避けた。

---

## flows/[placeGroupId].tsx の変更

### 1. インポート追加

```ts
import { canOpenGroupedPhotoViewer } from '@/features/photos/utils/photoViewerNavigation';
```

### 2. hasGroupPhotoIds フラグ追加

```ts
const hasGroupPhotoIds = group ? canOpenGroupedPhotoViewer(group) : false;
```

### 3. Hero Photo: 条件分岐

```tsx
hasGroupPhotoIds ? (
  <TouchableOpacity onPress={() => router.push(`...viewer?initialIndex=0&placeGroupId=${placeGroupId}`)}>
    <Image ... />
  </TouchableOpacity>
) : (
  <Image ... />  // タップ無効
)
```

### 4. Strip Photos: 条件分岐

```tsx
stripPhotos.map((photo, idx) =>
  hasGroupPhotoIds ? (
    <TouchableOpacity key={photo.id} onPress={() => router.push(`...viewer?initialIndex=${idx+1}&placeGroupId=...`)}>
      <Image ... />
    </TouchableOpacity>
  ) : (
    <Image key={photo.id} style={[styles.stripThumb, styles.stripThumbFallback]} ... />
  )
)
```

fallback 時は `opacity: 0.75` で「閲覧のみ」を視覚的に示す。

---

## map.tsx の変更

### 1. インポート追加

```ts
import { canOpenGroupedPhotoViewer } from '@/features/photos/utils/photoViewerNavigation';
```

### 2. canViewGroupPhotos フラグ追加

```ts
const canViewGroupPhotos = selectedGroup ? canOpenGroupedPhotoViewer(selectedGroup) : false;
```

### 3. Photo Strip: 条件分岐

```tsx
groupPhotoURLs.map((url, idx) =>
  canViewGroupPhotos ? (
    <TouchableOpacity key={idx} onPress={() => router.push(`...viewer?initialIndex=${idx}&placeGroupId=...`)}>
      <Image ... />
    </TouchableOpacity>
  ) : (
    <Image key={idx} style={[styles.photoThumb, styles.photoThumbFallback]} ... />
  )
)
```

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- Functions build: 不要
