# UI-18 Onboarding Polish — 課題・既知の問題

## 解決済み

### #1 誤ったディレクトリへの実装（前回）
- **問題**: 前回は `memory-note-app/app/(auth)/onboarding.tsx` という入れ子パスに実装してしまった
- **原因**: プロジェクトルートの認識ミス
- **解決**: 正しいルート `C:/Users/Masaki/memory_note_agent_system/memory-note-app/` を確認して再実装

## 残存課題

### #2 first-run flag 未実装
- **内容**: アプリ初回起動時のみオンボーディングを表示するフラグ管理を今回は実装していない
- **影響**: 毎回 `/(auth)/onboarding` に直接アクセスすれば表示される（意図的）
- **対応**: 別タスクとして要件が出た際に実装する
