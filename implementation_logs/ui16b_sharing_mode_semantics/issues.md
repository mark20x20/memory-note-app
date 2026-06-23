# UI-16B Issues

## 解決済み

### 1. 「メンバーと共有する」で即座に noteType が shared になっていた

旧 UI-16 では「メンバーと共有する」→ Alert 承認 → `updateField('noteType', 'shared')` により
保存前からドラフトの noteType が変わり、保存すると招待なしでも shared になっていた。

→ ドラフト変更をやめ、Alert 承認後は members.tsx に遷移するだけに変更。
→ `addNoteMemberByEmail` CF が招待成功時に `noteType: 'shared'` を書き込む。

### 2. shared → personal が未実装だった（UI-16 issues.md #1 より持ち越し）

→ `convertNoteToPersonal` Cloud Function を追加。
   owner が呼び出すと非 owner メンバーを全員削除し noteType を 'personal' に変更する。
→ OverviewPanel の「自分だけ」ボタンを owner + shared 時に有効化。
   Alert 確認後に `useManageNoteMembers.convertToPersonal(noteId)` を呼び出す。

### 3. preview.tsx で editor もメンバーと共有する導線が表示されていた

旧: `userCanEdit`（owner + editor）が true の場合に「メンバーと共有する」を表示
→ `note.ownerId === uid`（owner のみ）に制限。

---

## 未解決（将来対応）

### 1. editor が noteType を変更できてしまう（Firestore Rules）

Firestore Rules 上、editor も `noteType` を更新できる。
ただし現在のクライアントコードでは editor が noteType を変更する操作が存在しないため影響は限定的。
将来的には Rules または Cloud Function で owner のみに制限するのが望ましい（UI-18 候補）。

### 2. convertNoteToPersonal は単一 update でのアトミック処理

現在の実装は1回の `updateDoc` で全非 owner メンバーを FieldValue.delete() + noteType 変更する。
メンバー数が多い場合 (Firestore の1ドキュメント更新上限は通常問題ない) でも問題ないが、
将来的に通知処理等が必要になった場合は Cloud Function の拡張が必要。
