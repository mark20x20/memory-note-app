# UI-16 Next Steps

## 完了確認チェックリスト

- [x] 編集画面の「ノートの種類」が「共有設定」に変わっている
- [x] 「👤 個人ノート」→「🔒 自分だけ」に変更
- [x] 「🤝 共有ノート」→「👥 メンバーと共有」に変更
- [x] personal → shared 変更時に確認 Alert が出る
- [x] Alert の「共有して招待する」で draft.noteType が 'shared' に更新される
- [x] 保存後 personal→shared の場合は members.tsx に router.replace
- [x] shared → personal は無効化 + キャプション表示
- [x] personal ノートで preview の導線が「🔗 メンバーと共有する」(primary 色)
- [x] shared ノートで preview の導線が「👥 メンバー」
- [x] preview からの共有化確認 Alert あり
- [x] 共有化後 members.tsx に遷移
- [x] members.tsx の招待/権限変更/退出機能が壊れていない
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0
- [x] Functions 変更なし

---

## 次フェーズ候補

### UI-17: shared → personal への変換

- 「自分だけ」ボタンを有効化する
- 仕様: 変換前に全メンバーを削除するか、削除なしで noteType のみ変更するか決定
- Cloud Function `convertToPersonal` を追加 (members の一括削除 + noteType 変更をアトミックに実行)

### UI-18: noteType 変更権限を owner のみに制限

- 現在 editor も noteType を変更できる (Firestore Rules が noteType を制約していない)
- Rules に `request.resource.data.noteType == resource.data.noteType || resource.data.ownerId == request.auth.uid` を追加

### UI-19: 共有化後のウェルカムメッセージ

- members.tsx に初めて到達した際 (personal→shared 変換直後) にウェルカムメッセージを表示
- params で `fromConvert=true` を渡し、members.tsx で初回表示専用 Alert を表示
