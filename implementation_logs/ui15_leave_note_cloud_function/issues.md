# UI-15 Issues

## 解決済み

### 1. 非 owner が退出できなかった (UI-14 からの引き継ぎ)

`removeNoteMember` Cloud Function が owner 権限を要求するため、
editor / viewer による self-leave が runtime で `permission-denied` になっていた。

→ `leaveNote` 専用 Cloud Function を追加し、owner 権限チェックを行わない設計に変更。
→ `memberRepository.leaveNote(noteId)` → `useManageNoteMembers.leaveNote(noteId)` の経路で呼ばれる。

### 2. selfUid を hook と members.tsx 両方で渡す必要があった

UI-14 実装では `leaveNote(noteId, selfUid)` の形式だったため、
members.tsx 側で `uid` を引数として渡す必要があった。

→ Cloud Function が `request.auth.uid` で uid を取得するため、クライアント側の uid 引数を削除。
→ `leaveNote(noteId)` のシンプルな形式に変更。

---

## 未解決（将来対応）

### 1. owner 権限譲渡機能がない

owner が退出したい場合、ownership を他のメンバーに譲渡する手段がない。
現在は UI でも Cloud Function でも owner の退出を拒否している。

→ 将来: `transferOwnership(noteId, newOwnerUid)` Cloud Function の追加が必要。

### 2. 退出後のノートリスト更新確認

home.tsx のノートリストが Firestore onSnapshot で購読している場合、
退出後に members から削除されたノートがリアルタイムでリストから消えるはず。
ただし実際の動作は未確認。

→ 動作確認は deploy 後に実機テストで行う。
