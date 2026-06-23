# UI-7 Design Decisions

## 1. index.tsx を redirect に置き換え (削除はしない)

**決定:** index.tsx をフル削除せず、redirect コンポーネントに置き換える。

**理由:**
- Expo Router は `[noteId]/index.tsx` をルートファイルとして要求する。削除すると `/notes/${noteId}` ルートが存在しなくなる。
- redirect にすることで、home.tsx / create/index.tsx を変更せずに preview に誘導できる。
- ファイルにコメントを残すことで、将来の開発者が意図を把握できる。

## 2. AI日記再生成を preview.tsx に移植しない (AiDiarySection は使わない)

**決定:** `AiDiarySection` コンポーネント（再生成ボタン付き）は preview.tsx に追加しない。
AI日記は completed/edited の場合のみ read-only テキストとして表示する（UI-3B 実装通り）。

**理由:**
- preview.tsx は「読む画面」。AI生成というプロセス操作は感情的体験の邪魔になる。
- AI日記再生成は edit.tsx の AI日記タブで対応できる（edit フローに統一）。
- UI-7 の scope は "navigation links" の追加であり、AI UI の大改修は対象外。
- 将来 AI生成UX を改善する際に独立したタブ/画面として設計する方が自由度が高い。

## 3. メンバー導線の表示条件

**決定:** `note.noteType === 'shared' || userCanManageMembers` の場合に表示。

**理由:**
- 共有ノートなら viewer でもメンバー一覧を見る権利がある（誰と共有されているか確認できる）。
- 個人ノートで自分しかいない場合はメンバー画面に意味がない。
- `canManageMembers` は owner のみ true になるが、shared ノートは editor/viewer も見られる。

## 4. 地図・共有カードは全ユーザーに表示

**決定:** 地図と共有カードの導線は canEdit に関わらず常に表示する。

**理由:**
- 地図は viewer でも思い出の流れを見るのに有用。
- 共有カードも viewer が作成できる設計（権限チェックは share.tsx 内部で行う）。
- preview は「読む画面」として最大限のコンテンツアクセスを提供するべき。

## 5. home.tsx / create/index.tsx は変更しない

**決定:** 両ファイルの `/(app)/notes/${noteId}` 遷移はそのままにする。

**理由:**
- index.tsx の redirect により自動的に preview に誘導される。
- ファイルの変更箇所を最小化し、リグレッションリスクを下げる。
- create/index.tsx は作成完了後の遷移なので、preview に誘導されることで「完成した思い出を見る」体験になりユーザー体験も向上する。

## 6. action links を card 形式でまとめる (個別ボタンではなく)

**決定:** 3つのアクションを1枚のカード（divider区切り）にまとめる。

**理由:**
- `{ map, share, members }` の3要素を並列ボタンにすると画面が重くなる。
- リスト形式のカードは iOS Settings 風で直感的。
- 既存の surface/border スタイルと統一感がある。
