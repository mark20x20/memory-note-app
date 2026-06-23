# UI-14 Next Steps

## 完了確認チェックリスト

- [x] 非 owner ユーザーに「このノートから退出する」ボタンが表示される
- [x] owner には退出ボタンが表示されない
- [x] 個人ノートでは退出ボタンが表示されない
- [x] 退出前に確認 Alert が表示される (「このノートから退出しますか？」)
- [x] 確認 Alert の「退出する」が destructive スタイル
- [x] 退出成功後は /(app)/home に router.replace
- [x] 退出失敗時は既存 error banner でエラー表示
- [x] leaveNote が useManageNoteMembers に追加された
- [x] addMember / updateRole / removeMember が壊れていない
- [x] Role Selector Modal が壊れていない
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0
- [x] Functions 変更なし

## 未完了

- [ ] leaveNote Cloud Function が未実装のため、runtime で失敗する

---

## 次フェーズ候補

### UI-15 (HIGH): leaveNote Cloud Function の追加

- `firebase/functions/src/index.ts` に `leaveNote` 関数を追加
- caller が owner でなく、members に含まれる場合のみ自分を削除できる
- `memberRepository.ts` に `leaveNote(noteId)` callable を追加
- `useManageNoteMembers.leaveNote` の内部実装を新しい callable に切り替える

### UI-16: ロール変更成功 Toast

- updateRole 成功後に短い通知を表示

### UI-17: 共有ノートの leave 後のノートリスト更新

- home.tsx のノートリストから退出済みノートが即座に消えることを確認
- onSnapshot でリアルタイム更新されるはずだが動作確認が必要
