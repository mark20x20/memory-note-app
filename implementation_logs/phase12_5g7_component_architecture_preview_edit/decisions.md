# Phase 12.5G-7 Decisions

## Preview は専用 route として切り出す前提にする

`detail` と `edit` の間にある感情的な閲覧面として、
`preview.tsx` を独立 route にする前提で設計した。

理由:
- Preview の責務が明確になる
- Detail と Edit の両方から設計判断を引き剥がせる
- UI の没入感を保ちやすい

## Edit は 1 route + 内部 tab が最初に最も安全

編集を route 分割しすぎるより、
まずは `edit.tsx` で tab state を持つ構成を推奨した。

理由:
- 保存導線を一元化しやすい
- unsaved state を跨いで保持しやすい
- 既存 `edit.tsx` からの移行が現実的

## Draft state は親 hook に集約する

各タブで別々に state を持ちすぎると、
保存・dirty判定・タブ移動時の保持が壊れやすい。

そのため:
- `useNoteEditDraft`

のような親 hook に集約し、
panel には state slice と callback を渡す方針にした。

## 既存の places / flows route は捨てずに接続する

すでに:
- `flows/[placeGroupId]`
- `places/index`
- `places/[placeGroupId]`

などの導線があるため、
全部を edit タブ内に閉じ込めるより、
軽い編集はタブ内、深い編集は既存 route へ遷移する構成にした。

## shared/ui に入れるものは慎重にする

汎用化しすぎると逆に保守が重くなるため、
本当に横断利用するものだけ `shared/components/ui` に寄せる方針にした。
