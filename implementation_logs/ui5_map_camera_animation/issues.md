# UI-5 Issues

## 解決済み

### 1. ピンタップ / タイムラインタップ後の camera 移動が未実装だった (UI-4 issue)
- `mapRef` を追加し `animateToRegion` を呼ぶことで解決
- 安全ガードつきのため、位置情報なし・ref null の場合も問題なし

---

## 未解決（将来対応）

### 1. photoPreviewURLs フォールバック時の viewer index 整合 (UI-4 残件)

`group.photoIds` がない場合に `photoPreviewURLs` を photo strip に表示しているが、
viewer 遷移時に `placeGroupId` を渡しても viewer 側でフィルタリングできない可能性がある。
（viewer は PhotoDoc の id でフィルタリングするが、photoPreviewURLs は URL のみ）

→ UI-8 で対応検討。今回はスコープ外。

### 2. camera delta の最適化

現在は `latitudeDelta: 0.008` 固定。場所が離れている場合（例: 東京→大阪）はズームアウトしたほうが自然。
将来的には、全 group の bounds を考慮した動的 delta が望ましい。

→ 現状の fixed delta で十分な想定。将来の改善候補。
