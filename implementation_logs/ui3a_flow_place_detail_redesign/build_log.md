# UI-3A Build Log: Flow / Place Detail Redesign + usePlaceGroups

## 実装日: 2026-06-22

## 実装ファイル一覧

### 新規作成
- `src/features/placeIntelligence/hooks/usePlaceGroups.ts`
  - PlaceGroupDoc をリアルタイム購読する共通フック
  - `placeGroupRepository.subscribePlaceGroupsByNoteId` をラップ
  - noteId=null のときは groups=[] を返す
  - `{ groups, isLoading, error }` を返す

### 変更（二重購読解消）
- `src/features/memoryNotes/components/edit/panels/FlowsPanel.tsx`
  - 内部 `subscribePlaceGroupsByNoteId` を削除
  - props `groups: PlaceGroupDoc[], isLoadingGroups: boolean` を受け取るように変更

- `src/features/memoryNotes/components/edit/panels/PlacesPanel.tsx`
  - 内部購読を削除
  - props `groups: PlaceGroupDoc[], isLoadingGroups: boolean` を受け取るように変更

- `app/(app)/notes/[noteId]/edit.tsx`
  - `usePlaceGroups(noteId)` を追加
  - `placeGroups`, `groupsLoading` を FlowsPanel / PlacesPanel へ渡す

### リデザイン
- `app/(app)/notes/[noteId]/flows/[placeGroupId].tsx`
  - Hero image 280h (borderBottomLeftRadius/RightRadius: xxl)
  - Photo strip (stripPhotos = flowPhotos.slice(1, 6))
  - metaCard: timeRange / flowLabel(22px) / categoryChip / confirmedChip
  - eventMemo section
  - Mini map 160h (scrollEnabled/zoomEnabled=false)
  - Prev/next navigation (router.replace)
  - Actions: 「場所を確認・編集」(teal primary) / 「ノートを編集する」(ghost)

- `app/(app)/notes/[noteId]/places/[placeGroupId].tsx`
  - Header: "場所の確認"
  - Selected Place Card (category/confirmed/selected badges + placeName + address + eventMemo)
  - 関連写真ストリップ (horizontal scroll, 最大8枚)
  - Mini map 160h (scrollEnabled/zoomEnabled=false)
  - アクションボタン: 「地図で確認」(teal fill) / 「手動で修正」(ghost)
  - 訪問候補一覧 (priority / other に分類)
  - 各候補カードに「この場所にする」ボタン

## ビルド結果
- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (warnings 0, errors 0)
