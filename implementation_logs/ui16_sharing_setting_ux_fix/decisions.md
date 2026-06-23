# UI-16 Design Decisions

## 1. noteType はクライアントから直接更新する (Cloud Function 不要)

**決定:** `noteRepository.updateNoteType(noteId, noteType)` を `updateDoc` で実装。

**理由:**
- Firestore Rules が `members` と `ownerId` のみをロックしており、`noteType` は制約なし。
- owner/editor なら `noteType` フィールドを直接更新できる。
- Cloud Function を追加するほどの複雑性はない。
- `updateDoc` で `noteType` と `updatedAt` のみを書き込めば `members` は変更されない。

## 2. preview.tsx からの共有化フローで noteRepository を直接呼ぶ

**決定:** `preview.tsx` から `noteRepository.updateNoteType` を直接呼ぶ。hook 経由にしない。

**理由:**
- `preview.tsx` は読み取り専用の画面であり、既存 hook (useNoteEditDraft) は edit 専用。
- 一発書き込みのためだけに新しい hook を作ると over-engineering になる。
- エラーは `Alert.alert` で表示するシンプルな設計で十分。

## 3. edit.tsx の保存後遷移で personal→shared を検知

**決定:** `handleSave` 内で `note?.noteType === 'personal' && draft.noteType === 'shared'` を判定し、
members.tsx へ `router.replace` する。

**理由:**
- OverviewPanel に navigation の責務を持たせると props drilling が深くなる。
- edit.tsx はすでに `note` と `draft` の両方にアクセスできるため判定が自然。
- `router.replace` (スタック置換) を使い、members 画面から戻ったときに edit 画面に戻らないようにする。

## 4. shared → personal の無効化 (UI上)

**決定:** shared ノートの「自分だけ」ボタンを `disabled + opacity: 0.4` にし、
「共有ノートから個人設定へ戻す機能は今後対応予定です」キャプションを表示。

**理由:**
- shared→personal は既存メンバーの扱い (削除? 残す?) が未定義。
- 将来 `transferOwnership` や `leaveNote` が整ってから対応する方が安全。
- disabled UI で操作不可にしつつ、なぜできないかをユーザーに伝える。

## 5. preview.tsx の members 導線を userCanManageMembers から noteType ベースに変更

**決定:** `canManageMembers` の import を削除し、`note.noteType === 'shared'` で条件分岐。

**理由:**
- 旧: `note.noteType === 'shared' || userCanManageMembers`
  → owner の個人ノートで「メンバー」リンクが出ていた (意味が不明瞭)
- 新: noteType だけで分岐することで意味が明確
  - shared: 誰でも「メンバー」リンク (メンバーリスト閲覧)
  - personal + canEdit: 「メンバーと共有する」リンク (共有化 CTA)
  - personal + 閲覧のみ: 非表示

## 6. 「メンバーと共有する」の文字色を primary color に

**決定:** `color: colors.primary` (オレンジ系) でアクションカラーを付ける。

**理由:**
- 「地図で見る」「共有カードを作成」は既存の `textSecondary` (グレー) で十分。
- 「メンバーと共有する」は新しい操作を誘導する CTA なので primary color でハイライト。
- 心理的に soft な orange で「友達と共有しよう」という温かいトーンを維持。
