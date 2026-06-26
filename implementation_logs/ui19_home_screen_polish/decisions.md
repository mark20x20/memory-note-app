# UI-19 Home Screen Polish — 設計メモ

## 主要変更点

### 1. ノートカード: 横型 → 縦型（photo-first）

**旧実装**: 横 152×152px 正方形サムネイル + 右側にテキスト
**新実装**: カバー写真が上部 180px 全幅 + 下部にテキストブロック

理由:
- 写真を主役にする photo-first トーン
- 旅アルバムらしい見た目にする（spec: "feel like opening a beautiful memory album"）
- 写真がない場合は soft ivory プレースホルダー + 📷 emoji

### 2. Primary CTA Card を追加

ノート一覧の先頭に「新しい思い出を作る」カードを常時表示。
- 背景: `colors.surfaceWarm` (#FFF9F4)
- ボタン: primary coral (#F26B5B)
- FAB は維持（スクロール時の quick-access として残す）

理由: ユーザーが一覧を見ているときでも作成動線を自然に提示できる。

### 3. ヘッダーサブコピー変更

旧: 「あなたの大切な記録」
新: 「写真から、旅やおでかけを振り返ろう」

理由: 要件に明示。写真・旅のコンテキストを先出しする。

### 4. Empty state 刷新

旧: 📷 絵文字 + 「まだノートがありません」 + タイトル/メモ入力の説明
新: フレーム付き 📷 + 「最初の思い出ノートを作りましょう」 + 「写真から作る」ボタン

理由: 要件文言に合わせ、空状態でも写真起点の次のアクションを明示。

### 5. ノートカードにフォールバック追加

- title が空文字の場合 → 「無題の思い出」
- coverPhotoURL がない場合 → ivory プレースホルダー + emoji
- visitedPlacesSummary?.topPlaceLabels[0] が取得できれば 📍 place chip 表示

### 6. FAB は維持

Primary CTA Card がある状態でも FAB を残す。
スクロール中に素早く作成画面に飛べる利便性を優先。

## ナビゲーション（変更なし）

| アクション | 遷移先 |
|---|---|
| ノートカード tap | `/(app)/notes/${note.id}` |
| CTA card / FAB | `/(app)/create` |
| empty state CTA | `/(app)/create` |
| 設定アイコン | `/(app)/settings` |

## カラー設計

| 用途 | カラーコード |
|---|---|
| 画面背景 | `colors.background` = #FAF7F2 |
| ヘッダー背景 | `colors.surface` = #FFFFFF |
| CTA カード背景 | `colors.surfaceWarm` = #FFF9F4 |
| カバー placeholder | `colors.surfaceIvory` = #F4EEE6 |
| アクセント (CTA) | `colors.primary` = #F26B5B |
| 共有バッジ | `colors.mapAccentLight` / `mapAccent` |
