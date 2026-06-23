# UI-15 Build Log: leaveNote Cloud Function / Self Exit Backend

## 実施日: 2026-06-24

## 問題点の確認 (UI-14 からの引き継ぎ)

`removeNoteMember` Cloud Function は `getOwnedNote()` で caller が owner か確認するため、
非 owner による self-leave は runtime で `permission-denied` になっていた。

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `firebase/functions/src/index.ts` | `leaveNote` Cloud Function を追加 |
| `src/core/repositories/memberRepository.ts` | `leaveNote(noteId)` callable を追加 |
| `src/features/memoryNotes/hooks/useManageNoteMembers.ts` | `leaveNote` を新 callable に切り替え、`selfUid` 引数を削除 |
| `app/(app)/notes/[noteId]/members.tsx` | `leaveNote(noteId, uid)` → `leaveNote(noteId)` に変更 |

---

## Cloud Function: leaveNote

```ts
// firebase/functions/src/index.ts

export const leaveNote = onCall(
  { region: 'asia-northeast1' },
  async (request) => {
    // 1. 認証チェック
    if (!request.auth) throw new HttpsError('unauthenticated', '認証が必要です');
    const uid = request.auth.uid;

    // 2. noteId バリデーション
    const data = request.data as { noteId?: unknown };
    if (typeof data.noteId !== 'string' || !data.noteId.trim()) {
      throw new HttpsError('invalid-argument', 'noteId が必要です');
    }
    const noteId = data.noteId.trim();

    // 3. ノート存在確認
    const noteSnap = await db.doc(`memory_notes/${noteId}`).get();
    if (!noteSnap.exists) throw new HttpsError('not-found', 'ノートが見つかりません');

    // 4. owner は退出不可
    if (noteData.ownerId === uid) {
      throw new HttpsError('permission-denied', 'オーナーは退出できません');
    }

    // 5. メンバー確認
    if (!members || !(uid in members)) {
      throw new HttpsError('not-found', 'このノートのメンバーではありません');
    }

    // 6. 自分自身の members エントリを削除
    await noteRef.update({
      [`members.${uid}`]: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);
```

`removeNoteMember` との違い:
- `getOwnedNote()` を使わない（owner 権限不要）
- `targetUid` パラメータなし（常に自分自身のみ削除）
- owner が呼んだ場合は `permission-denied` を返す

---

## memberRepository.ts の変更

```ts
async leaveNote(noteId: string): Promise<void> {
  const fn = httpsCallable<{ noteId: string }, { success: boolean }>(functions, 'leaveNote');
  await fn({ noteId });
},
```

`satisfies` 型に `leaveNote: (noteId: string) => Promise<void>` を追加。

---

## useManageNoteMembers.ts の変更

```ts
// 変更前 (UI-14)
leaveNote: (noteId: string, selfUid: string) => Promise<void>;
await memberRepository.removeMember(noteId, selfUid);

// 変更後 (UI-15)
leaveNote: (noteId: string) => Promise<void>;
await memberRepository.leaveNote(noteId);
```

selfUid 引数が不要になった（Cloud Function 側が auth.uid を使うため）。

---

## members.tsx の変更

```ts
// 変更前
await leaveNote(noteId, uid);

// 変更後
await leaveNote(noteId);
```

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- `cd firebase/functions && npm run build`: Exit 0 ✓
