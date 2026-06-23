# UI-14 Build Log: Members Leave Note / Self Exit Flow

## 実施日: 2026-06-24

## 既存実装の確認結果

### removeNoteMember Cloud Function の動作

```
firebase/functions/src/index.ts を確認:

removeNoteMember は getOwnedNote(db, noteId, callerUid) を使用
→ ownerId !== callerUid の場合 HttpsError('permission-denied') を throw

つまり、非 owner による呼び出しは runtime で拒否される。
非 owner の self-leave には専用 Cloud Function が必要。
```

### Firestore Rules の動作

```
memory_notes/{noteId} の update 条件:
  request.resource.data.members == resource.data.members
→ クライアントから members を直接変更することは禁止されている。
```

### 結論

既存バックエンドで非 owner による自己退出は直接実現できない。
UI は完全実装し、エラー時は error banner で表示する。
将来 leaveNote 専用 Cloud Function が追加されれば即座に動作する設計にする。

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/features/memoryNotes/hooks/useManageNoteMembers.ts` | `leaveNote` を追加 |
| `app/(app)/notes/[noteId]/members.tsx` | leaveNote 呼び出し、Leave Card UI 追加 |

---

## useManageNoteMembers.ts の変更

### Interface に leaveNote を追加

```ts
leaveNote: (noteId: string, selfUid: string) => Promise<void>;
```

### leaveNote 実装

```ts
const leaveNote = async (noteId: string, selfUid: string): Promise<void> => {
  setIsLoading(true);
  setError(null);
  try {
    await memberRepository.removeMember(noteId, selfUid);
  } catch (e) {
    const msg = toUserMessage(e, 'ノートからの退出に失敗しました。もう一度お試しください。');
    setError(msg);
    throw new Error(msg);
  } finally {
    setIsLoading(false);
  }
};
```

---

## members.tsx の変更

### handleLeaveNote ハンドラを追加

```ts
const handleLeaveNote = () => {
  Alert.alert(
    'このノートから退出しますか？',
    '退出すると、この思い出ノートを閲覧できなくなります。',
    [
      { text: 'キャンセル', style: 'cancel' },
      { text: '退出する', style: 'destructive', onPress: ... }
    ]
  );
};
```

退出成功後: `router.replace('/(app)/home' as any)`

### Section 4: Leave Note カードを追加

```
表示条件:
  !isOwner && note.noteType === 'shared' && uid

UI:
  - カード: borderColor: #FECACA (pale red)
  - タイトル: "このノートから退出"
  - 説明: "退出すると、この思い出ノートを閲覧できなくなります。"
  - ボタン: "このノートから退出する" (error 色 border + text, 非fill)
  - managing 中は ActivityIndicator
```

旧 Section 4 (Role Guide) は Section 5 に番号を更新。

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- Functions build: 不要
