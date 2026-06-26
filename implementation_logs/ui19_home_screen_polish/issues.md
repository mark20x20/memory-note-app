# UI-19 Home Screen Polish — 課題・既知の問題

## 解決済み

### #1 VisitedPlacesSummary の型不明
- **問題**: noteRepository.ts で `VisitedPlacesSummary` を import しているが、型定義の場所が不明
- **解決**: `src/features/map/types/index.ts:87` を確認し、`topPlaceLabels: string[]` フィールドが存在することを確認して利用

## 残存課題

### #2 ノートカード写真なし時の見た目がシンプルすぎる
- **内容**: coverPhotoURL がない場合は ivory 背景 + 📷 emoji のみ
- **改善案**: グラデーション（暖色 → アイボリー）にするとより warm な印象になる
- **対応**: 次フェーズで検討

### #3 スペック記載の "Featured Memory" hero は未実装
- **内容**: screen_specs/01_home_screen.md には最新ノートをヒーローカード（240〜300px）として最上部に大きく表示する案がある
- **判断**: 今回は要件定義を優先し Primary CTA Card + uniform note cards 構成を採用
- **対応**: 将来的にノートが複数溜まった段階で featured hero を追加検討

### #4 Quick Access カード（地図で見る / カレンダーで見る）が未実装
- **内容**: screen_specs にはマップ・カレンダー Quick Access カードの記載あり
- **判断**: 今回はUI整理を優先し、機能追加は対象外とした
- **対応**: 次フェーズで Calendar / Map screens が整ってから追加する
