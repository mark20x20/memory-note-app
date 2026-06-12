# Phase 11 Decisions — Shared Notes / Member Management

## D1: members マップ変更はクライアントから禁止、Cloud Functions 経由のみ

**決定:** Firestore Rules の update 条件に `request.resource.data.members == resource.data.members` を追加し、クライアントから直接 members を変更できなくした。

**理由:**
- クライアントから members を直接変更すると、権限チェックをバイパスされる恐れがある。
- Cloud Functions (Admin SDK) は Rules をバイパスするため、Functions 側で owner 確認・バリデーションを行う。
- updateNote（title/memo/noteType/aiDiary の更新）は members を変更しないので既存の updateDoc は問題なく通過する。

---

## D2: users コレクションは認証済みユーザー全員が read 可に変更

**決定:** `users/{userId}` の read を `request.auth != null` に緩和した（Phase 10 まで: 自分のみ読める）。

**理由:**
- メンバー管理画面でメンバーの displayName / email を表示するために users ドキュメントを読む必要がある。
- `firestore.get()` を使った member profiles 取得には users の読み取り権限が必要。
- write は引き続き自分のドキュメントのみ。

---

## D3: useMemoryNotesList を2クエリに分離

**決定:** `where('ownerId', '==', uid)` と `where('members.${uid}', 'in', ['editor', 'viewer'])` の2つの `onSnapshot` を並列で立て、クライアント側でマージする。

**理由:**
- 単一クエリ `where('members.${uid}', 'in', ['owner', 'editor', 'viewer'])` は動作するが、既存の `ownerId` クエリが実績あるため分離して安全性を高めた。
- 共有ノートクエリが失敗（Firestore インデックス未作成時など）した場合も自分のノートは正常表示される。
- `members.${uid}` のドットパス auto-index は Firestore が自動作成するため、通常は問題ない。

---

## D4: Storage Rules に firestore.get() でメンバー確認を追加

**決定:** Storage Rules の read に `firestore.get(/databases/(default)/documents/memory_notes/$(noteId)).data.members[request.auth.uid] != null` を追加した。

**理由:**
- ノートのメンバーが写真を閲覧できるようにするために Firestore の members マップを参照する必要がある。
- Storage Rules の `match /users/{uid}/.../{noteId}/...` パターンでは `noteId` が使えるため、Firestore lookup が可能。
- owner は `uid == request.auth.uid` で直接許可するため、Firestore lookup はメンバー向けのみ。

---

## D5: generateMemoryDiary の権限チェックを owner/editor のみに強化

**決定:** `generateMemoryDiary` で viewer の AI 日記生成を拒否するよう変更した。

**理由:**
- Phase 9 では「owner または member であれば生成可」だったが、Phase 11 の仕様では viewer は再生成不可。
- Functions 側で `members[uid] in ['owner', 'editor']` を確認することで確実に権限制御する。

---

## D6: members.tsx は [noteId] ディレクトリ直下のファイルとして追加

**決定:** `app/(app)/notes/[noteId]/members.tsx` を追加した（nested directory にはしない）。

**理由:**
- Phase 10 で既に `[noteId]/` が directory になっている。
- `members.tsx` は1画面のみで、さらに下に子ルートは不要なため。
- Expo Router では `[noteId]/members.tsx` でルート `/(app)/notes/[noteId]/members` が解決される。

---

## D7: editor はメンバー管理画面にアクセスできるが操作不可

**決定:** Detail 画面の「管理」ボタンは owner のみ表示。editor/viewer が直接 URL でアクセスした場合は閲覧専用表示（操作 UI 非表示）。

**理由:**
- spec の「editor / viewer はMembers画面に入れても閲覧のみ」に従った。
- Owner のみ addMember/updateRole/removeMember の操作 UI を表示する。
- URL 直接アクセスで白い画面を出さないため、viewer でも membersRow は表示する。

---

## D8: editor は写真アップロード不可（Phase 11 スコープ外）

**決定:** Storage Rules の create/update は `uid == request.auth.uid`（path の uid = note owner）のみ許可し、editor のアップロードは対応しない。

**理由:**
- 現在の Storage パスは `users/{noteOwnerUid}/memory_notes/{noteId}/...` となっており、editor が自分の uid でアップロードしても別パスになる。
- editor のアップロードには Storage パス設計の変更が必要で Phase 11 スコープ外。
- spec の editor できること欄に「写真閲覧」はあるが「写真アップロード」はない。
