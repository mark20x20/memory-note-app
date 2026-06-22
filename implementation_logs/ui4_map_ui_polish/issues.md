# UI-4 Issues

## 解決済み

### 1. console.warn がリリースビルドで出力されていた
- `console.warn('[map] loadRouteSegments error:', err)` → `if (__DEV__) console.warn(...)`

### 2. ルートチップ順序が仕様と異なっていた
- 旧: 直線/徒歩/車/区間別/公共交通
- 新: 直線/徒歩/車/公共交通/区間別

### 3. UI-3B issue: flows/[placeGroupId].tsx の viewer が placeGroupId を渡していなかった
- hero photo タップ: `?initialIndex=0` → `?initialIndex=0&placeGroupId=${placeGroupId}`
- strip photo タップ: `?initialIndex=${idx+1}` → `?initialIndex=${idx+1}&placeGroupId=${placeGroupId}`
- viewer.tsx はすでに placeGroupId フィルタリングに対応済みのため、このパラメータで適切にフィルタリングされる

---

## 未解決（将来対応）

### 1. ピンタップ後の地図 Camera Animation

**問題:** 選択したピンが地図の見えない領域にある場合、camera が移動しない。

**現状:** `setSelectedGroupId` で下部カードは更新されるが、地図表示領域は変わらない。

**解決策 (UI-5 以降):**
```ts
const mapRef = useRef<MapView>(null);
// ピンタップ時に:
mapRef.current?.animateToRegion({ latitude: group.latitude, longitude: group.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 300);
```
`MapView` に `ref={mapRef}` を渡すことで実現可能。

### 2. 横スクロール写真ストリップと map pin の連動

**問題:** 写真をスワイプしても地図のピン選択が変わらない。

**仕様 (spec):** "Swipe Photo Cards → user can browse memory moments at the selected place → pin selection stays stable unless card group changes"

**現状:** ピン選択は stable（仕様通り）。写真スワイプ時のコールバックは実装していないため問題なし。

### 3. 複数の PlaceGroup を場所カードとして見せる UI が削除された

**旧実装:** 横スクロールで全 PlaceGroup を同時表示するカード群があった。

**新実装:** Selected Place Card（1件のみ）+ compact timeline（全件）

**評価:** スペックは "Section 2: Selected Place Card → immediately below map" と明示しており、全件横スクロールは spec の Section 4 の "compact timeline" に相当する。仕様に沿った変更。

### 4. 写真ストリップの placeGroupId フィルタリングと viewer initialIndex の整合

**問題:** viewer が `placeGroupId` でフィルタリングした場合、`initialIndex` は allPhotos の index ではなくフィルタ後の index が必要。

**現状:** `groupPhotoURLs` は `allPhotos.filter(p => group.photoIds.includes(p.id))` で作成し、index は 0〜7 (フィルタ後)。viewer に `placeGroupId` を渡すと viewer 側でフィルタリングするため、フィルタ後の index と一致する（正しい）。

**ただし:** `photoIds` がなく `photoPreviewURLs` を使っている場合、viewer の placeGroupId フィルタと一致しない可能性がある。この場合 viewer は placeGroupId でフィルタリングするが、プレビューURLに対応する PhotoDoc が見つからない可能性がある。photoPreviewURLs フォールバック時は viewer タップを無効化するか、 placeGroupId を渡さない方が安全かもしれない。

→ 軽微な問題のため UI-5 で対応検討。
