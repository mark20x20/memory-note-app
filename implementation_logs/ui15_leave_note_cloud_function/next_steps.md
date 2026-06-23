# UI-15 Next Steps

## 完了確認チェックリスト

- [x] leaveNote Cloud Function が index.ts に追加された
- [x] request.auth が必須
- [x] noteId が必須
- [x] owner は退出不可 (permission-denied)
- [x] メンバーでない場合は not-found
- [x] editor / viewer は自分自身の members エントリのみ削除できる
- [x] updatedAt が serverTimestamp で更新される
- [x] memberRepository.leaveNote(noteId) が追加された
- [x] useManageNoteMembers.leaveNote が新 callable を呼ぶ
- [x] members.tsx が leaveNote(noteId) (引数1つ) で呼んでいる
- [x] 退出成功後に /(app)/home に router.replace
- [x] 退出失敗時は error banner でエラー表示
- [x] addMember / updateRole / removeMember が変更なし
- [x] Role Selector Modal が変更なし
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0
- [x] Functions build Exit 0
- [x] Firestore Rules 変更なし

---

## Deploy 手順

```bash
firebase deploy --only functions:leaveNote
```

---

## 次フェーズ候補

### UI-16: owner 権限譲渡 (transferOwnership)

- owner が退出する前に editor に権限を譲渡できる機能
- `transferOwnership(noteId, newOwnerUid)` Cloud Function
- members.tsx の owner 向けセクションに配置

### UI-17: 退出後のノートリスト動作確認

- home.tsx の notes 一覧が退出後にリアルタイムで更新されるか確認
- onSnapshot サブスクリプションで members フィールドが変わった際の挙動を確認
