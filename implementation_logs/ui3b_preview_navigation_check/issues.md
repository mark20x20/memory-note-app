# UI-3B Issues

## 解決済み

### 1. preview.tsx の photosLoading ゲートによる地図表示遅延
- **問題:** `EventMapPreview` が `photosLoading` 完了まで非表示だった
- **影響:** 写真ロードに関係なく地図が遅延表示される
- **解決:** ゲートを削除し、常に `EventMapPreview` を表示

### 2. 重複する "地図を見る" リンク
- **問題:** `EventMapPreview` の footer リンクと preview.tsx の `mapLink` が重複
- **影響:** 画面に "地図で見る" と "地図を見る →" が2つ並ぶ
- **解決:** preview.tsx の `mapLink` を削除

### 3. aiDiary が preview.tsx に表示されていなかった
- **問題:** 仕様の "memo / aiDiary" 要件に対してメモのみ表示
- **解決:** `aiDiaryStatus` が completed/edited の場合にのみ AI日記セクションを追加

---

## 未解決（UI-7 以降で対応）

### 1. index.tsx と preview.tsx の役割重複

**現状:**
- `index.tsx` (ノート詳細): cover photo 220h / title / date / noteType / role / photo chips / VisitTimeline / AiDiarySection / EventMapPreview / members / share card / edit button
- `preview.tsx` (プレビュー): hero photo 360h / thumbnail strip / title / date / photo count / VisitTimeline / EventMapPreview / memo / aiDiary / edit CTA

**主な違い:**
| 項目 | index.tsx | preview.tsx |
|---|---|---|
| カバー写真 | 220h | 360h hero |
| サムネイルストリップ | なし | あり |
| AI日記 | AiDiarySection (regenerate 付き) | 読み取り専用表示 |
| メンバー管理 | canManageMembers で表示 | なし |
| noteType / role chips | あり | なし |
| 編集 CTA | header の "編集" ボタンのみ | header ボタン + 下部 CTA |

**リスク:** 両画面が独立して VisitTimeline と EventMapPreview を Firestore 購読するため、
同時に両画面が表示されることはないが、購読コストが2系統存在する（通常は問題ない）。

**推奨判断 (UI-7 向け):** `preview.tsx` を主表示画面として採用。`index.tsx` は廃止か管理者向けに絞り込む。

### 2. flows/[placeGroupId].tsx のフォトビューアー遷移

**問題:** 「hero 写真をタップ → photo viewer」が `initialIndex=0` で全ノート写真のビューアーを開く。
フロー単位でフィルタリングされた viewer を開くには `placeGroupId` パラメータが必要。

**現状コード:**
```tsx
router.push(`/(app)/notes/${noteId}/photos/viewer?initialIndex=0`)
```

**改善案 (UI-4 以降):**
```tsx
router.push(`/(app)/notes/${noteId}/photos/viewer?initialIndex=0&placeGroupId=${placeGroupId}`)
```
`viewer.tsx` は `placeGroupId` パラメータに対応しており、フィルタリング機能は実装済み。

### 3. VisitTimelineSection の初期ロードスピナー

**問題:** `VisitTimelineSection` は `enrichmentStatus === 'fetching'` のみスピナーを表示。
初回 Firestore データ取得中（groups=[] かつ enrichmentStatus !== 'fetching'）は空状態が表示される。

**影響:** 軽微。Firestore の onSnapshot は通常 1〜2 秒以内に応答するため、ちらつきはほぼ感じられない。

**対応不要の理由:** UI-3B スコープ外。VisitTimelineSection に `isLoading` state を追加すると
コンポーネントが複雑になり、現状の問題が軽微なため見合わない。
