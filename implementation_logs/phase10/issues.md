# Phase 10 Issues — Note Detail / Edit / Delete

## I1: photos サブコレクションの部分削除失敗

**状況:** `deletePhotosForNote` で Storage ファイル削除が部分的に失敗した場合、Firestore の photos ドキュメントは全件削除されるが、Storage にファイルが残る可能性がある。

**対応:** Storage に孤立ファイルが残っても Firestore から参照できなくなる。Phase 15 の Storage 監視で孤立ファイルを検出・削除する。現状は `storage/object-not-found` のみ無視し、他のエラーは収集してスローする。

---

## I2: Firestore Rules の update でメンバーが削除できる

**状況:** 現在の Firestore Rules では `members` の member（editor/viewer）も update できる。Phase 10 では owner のみが編集・削除できるように UI で制御しているが、Rules レベルで owner のみに update を限定していない。

**対応:** Phase 10 では owner のみが Edit 画面を開く前提（共有ノート機能は Phase 11 で実装）。Phase 11 で Rules を見直す。

---

## I3: AI日記のフィールドがない状態（idle/failed）のノートの編集

**状況:** `aiDiaryStatus` が 'idle' または 'failed' のノートの場合、Edit 画面に AI日記フィールドを表示しない。ユーザーが AI日記テキストを手動入力する導線がない。

**対応:** AI日記の手動入力は Phase 10 では AI生成済み（completed/edited）のノートのみ対象。手動入力導線は Phase 10 の範囲外。

---

## I4: useNoteDetail の onSnapshot とノート削除後の挙動

**状況:** `useDeleteNote` でノートを削除した後、`useNoteDetail` の `onSnapshot` が `snap.exists() === false` を検知し `note` が `null` になる。

**対応:** Edit 画面は削除後に `router.replace('/(app)/home')` を呼ぶため、null 状態の Detail 画面が表示されることはない。Detail 画面で `note === null` のケースは「ノートが見つからない」状態として表示する。

---

## I5: 再生成ボタンと手動編集の競合

**状況:** AiDiarySection の「再生成」ボタンを押すと、手動編集した内容が AI 生成テキストで上書きされる。

**対応:** 現状は仕様通り（再生成は手動編集を上書きする）。Phase 11 以降で「手動編集後は再生成確認ダイアログを表示する」等の UX 改善を検討する。
