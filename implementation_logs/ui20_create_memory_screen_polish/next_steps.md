# UI-20 Create Memory Screen Polish — 次のステップ

## 優先度: 高

### タイトルフォールバック対応
- `useCreateNote` に `titleFallback?: string` オプションを追加、または handleSave 内で直接 noteRepository を呼ぶ
- 空タイトルでも「無題の思い出」で作成可能にする
- UI: 「タイトル（省略可）」 + placeholder「例: 夏の思い出」

### GPS なし写真の警告表示（Partial Metadata）
- `photos` 配列を確認し、GPS のないものがある場合は soft warning chip を表示
- 「一部の写真で場所情報が見つかりませんでした。あとから手動で調整できます。」

## 優先度: 中

### 写真枚数上限の明示
- 「最大10枚まで選択できます」のヒント表示
- `usePhotoPicker` のエラー時メッセージを UI に表示

### アップロード完了後の遷移アニメーション
- 「ノートを作成しました ✓」の brief success message
- その後 Preview に遷移（現在はすぐに replace）

### 写真選択エラー時のリトライUI
- spec: "If picker fails: show retry action inside the hero area"
- 現在は `photoError` をセクション下に表示するだけ

## 優先度: 低

### スケルトンローディング
- 写真ピッカー読み込み中のアニメーション改善

### 写真並び替え
- ドラッグ＆ドロップ、または順序変更のUX
- 別タスクで実装

## 次推奨アクション

`UI-21: Note Detail / Preview Screen Polish`
Create 画面から遷移した先の Preview 画面を整える。
既に ui7_preview_default_integration で実装があるため、一貫性の確認が主な作業になる想定。
