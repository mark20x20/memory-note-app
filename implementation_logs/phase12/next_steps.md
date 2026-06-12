# Phase 12 Next Steps — SNS Share Card

## Phase 12 完了前の必須確認事項

### 1. TypeScript / Lint チェック（実施済み）
```
npx tsc --noEmit  → Exit 0
npx expo lint     → Exit 0
```

### 2. デプロイ（今回は不要）
Cloud Functions / Firestore Rules / Storage Rules の変更なし。
デプロイは不要です。

### 3. Expo Go での手動確認フロー

```
前提:
- ログイン済みのユーザー
- 写真付きのノートが1件以上ある
- AI日記生成済みのノートがあると望ましい

確認1: 共有カード画面への導線
Home → 既存ノートを開く
Detail 画面の下部に「↗ 共有カードを作成」ボタンが表示される
ボタンを押すと /(app)/notes/[noteId]/share に遷移する

確認2: フォーマット切り替え
共有カード画面で「1:1」「4:5」「9:16」のセレクターが表示される
各フォーマットを押すとカードのアスペクト比が変わる
- 1:1: 正方形カード
- 4:5: 縦長カード（Instagramフィード向け）
- 9:16: 縦長カード（ストーリー向け）

確認3: カードの表示内容
写真付きノートを選んで開く
→ 写真コラージュが表示される（1枚: 全面, 2枚: 左右, 3枚: 大+小, 4枚以上: 2x2グリッド）
→ タイトルが表示される
→ AI日記があれば表示される、なければメモが表示される
→ 日付・写真枚数が表示される
→ 右下に「Memory Note」のブランドテキストが表示される

確認4: 写真0枚のノート
写真がないノートで共有カード画面を開く
→ クラッシュしない
→ 写真欄に「📷 写真なし」のプレースホルダーが表示される

確認5: AI日記なし・メモなしのノート
AI日記未生成かつメモが空のノートで開く
→ 「思い出の記録」プレースホルダーが表示される

確認6: 画像保存
「💾 画像を保存」を押す
→ 初回は写真ライブラリへのアクセス許可ダイアログが表示される
→ 許可すると「✅ 写真ライブラリに保存しました」が表示される
→ 端末の写真アプリで確認できる

確認7: OS共有シート
「↗ 共有する」を押す
→ OS の共有シートが開く
→ LINE / X / メール等の選択肢が表示される
→ キャンセルしてもエラーが出ない

確認8: 共有ノートの viewer でも開ける
別ユーザー（viewer）でログイン
→ 共有ノートの Detail に「共有カードを作成」ボタンが表示される
→ 共有カード画面を開ける
→ 保存・共有が正常に動作する

確認9: 既存機能の回帰
Detail の 編集・メンバー管理・AI日記再生成ボタンが引き続き動作する
Home → ノート一覧が正常表示される
Edit / Members 画面へ遷移できる
```

---

## Expo Go で react-native-view-shot が動作しない場合

`react-native-view-shot` がネイティブモジュールのため Expo Go で動作しない場合は、
EAS Development Build を使ってください。

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx eas build --profile development --platform ios
# または
npx eas build --profile development --platform android
```

---

## Phase 13 推奨事項（次フェーズ）

- ノート検索（タイトル・メモ全文検索）
- カレンダービュー（撮影日付でノートをカレンダー表示）
- タイムライン（時系列でノートを表示）
- On This Day（今日と同じ日付のノート表示）

## Phase 14 推奨事項

- 設定画面（通知・プライバシー・アカウント削除）
- 権限説明（カメラ・写真ライブラリ・位置情報）
- プライバシーポリシー・利用規約
- auth 画面のカラーテーマ更新（blue → coral）

## 残課題（Phase 12 未対応）

- Instagram Graph API 連携（自動投稿）
- Public share link / OGP ページ
- QR コード生成
- Cloud Functions での高解像度画像生成
- Firebase Storage への共有画像保存
- 写真ライブラリ読み込み完了後に capture する改善
- +N 表示のデザイン改善（Phase 13 以降）
