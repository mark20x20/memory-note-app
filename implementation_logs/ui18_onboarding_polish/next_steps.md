# UI-18 Onboarding Polish — 次のステップ

## 優先度: 高

### first-run flag の実装
- AsyncStorage または SecureStore に `hasSeenOnboarding` フラグを保存
- `app/index.tsx` でフラグを読み取り、未視聴の場合のみ `/(auth)/onboarding` にリダイレクト
- ログアウト時にフラグをリセットするかどうか要検討

## 優先度: 中

### ヒーロービジュアルの強化
- 現状は絵文字アイコン（📔）のみ
- 旅の写真をモック表示するイメージカード（コラージュ風）に置き換えるとより photo-first な印象になる

### アニメーション
- ScrollView の各セクションにフェードイン／スライドインアニメーションを追加
- `react-native-reanimated` を利用する想定

## 優先度: 低

### A/B テスト対応
- CTA 文言の変更（「はじめる」「無料で始める」など）をテストできる仕組みの検討
