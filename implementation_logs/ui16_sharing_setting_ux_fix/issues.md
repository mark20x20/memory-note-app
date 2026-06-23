# UI-16 Issues

## 解決済み

### 1. 「ノートの種類」がカテゴリに見えた

ラベルを「共有設定」に変更し、
選択肢を「自分だけ / メンバーと共有」にすることで共有設定であることが明確になった。

### 2. 個人ノートから「メンバー」リンクが見えた

旧条件 `note.noteType === 'shared' || userCanManageMembers` では、
owner の個人ノートでも「メンバー」リンクが表示されていた。

→ 個人ノートでは「メンバーと共有する」CTA に変更し、意味が明確になった。

### 3. 共有化後にメンバー画面に遷移しなかった

edit.tsx → 保存 → router.back() でプレビューに戻るだけだった。

→ personal→shared の変換を検知し、保存後に members.tsx へ router.replace するよう変更。

---

## 未解決（将来対応）

### 1. shared → personal への変換が未実装

「自分だけ」ボタンは shared ノートで disabled。

解決には以下が必要:
1. 既存メンバーをどう扱うか (全員削除? owner のみ残す?) の仕様決定
2. メンバー削除 + noteType 変更のアトミックな処理 (Cloud Function が望ましい)
3. メンバーへの通知方針

### 2. editor が noteType を変更できてしまう

Firestore Rules 上、editor も `noteType` を更新できる。
現在は `userCanEdit` (owner + editor) が true の場合に「メンバーと共有する」を表示している。

技術的には editor が personal→shared に変換できてしまうが、
members 画面では editor はメンバー招待不可（owner のみ招待可）なので影響は限定的。
将来的には owner のみが noteType を変更できるよう Rules か Cloud Function で制限するのが望ましい。
