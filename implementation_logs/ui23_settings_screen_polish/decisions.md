# UI-23 Settings Screen Polish — 設計メモ

## 主要変更点

### 1. ScreenHeader → カスタムヘッダー

**旧実装**: `ScreenHeader title="設定"` + onBack
**新実装**: インラインカスタムヘッダー

- 背景: `colors.surface` / ボーダー: `colors.border`
- 左: ivory ラウンド戻るボタン (40×40)
- 中央: "設定" (16px, fontWeight 700) + "アカウントとアプリの設定" (11px, textSecondary)
- 右: 対称スペーサー（ダミー View、同サイズ）

理由: Onboarding / Create / Preview / Edit と統一した warm ヘッダー。

### 2. Profile Card 改善

**変更点**:
- `photoURL` が存在する場合は `Image` で表示（新規対応）
- photoURL なし → initials (displayName の先頭1文字) / displayName なし → "📔" emoji
- `borderRadius.full` に統一（pill → 正円）
- プランバッジを pill 形状に (`borderRadius.full`)
- カードに subtle shadow 追加

**fallback 文言**:
- displayName なし → "思い出ノートユーザー" (旧: "未設定")
- email なし → "メールアドレス未設定" (旧: "未設定")

理由: "未設定" はユーザーに不親切な表現。warm な fallback に変更。

### 3. セクション構成の整理

**旧**:
1. アカウント
2. プライバシー・権限
3. サポート・情報
4. 開発用ツール (DEV)
5. ログアウト

**新**:
1. アカウント（displayName / email / プラン）
2. アプリ（利用規約 / プライバシーポリシー / お問い合わせ）
3. 開発者メニュー (DEV only) — "開発用ツール" → "開発者メニュー"
4. ログアウト

理由: 「プライバシー・権限」と「サポート・情報」を「アプリ」に統合してシンプルに。
開発者ラベルを "開発用ツール" → "開発者メニュー" に変更（日本語として自然）。

### 4. 未実装リンクに「準備中」バッジ

**旧**: `SettingsLinkRow` に `›` 矢印のみ（押しても何も起きない）
**新**: `comingSoon?: boolean` prop を追加。
- comingSoon: "準備中" バッジ表示 + disabled
- 通常: `›` 矢印 + onPress

理由: 何も起きないタップは体験が悪い。準備中であることを明示。
開発者向け文言（"Phase X" / "TODO"）は出さない。

### 5. Alert テキスト改善

**旧**: "ログアウト" / "ログアウトしますか？"
**新**: "ログアウトしますか？" / "この端末からアカウントをログアウトします。"

理由: より丁寧で具体的な説明。

### 6. ログアウトボタン soft 化

**旧**: `borderColor: colors.error` (#EF4444 = 濃い赤)
**新**: `borderColor: '#EF9999'` (soft red)

理由: 赤が強すぎて不安を煽る。outline スタイルのまま soft red に調整。

### 7. バージョン表記

**旧**: "Memory Note v1.0 (Phase 4)"
**新**: "Memory Note v1.0"

理由: "Phase 4" は開発者向けの表現。ユーザーに出すべきでない。

## 変更しなかったもの

- `authRepository.logout()` — 変更なし
- `router.replace('/(auth)/onboarding')` — logout 後の遷移変更なし
- `useAuth()` — 変更なし
- `authState.user.plan` — pro/free 判定変更なし
- `__DEV__` guard の開発者メニュー — 表示条件変更なし
