# UI-14 Issues

## 未解決（将来対応が必要）

### 1. [CRITICAL] removeNoteMember Cloud Function が非 owner を拒否する

**状況:**
`removeNoteMember` は `getOwnedNote()` で caller が owner かを確認する。
editor / viewer が呼び出すと `HttpsError('permission-denied', 'ownerのみこの操作を実行できます')` を返す。

**影響:**
UI-14 の退出ボタンは表示・確認 Alert まで動作するが、
実際の退出処理は runtime エラーになり、error banner に "ownerのみこの操作を実行できます" が表示される。

**解決策:**
以下のいずれかの追加が必要:

**方法A (推奨): leaveNote 専用 Cloud Function を追加**
```ts
// firebase/functions/src/index.ts に追加
export const leaveNote = onCall({ region: 'asia-northeast1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', '認証が必要です');
  const uid = request.auth.uid;
  const { noteId } = request.data as { noteId: string };

  const db = admin.firestore();
  const noteRef = db.doc(`memory_notes/${noteId}`);
  const noteSnap = await noteRef.get();
  if (!noteSnap.exists) throw new HttpsError('not-found', 'ノートが見つかりません');

  const noteData = noteSnap.data()!;
  const members = noteData.members as Record<string, string> | undefined;

  // owner は退出不可
  if (noteData.ownerId === uid) {
    throw new HttpsError('permission-denied', 'オーナーは退出できません');
  }

  // メンバーでなければエラー
  if (!members || !(uid in members)) {
    throw new HttpsError('not-found', 'このノートのメンバーではありません');
  }

  await noteRef.update({
    [`members.${uid}`]: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});
```

**方法B: memberRepository に leaveNoteDirect を追加**
```ts
// memberRepository.ts
async leaveNote(noteId: string): Promise<void> {
  const fn = httpsCallable<{ noteId: string }, { success: boolean }>(functions, 'leaveNote');
  await fn({ noteId });
}
```

**対応フェーズ:** UI-15 候補

---

## 解決済み

### 1. leaveNote 専用メソッドがなかった

`useManageNoteMembers` に `leaveNote(noteId, selfUid)` を追加し、
既存の `removeMember` を自 uid で呼ぶことで UI の接続点を作成。
