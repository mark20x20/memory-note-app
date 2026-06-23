# UI-15 Design Decisions

## 1. getOwnedNote() を使わず独自チェックを実装

**決定:** `leaveNote` は既存の `getOwnedNote(db, noteId, callerUid)` helper を使わず、
独自に note を取得・チェックする。

**理由:**
- `getOwnedNote` は caller が owner であることを確認するためのヘルパー。
- `leaveNote` では caller は owner である必要がなく、むしろ owner なら拒否する。
- `getOwnedNote` を流用すると非 owner が常に `permission-denied` になる。

## 2. leaveNote は自分自身の uid のみ削除する

**決定:** Function 内で `targetUid` パラメータを受け取らず、常に `request.auth.uid` を使う。

**理由:**
- 「自分だけが自分を退出できる」が leaveNote の唯一の責務。
- 他人を退出させる操作は `removeNoteMember` (owner 専用) が担当する責務分担。
- パラメータを受け取ると「自分以外の uid を渡して他人を退出させる」攻撃ベクターになりうる。

## 3. selfUid を hook / members.tsx から排除

**決定:** `leaveNote(noteId: string)` の形式にし、`selfUid` 引数を削除。

**理由:**
- Cloud Function 側が `request.auth.uid` で本人確認するため、クライアント側で uid を渡す必要がない。
- クライアントから uid を渡す設計では、将来のリファクタリングで uid が間違った場合のリスクがある。
- シンプルな API の方が呼び出し側のミスが減る。

## 4. owner の自己退出を permission-denied で拒否

**決定:** `if (ownerId === uid) throw HttpsError('permission-denied', 'オーナーは退出できません')`

**理由:**
- owner が退出するとノートの管理者がいなくなる。
- owner が退出したい場合は先に ownership を他者に譲渡する仕組みが必要（将来対応）。
- クライアント側でも `!isOwner` 条件でボタンを非表示にしているが、
  サーバー側でも二重チェックすることでセキュリティを確保する。

## 5. Firestore Rules は変更しない

**決定:** Cloud Function が Admin SDK で Firestore を直接更新する方式を維持。

**理由:**
- Firestore Rules の `request.resource.data.members == resource.data.members` 条件が
  クライアントから members を変更することを禁止している。
- Admin SDK を使う Cloud Function はこのルールをバイパスできる。
- Rules 変更は別のセキュリティリスクを生む可能性があるため変更しない。
