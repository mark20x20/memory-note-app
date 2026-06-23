# UI-9 Issues

## 解決済み

### 1. デフォルトフォーマットが 1:1 (square) になっていた

仕様書では 4:5 (portrait) が推奨デフォルト。
`useState<ShareCardFormat>('square')` → `'portrait'` に修正。

### 2. カードに場所情報が表示されていなかった

仕様書: "title / date / place / diary excerpt"
`note.visitedPlacesSummary.areaLabel` または `topPlaceLabels[0]` を location hint として追加。

### 3. タイトルフォントが仕様より小さかった

仕様書: "preview card title: 20"
`fontSize: 17` → `fontSize: 20` に修正。

---

## 未解決（将来対応）

### 1. mini map が share card に表示されていない

仕様書: "mini map or location cue" がカードに含まれるとある。
現在は文字の location hint のみ。

→ EventMapPreview や静止画マップを card 内に埋め込む場合、
  MapView を captureRef の対象 View 内に入れる必要があり実装が複雑になる。
  UI-10 以降で検討。

### 2. Card Information Controls (title/date/place on/off) が未実装

仕様書 Section 3: "Optional controls for what to show"
→ UI-9 スコープ外。将来のフェーズで切り替えトグルを追加する。

### 3. visitedPlacesSummary が null の場合、場所情報が表示されない

`visitedPlacesSummary` は placeEnrichment が完了したノートのみ存在する。
未処理のノートや古いノートでは location hint が非表示になる。

→ graceful fallback として許容。表示できる場合だけ表示する。

### 4. PhotoCollage の 4 枚グリッドが仕様の "one main photo" とずれる

仕様書は「1枚の大きなメイン写真」を推奨。現在は最大 4 枚グリッド。

→ 1 枚のときは正しく大きく表示される。2〜4 枚のグリッドは「思い出感」があり許容。
  将来 hero-first レイアウト（大きな1枚 + 小さなサムネイル行）に変更することを検討。
