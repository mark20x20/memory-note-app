# Phase 10 Decisions — Note Detail / Edit / Delete

## D1: [noteId].tsx → [noteId]/index.tsx への nested route 移行

**決定:** `app/(app)/notes/[noteId].tsx` を削除し、`app/(app)/notes/[noteId]/index.tsx` に移行。

**理由:**
- Edit 画面 `/(app)/notes/[noteId]/edit` を追加するために nested route が必要。
- Expo Router では `[noteId].tsx` と `[noteId]/index.tsx` が共存できない。
- 移行しても Detail の URL `/(app)/notes/[noteId]` は変わらない（Expo Router のルート解決が同じ）。

---

## D2: deletePhotosForNote の削除順序

**決定:** Storage ファイル削除 → Firestore photos ドキュメント削除 → note ドキュメント削除。

**理由:**
- Storage ファイルが残ると孤立ファイルが増えるため Storage を先に削除する。
- Storage 削除失敗はログに記録するが、`storage/object-not-found` は無視（ファイルがない場合は削除済みとみなす）。
- Firestore 削除は最後に行い、途中失敗でも再試行可能な状態を維持する。

---

## D3: aiDiaryStatus に 'edited' を追加

**決定:** 手動編集後のステータスを `'edited'` として保存する。

**理由:**
- `'completed'`（AI生成済み）と `'edited'`（ユーザー編集済み）を区別することで、再生成ボタンの挙動を将来的に制御できる。
- AiDiarySection は `'edited'` を `'completed'` と同様に扱い、日記テキストを表示する。

---

## D4: updateNote の aiDiary フィールド

**決定:** `NoteUpdateInput.aiDiary` が `undefined` の場合は Firestore の aiDiary フィールドを変更しない。

**理由:**
- AI日記がない状態（'idle' / 'failed'）のノートを編集した場合、`aiDiary` フィールドを新たに作成しない。
- Edit 画面は `hasAiDiary`（completed or edited）のときのみ AI日記フィールドを表示し、その場合のみ `aiDiary` を submit する。

---

## D5: Storage Rules の write → create/update + delete 分割

**決定:** `allow write` を `allow create, update` と `allow delete` に分割した。

**理由:**
- Firebase Storage Rules では delete 時に `request.resource` が null になる。
- `allow write` の条件に `request.resource.contentType` があると delete 時に null 参照エラーになりStorageへの削除が拒否される。
- Phase 7 時点でこの問題が潜在していたが、削除機能が不要だったため顕在化しなかった。

---

## D6: Firestore Rules 変更なし

**決定:** Firestore Rules は Phase 5 から変更しない。

**理由:**
- `allow update` と `allow delete` はすでに owner のみに限定されている。
- photos サブコレクションの `allow delete` も owner のみに限定済み。
- Phase 10 の要件（owner のみ削除可）を満たしている。

---

## D7: 削除後の遷移

**決定:** `router.replace('/(app)/home')` を使用する。

**理由:**
- `router.back()` だと削除済みノートの Detail 画面に戻ってしまう。
- `replace` で履歴をリセットし、Home 画面を新しい起点にする。
- `useMemoryNotesList` は `onSnapshot` を使っているため、削除後に自動的に一覧から消える。
