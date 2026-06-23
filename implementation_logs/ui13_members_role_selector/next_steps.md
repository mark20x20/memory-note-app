# UI-13 Next Steps

## 完了確認チェックリスト

- [x] owner が「変更」ボタンをタップすると Role Selector Modal が開く
- [x] Modal に対象メンバー名が表示される
- [x] 編集者 / 閲覧者 を明示的に選べる
- [x] 現在のロールに ✓ マーク + ivory 背景が表示される
- [x] ロールを選ぶと Modal が閉じて既存の確認 Alert が表示される
- [x] キャンセルボタンで Modal が閉じる
- [x] オーバーレイタップで Modal が閉じる
- [x] owner のロールは変更対象に表示されない
- [x] owner 自身のロール変更ボタンは表示されない
- [x] editor / viewer には変更 UI が表示されない
- [x] handleUpdateRole / handleAddMember / handleRemoveMember は変更なし
- [x] useManageNoteMembers API は変更なし
- [x] 外部ライブラリ追加なし
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## 次フェーズ候補

### UI-14: 退出 (leave) 機能追加

- 非 owner ユーザーが自分でノートから退出できるボタンを追加
- `useManageNoteMembers` に `leaveNote` を追加
- members.tsx の viewer notice 付近に「このノートから退出する」ボタンを追加

### UI-15: ロール変更成功 Toast

- updateRole 成功後に "編集者に変更しました" などの短い通知を表示
- react-native の ToastAndroid / iOS は独自実装が必要

### UI-16: Modal dismiss アニメーション改善

- 現在の `setRoleSelectorTarget(null)` での即時 dismiss をアニメーション付きに
- `react-native-reanimated` (既にインストール済みなら) を使ったスムーズな slide-down
