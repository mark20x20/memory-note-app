# UI-8 Issues

## 解決済み

### 1. map.tsx: fallback 写真から viewer に placeGroupId を渡すと空表示

**旧挙動:**
- `selectedGroup.photoIds` が null → `groupPhotoURLs` は `photoPreviewURLs` の URL 配列
- 写真サムネイルをタップ → `viewer?initialIndex=${idx}&placeGroupId=${selectedGroup.id}`
- viewer は `placeGroupPhotoIds = []` (group.photoIds が null) → `allPhotos.filter(...) = []`
- 「写真がありません」と表示される

**修正:**
- `canViewGroupPhotos = canOpenGroupedPhotoViewer(selectedGroup)` で判定
- `false` の場合は `<Image>` のみ (opacity: 0.75)

### 2. flows/[placeGroupId].tsx: fallback 写真から viewer に placeGroupId を渡すと空表示

**旧挙動:**
- `group.photoIds` が null → `flowPhotos` は `photoPreviewURLs.map((url, i) => ({ id: String(i), downloadURL: url }))`
- hero タップ / strip タップ → `viewer?initialIndex=N&placeGroupId=${placeGroupId}`
- viewer: `placeGroupPhotoIds = []` → フィルタ結果 = 空 → 「写真がありません」

**修正:**
- `hasGroupPhotoIds = canOpenGroupedPhotoViewer(group)` で判定
- `false` の場合: hero は `<Image>` のみ、strip は `<Image key={...} style={stripThumbFallback}>` のみ

---

## 未解決（将来対応）

### 1. photoPreviewURLs から PhotoDoc への昇格

photoPreviewURLs は Google Places / Cloud Storage の thumbnail URL で、対応する PhotoDoc がない。
将来的に AI enrichment 後に PhotoDoc が作られた場合は自動的に photoIds が埋まり、
今回の `canOpenGroupedPhotoViewer` チェックが true になり viewer が開くようになる。

→ Cloud Functions / Firestore スキーマ変更なしに解決。現状の設計で自然に対応できる。

### 2. places/[placeGroupId].tsx の photo strip に viewer 遷移を追加する場合

現在 places 画面の関連写真は `<Image>` のみ。viewer を追加する場合は:
- `canOpenGroupedPhotoViewer(group)` を使って条件分岐
- `placeGroupId` を渡す場合は `group.photoIds` が必要

→ 将来の UI 拡張で対応。今回はスコープ外。
