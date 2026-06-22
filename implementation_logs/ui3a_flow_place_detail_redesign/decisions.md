# UI-3A Design Decisions

## 1. usePlaceGroups — 共通フックでの購読一元化

**決定:** `edit.tsx` が `usePlaceGroups(noteId)` を1回だけ呼び、`groups` と `isLoadingGroups` を FlowsPanel / PlacesPanel に props で渡す。

**理由:** UI-2 では FlowsPanel と PlacesPanel がそれぞれ内部で `subscribePlaceGroupsByNoteId` を呼んでいた。同一 noteId に対して2つの Firestore リスナーが張られ、帯域とコストが2倍になっていた。フックを共通化することで購読を1本に集約。

## 2. places/[placeGroupId].tsx — eventMemo 編集UIを削除

**決定:** リデザイン後は eventMemo の編集フォームをこの画面から削除。

**理由:** UI-3A スペックは候補確認 (candidate confirmation) に集中することを目的とする。eventMemo の編集は flows/[placeGroupId].tsx (Flow Detail) で行うほうが意味的に自然。候補確認画面に編集フォームがあると目的が分散する。

**影響:** `updatePlaceGroupManuallyCallable` の import も不要になり削除。

## 3. places/[placeGroupId].tsx — mini map を非インタラクティブに

**決定:** `scrollEnabled={false}`, `zoomEnabled={false}` の 160h mini map を採用。

**理由:** 候補確認画面の主目的はリストから場所を選ぶこと。地図操作は「地図で確認」ボタン経由で専用マップ画面へ誘導するため、mini map は概要表示専用で十分。

## 4. 関連写真ストリップ — photoIds 優先, fallback は photoPreviewURLs

**決定:**
```ts
const relatedPhotoURLs = group.photoIds?.length > 0
  ? allPhotos.filter(p => group.photoIds.includes(p.id)).map(p => p.downloadURL)
  : group.photoPreviewURLs ?? [];
```

**理由:** group.photoIds が存在すればフル解像度URLを取得できる。存在しない場合でも photoPreviewURLs でサムネイルを表示できる。両方ない場合は写真セクション自体を非表示にする。

## 5. 候補選択後の UI 更新 — setGroup でローカル更新

**決定:** `selectPlaceCandidateCallable` 成功後に `setGroup(prev => { ...prev, selectedCandidateId, userConfirmed: true })` でローカル state を更新し、router.back() は行わない。

**理由:** UI-2 の旧実装は選択後即 `router.back()` していたが、UI-3A では選択後も画面に留まり他の候補と比較できるほうが UX が良い。サーバー側の変更は Firestore リアルタイム購読 (usePlaceGroups) が親画面で受け取る。
