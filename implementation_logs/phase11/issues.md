# Phase 11 Issues — Shared Notes / Member Management

## I1: useMemoryNotesList の共有ノートクエリで Firestore インデックスが必要になる場合がある

**状況:** `where('members.${uid}', 'in', ['editor', 'viewer'])` クエリが実行されると、Firestore が auto-index を構築する。新規ユーザーや初回実行時に Firestore コンソールにインデックス作成リンクが出る場合がある。

**対応:** クエリ失敗時は空配列にフォールバックしてアプリを壊さない実装にした。失敗ログは `console.warn` で出力。Firestore コンソールで必要に応じてインデックスを追加する。

---

## I2: addNoteMemberByEmail で email 大文字小文字の揺れ

**状況:** Firebase Auth は email を小文字に正規化するが、ユーザーが大文字で入力したり、古い形式で保存されていると一致しない場合がある。

**対応:** `email.trim().toLowerCase()` で正規化してから検索する。users コレクションに `emailLower` フィールドを追加する場合は Phase 12 以降で対応する。

---

## I3: useNoteMembers で users コレクションへの多重 getDoc

**状況:** メンバーが多い場合（10人以上）、useNoteMembers は users/{uid} を1件ずつ並列で getDoc する。メンバー変化のたびに全件取り直す。

**対応:** Phase 11 では最小限の実装でよい（共有ノートのメンバーは数人程度を想定）。メンバー数が多い場合は onSnapshot → getDoc キャッシュ化を検討。

---

## I4: Storage Rules の firestore.get() が遅い

**状況:** Storage Rules で `firestore.get()` を使った member 確認は Firebase 内部呼び出しだが、レイテンシが発生する。

**対応:** Phase 11 では許容範囲。高頻度アクセスの場合は Rules から firestore.get() を除き、public URL + Firestore 側でのアクセス制御 or Storage Metadata を使う設計に変更を検討。

---

## I5: Firestore Rules update で members == resource.data.members の比較

**状況:** Phase 11 で note update ルールに `request.resource.data.members == resource.data.members` を追加した。これは Firestore 内部でマップ全体を比較する。フィールドが多い大きな members マップでは比較コストが上がる可能性がある。

**対応:** 現時点では許容範囲。members が大規模になる場合（大規模グループ機能）は別途設計を見直す。

---

## I6: 削除後の useMemoryNotesList リアルタイム更新（共有ノート側）

**状況:** owner がノートを削除すると member 側の onSnapshot（`where('members.uid', 'in', ['editor', 'viewer'])`）は自動的にそのノートを消す（Firestore は存在しないドキュメントをクエリ結果から除外する）。ただし、Firestore Rules による read 拒否（権限なし）でも `onSnapshot` が `permission-denied` エラーを返す場合がある。

**対応:** `useMemoryNotesList` の member クエリは失敗時に空配列にフォールバックする実装にした。権限変更後は自動的に再クエリされる。

---

## I7: members.tsx で非owner ユーザーのロール変更ボタン表示

**状況:** `members.tsx` では owner 以外のメンバー（editor/viewer）が直接 URL でアクセスした場合、メンバー一覧は表示されるが操作ボタンは非表示になる。アクセス制御は UI 層のみで行っており、Functions 側でも owner チェックを行う。

**対応:** 二重チェック（UI + Functions）で適切な権限制御を実現している。
