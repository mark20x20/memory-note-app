# UI-19 Home Screen Polish — 次のステップ

## 優先度: 高

### Featured Memory Hero の追加
- ノートが2件以上ある場合、最新ノートを 240〜300px の大カードで最上部に表示
- ヒーローカードには cover photo + title + date + place chip + AI diary excerpt
- 2件目以降を「最近の思い出」セクションに表示する分割レイアウト

## 優先度: 中

### Quick Access カード（地図・カレンダー）
- Map screen と Calendar screen が整った段階で追加
- ホーム下部に 2列のアクセスカードとして配置

### カバー写真なし Placeholder の改善
- グラデーション or アプリカラーのソフト背景に変更
- 写真がないことをより自然に見せる

### ノートカードの updatedAt 表示
- 「〇〇日前に編集」形式の相対日付表示
- `formatRelativeDate()` ユーティリティを shared/utils に追加

## 優先度: 低

### Skeleton Loading
- screen spec では loading 時にスケルトン UI を表示する想定
- 現状は ActivityIndicator のみ
- `react-native-skeleton-placeholder` 等の導入が必要

### Pull-to-refresh
- ScrollView に `RefreshControl` を追加して手動再取得できるようにする

## 次推奨アクション

`UI-20: Create Memory Screen Polish` か `UI-20: Calendar Screen Polish`
Home から自然に繋がる Create flow か、Quick Access から繋がる Calendar を整備する。
