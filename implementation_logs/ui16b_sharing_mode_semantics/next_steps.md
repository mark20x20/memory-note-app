# UI-16B Next Steps

## 完了確認チェックリスト

- [x] 「メンバーと共有する」タップだけでは noteType が変わらない
- [x] Alert 承認後に members.tsx に遷移する（noteType 変更は CF に委ねる）
- [x] `addNoteMemberByEmail` CF が招待成功時に `noteType: 'shared'` を設定する
- [x] `convertNoteToPersonal` CF が追加されている（非 owner 全員削除 + noteType 変更）
- [x] `memberRepository.convertToPersonal(noteId)` が追加されている
- [x] `useManageNoteMembers.convertToPersonal(noteId)` が追加されている
- [x] OverviewPanel 「自分だけ」ボタンが owner + shared で有効になっている
- [x] OverviewPanel 「自分だけ」ボタンが非 owner + shared で disabled になっている
- [x] edit.tsx が `isOwner`, `onRequestShare`, `onConvertToPersonal` を OverviewPanel に渡している
- [x] edit.tsx の `isConvertingToShared` ロジックが削除されている
- [x] edit.tsx の `isBusy` に `isManaging` が含まれている
- [x] preview.tsx の `noteRepository` 直接呼び出しが削除されている
- [x] preview.tsx の「メンバーと共有する」が owner のみに制限されている
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0
- [x] Functions build Exit 0

## デプロイコマンド

```bash
firebase deploy --only functions:addNoteMemberByEmail,functions:convertNoteToPersonal
```

---

## 次フェーズ候補

### UI-17: 招待画面から戻った後の状態フィードバック

- members.tsx から edit 画面に戻ったとき、noteType が変わっていれば draft を再ロード
- 現在は edit の draft が stale になりうる（ページを開き直せば最新が取れる）

### UI-18: noteType 変更権限を owner のみに制限（Firestore Rules）

- `request.resource.data.noteType == resource.data.noteType || resource.data.ownerId == request.auth.uid`
- Rules を追加することで editor が直接 updateDoc で noteType を変更できなくなる

### UI-19: 共有化後のウェルカムメッセージ

- members.tsx に初めて到達した際（招待後）にウェルカムメッセージを表示
- `fromShare=true` などのパラメータを渡して初回表示専用 Alert を出す
