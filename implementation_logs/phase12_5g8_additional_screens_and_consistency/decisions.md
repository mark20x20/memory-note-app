# Phase 12.5G-8 Decisions

## 追加画面も既存画面と同じ粒度で揃える

追加した 5 画面についても、既存主要画面と同じ設計粒度で記述した。

基準:
- Screen ID
- Purpose
- UX Role
- Primary Design Principle
- Information Priority
- Layout Structure
- Components
- Detailed Style Tokens

## 初期に作成した画面は見出し粒度を補正する

最初の段階で作成した一部画面は、
内容は十分でも見出し構造だけ少し浅かった。

そのため今回は:
- Home
- Memory Detail
- Map
- Calendar
- Share Card

の見出しを補正し、実装時の読みやすさを揃えた。

## 追加画面の実装設計も route / feature 構成に合わせて作る

モックだけで終わらせず、
既存の Expo Router / features 構成に乗る形で component architecture まで定義した。
