# UI-16 Build Log: Sharing Setting UX Fix

## 実施日: 2026-06-24

## 事前確認

### Firestore Rules 確認結果

```
memory_notes/{noteId} update rule:
  && request.resource.data.ownerId == resource.data.ownerId
  && request.resource.data.members == resource.data.members;
```

`noteType` フィールドは制約されていない。
`updateDoc(noteRef, { noteType, updatedAt })` でクライアントから直接更新可能 ✓

owner または editor が `noteType` を変更できる。viewer は update 権限なし。

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/core/repositories/noteRepository.ts` | `updateNoteType(noteId, noteType)` を追加 |
| `src/features/memoryNotes/components/edit/panels/OverviewPanel.tsx` | 「共有設定」UI に変更 |
| `app/(app)/notes/[noteId]/edit.tsx` | 保存後 personal→shared の場合 members.tsx に遷移 |
| `app/(app)/notes/[noteId]/preview.tsx` | メンバー導線を noteType ベースに変更 |

---

## noteRepository.ts の変更

```ts
async updateNoteType(noteId: string, noteType: NoteType): Promise<void> {
  const noteRef = doc(db, 'memory_notes', noteId);
  await updateDoc(noteRef, {
    noteType,
    updatedAt: serverTimestamp(),
  });
},
```

`members` と `ownerId` を変更しないため、Firestore Rules を通過する。

---

## OverviewPanel.tsx の変更

| 変更前 | 変更後 |
|---|---|
| ラベル: 「ノートの種類」 | 「共有設定」 |
| ボタン: 「👤 個人ノート」 | 「🔒 自分だけ」 |
| ボタン: 「🤝 共有ノート」 | 「👥 メンバーと共有」 |
| shared→personal: 可能 | 無効化 + キャプション |

### personal → shared

「メンバーと共有」タップ時 (draft.noteType === 'personal'):
```
Alert: 「このノートを共有しますか？」
本文: 「共有ノートに変更すると、メンバーを招待できるようになります。」
→「共有して招待する」: updateField('noteType', 'shared')
→「キャンセル」: 何もしない
```

### shared → personal (非対応)

「自分だけ」ボタンを disabled + opacity:0.4
キャプション: 「共有ノートから個人設定へ戻す機能は今後対応予定です」

---

## edit.tsx の変更

```ts
// personal → shared への変換を検知
const isConvertingToShared = note?.noteType === 'personal' && draft.noteType === 'shared';

await saveDraft();
if (isConvertingToShared && noteId) {
  router.replace(`/(app)/notes/${noteId}/members`);
} else {
  router.back();
}
```

---

## preview.tsx の変更

### メンバー導線の条件変更

```
変更前: (note.noteType === 'shared' || userCanManageMembers) → 「メンバー」
変更後:
  note.noteType === 'shared' → 「👥 メンバー」 → members.tsx へ
  note.noteType === 'personal' && userCanEdit → 「🔗 メンバーと共有する」 → Alert → updateNoteType → members.tsx
  それ以外 → 非表示
```

### 追加 imports

```ts
import { useState } from 'react';
import { ..., Alert } from 'react-native';
import { noteRepository } from '@/core/repositories/noteRepository';
```

### 削除 imports

```ts
// canManageMembers は不要になった
import { canEdit } from '@/features/memoryNotes/utils/permissions';
```

### handleConvertToShared (preview.tsx)

```ts
const handleConvertToShared = () => {
  Alert.alert(
    'このノートを共有しますか？',
    '共有ノートに変更すると、メンバーを招待できるようになります。',
    [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '共有して招待する',
        onPress: async () => {
          setIsConverting(true);
          try {
            await noteRepository.updateNoteType(noteId, 'shared');
            router.push(`/(app)/notes/${noteId}/members`);
          } catch {
            Alert.alert('エラー', '共有設定の変更に失敗しました。もう一度お試しください。');
          } finally {
            setIsConverting(false);
          }
        },
      },
    ]
  );
};
```

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- Functions build: 不要
