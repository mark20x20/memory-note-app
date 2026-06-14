# Phase 12.5G-6 Next Steps

## 1. Preview v2 モックと実装の整合

- `memory-preview-screen-v2` を基準に UI 実装へ落とす
- 生成感のある文言が detail / preview に残っていないか確認する

## 2. Edit タブ構成の画面モック追加

- `概要` タブ
- `写真` タブ
- `流れ` タブ
- `場所` タブ
- `メモ` タブ

を個別にモック化すると、実装粒度がより明確になる。

## 3. ルーティング方針の整理

候補:
- `edit?tab=overview`
- `edit?tab=photos`
- `edit?tab=flows`
- `edit?tab=places`
- `edit?tab=memo`

## 4. Places 既存導線との接続確認

- `場所` タブから既存 `places/[placeGroupId]` にどう遷移するか
- `places/manual` をどのケースで使うか
