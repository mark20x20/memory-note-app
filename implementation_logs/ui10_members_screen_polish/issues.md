# UI-10 Issues

## 解決済み

### 1. Note Summary Card がなかった

画面の冒頭に「どのノートのメンバー管理か」が分からなかった。
`note.coverPhotoURL` / `note.title` / `note.createdAt` / `note.noteType` / `members.length` からカードを作成。

### 2. Role guide がなかった

権限の説明がフォーム内の roleDescCard のみで、独立したガイドセクションがなかった。
Section 4 として Role guide card を追加。

### 3. ヘッダータイトルが "メンバー管理" で管理画面感が強かった

仕様書: "warm / safe / clear / human, not administrative"
"メンバー" に変更。

### 4. owner ロールラベルが英語 'Owner' だった

全ラベルを日本語に統一: 'オーナー'。

### 5. 「あなた」が名前文字列に混在していた

`{member.displayName} (あなた)` → 独立した `youBadge` View に変更。

---

## 未解決（将来対応）

### 1. 本物のアバター画像がない

現在のアバターは名前の頭文字を表示する placeholder。
Firebase Auth の photoURL や Gravatar があればアバター画像を表示できる。
→ `member.photoURL` が追加されたら `<Image>` に差し替え可能な設計。

### 2. ロール変更 UI がトグルボタン (editor ↔ viewer) のみ

現在の「閲覧者に / 編集者に」ボタンは owner→editor→viewer のシンプルなトグル。
将来的にはセレクタ形式 (ActionSheet or BottomSheet) にした方が直感的。
→ 現在のロジックを壊さずスタイル変更のみで対応可能。UI-11 候補。

### 3. 退出 (leave) 機能がない

非 owner ユーザーが自分でノートから退出する機能がない。
→ `removeMember` を自分に対して呼ぶことで実現できるが、
  UI-10 スコープ外。将来の `useManageNoteMembers.leaveNote` 追加で対応。

### 4. 個人ノートの members 画面の意味が薄い

`note.noteType === 'personal'` の場合、メンバーは owner 1人のみ。
メンバー画面に来る意味が薄い。

→ preview.tsx の action link で `note.noteType === 'shared' || userCanManageMembers`
  の条件で表示しているため、個人ノートではメンバー導線が表示されない。
  実際には個人ノートでこの画面に来ることはほぼない。許容範囲。
