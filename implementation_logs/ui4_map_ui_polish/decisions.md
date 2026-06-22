# UI-4 Design Decisions

## 1. レイアウト順序: Selected Place Card を最優先

**決定:** map直下に Selected Place Card を配置し、ルートセレクターは最後に移動。

**理由:** スペック `04_map_screen.md` の情報優先度:
1. map with pins
2. selected place summary ← これが2番
3. linked photos
4. route/order context
5. secondary filters (= route selector)

旧実装はルートセレクターが最上位にあり、utility-map に見えた。
memory-led 体験では「どの場所を見ているか」が先に来るべき。

## 2. selectedGroupId: null をデフォルトとして最初のグループを表示

**決定:** `useState<string | null>(null)` で初期化し、
`selectedGroup = selectedGroupId が指す group ?? groupsWithLocation[0]`

**理由:** `useEffect` で初期化すると re-render タイミングの問題が起きやすい。
null を "最初のグループ" として解釈するロジックで十分シンプル。

## 3. ピン選択とタイムライン選択を統一

**決定:** ピンタップとタイムラインアイテムタップの両方で `setSelectedGroupId` を呼ぶ。

**理由:** スペックの「Tap a Pin → selected place card updates」と「Tap Route Summary Item → center map on that place / update selected state」を実装。
地図の camera animation は complexity が高く今回はスコープ外とし、selectedGroup の更新のみ行う。

## 4. 写真: photoIds 優先 → photoPreviewURLs フォールバック

**決定:**
```ts
group.photoIds?.length > 0
  ? allPhotos.filter(p => group.photoIds.includes(p.id)).map(p => p.downloadURL)
  : group.photoPreviewURLs ?? []
```

**理由:** place detail / flow detail と同じパターン。photoIds があれば Firestore の PhotoDoc から取得し、viewer タップ時の placeGroupId フィルタリングと整合する。

## 5. ルートの視覚設定を memory-led に

**決定:**
- 直線: teal (colors.mapAccent), width=2, dashPattern=[8,5]
- 実ルート: tealカラー系, width=3 (旧3.5より細め)
- フォールバック: #BBBBBB, width=1.5, dash (旧 #AAAAAA)
- showsCompass / showsScale: false

**理由:** ナビアプリのような aggressive なルート表示を避け、地図を思い出の背景として扱う。
ルートラインは「存在すること」が分かれば十分で、太くする必要はない。

## 6. ルートチップ順序: 直線/徒歩/車/公共交通/区間別

**決定:** スペック記述の順序 `直線 / 徒歩 / 車 / 公共交通 / 区間別` に従う。

**旧コード:** 公共交通が IIFE で最後に追加されていた（実装上の都合で順序がズレていた）
**新コード:** `['walking', 'driving', 'transit']` の map でまとめてレンダー → 区間別

## 7. RouteGenerationPanel の内部ロジックは一切変更しない

**決定:** generateNoteRoutesCallable / getNoteRouteSegmentsCallable の呼び出しパターンを保持。
- mixed → `getNoteRouteSegments({ noteId })` のみ（travelMode を送らない）
- single → `{ noteId, travelMode: effectiveMode }`
- straight → routeSegments call しない

**理由:** 過去にバグが出た箇所（指示に明示）。UI の見た目変更と完全に分離して安全を確保。

## 8. getStatusBadge を削除

**決定:** `getStatusBadge` 関数を削除し、Selected Place Card と Timeline では `userConfirmed` の真偽のみ表示。

**理由:** `confidence >= 0.6` による色分けはユーザーへの技術的な情報露出。
memory-led 体験では「確認済み/未確認」という simple なステートのみが適切。
