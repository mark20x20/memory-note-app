# Phase 12.5G-7 Next Steps

## 1. 最小実装単位を決める

推奨順:
- `preview.tsx`
- `NotePreviewScreenContent`
- `EditTabBar`
- `OverviewEditPanel`

## 2. `useNoteEditDraft` の型を先に決める

- `EditTabKey`
- `NoteEditDraft`
- `FlowEditDraft`
- `PlaceEditDraft`

を先に確定すると実装がぶれにくい。

## 3. 現行 `edit.tsx` の分割を始める

まず route から:
- header
- content
- save bar

を剥がすだけでも保守性がかなり上がる。

## 4. Preview のデータ表示ソースを決める

`memo` を主に見るのか、
`aiDiary` を主に見るのか、
両方見せるのかを UI 実装前に整理する必要がある。

## 5. Places / Flows の deep link 方針を決める

Edit タブから既存 route に飛ばす場合の戻り導線も含めて整理する。
