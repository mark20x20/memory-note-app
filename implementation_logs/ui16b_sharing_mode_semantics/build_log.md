# UI-16B Build Log: Sharing Mode Semantics Fix

## 実施日: 2026-06-24

## 背景

UI-16 では「メンバーと共有する」を押した瞬間に `draft.noteType = 'shared'` が設定されていた。
保存前に戻った場合でも noteType が変わらないが、保存するとメンバーを招待していなくても shared になる問題があった。

また shared → personal への変換が未実装だった（UI-16 issues.md #1）。

## 変更方針

- `noteType` は「メンバーが初めて招待された時点」で shared になる
- 招待せず戻った場合は personal のまま
- shared → personal は owner のみ可能（Cloud Function が非 owner メンバーを一括削除）

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `firebase/functions/src/index.ts` | `addNoteMemberByEmail` に `noteType: 'shared'` 追記、`convertNoteToPersonal` CF を追加 |
| `src/core/repositories/memberRepository.ts` | `convertToPersonal(noteId)` を追加 |
| `src/features/memoryNotes/hooks/useManageNoteMembers.ts` | `convertToPersonal(noteId)` メソッドを追加 |
| `src/features/memoryNotes/components/edit/panels/OverviewPanel.tsx` | props に `isOwner`, `onRequestShare`, `onConvertToPersonal` を追加。noteType 変更をコールバック経由に変更 |
| `app/(app)/notes/[noteId]/edit.tsx` | `useManageNoteMembers` 導入、`isConvertingToShared` 削除、新 props を OverviewPanel に渡す |
| `app/(app)/notes/[noteId]/preview.tsx` | `noteRepository` 直接呼び出しを削除、`isOwner` 限定に変更 |

---

## Cloud Functions の変更

### addNoteMemberByEmail（変更）

```ts
// 7. members を更新 + noteType を 'shared' に設定（UI-16B: 招待成功時に初めて shared になる）
await db.doc(`memory_notes/${noteId}`).update({
  [`members.${targetUid}`]: role,
  noteType: 'shared',
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

招待成功のタイミングで Admin SDK が `noteType: 'shared'` を書き込む。
Firestore Rules はクライアント更新にのみ適用されるため Admin SDK は通過する。

### convertNoteToPersonal（新規）

- owner のみ実行可能（`getOwnedNote` ヘルパーで確認）
- `members` マップから非 owner の uid を収集
- `FieldValue.delete()` で一括削除 + `noteType: 'personal'` を更新（1回の updateDoc）
- ログ: noteId、ownerUid 末尾4文字、削除数

---

## OverviewPanel.tsx の変更

### 新 Props

```ts
isOwner: boolean;          // owner かどうか
onRequestShare: () => void;  // "メンバーと共有" タップ時
onConvertToPersonal: () => void; // "自分だけ" タップ時（owner + shared）
```

### "メンバーと共有" ボタン

```
タップ → Alert「このノートを共有しますか？」
→「共有して招待する」→ onRequestShare() （edit.tsx が members.tsx へ push）
```

旧: `updateField('noteType', 'shared')` で draft を即時変更 → 削除

### "自分だけ" ボタン

- personal: 既にアクティブ, disabled
- shared + isOwner: 有効。タップ → Alert「個人ノートに戻しますか？」→「個人に戻す」→ `onConvertToPersonal()`
- shared + !isOwner: disabled + opacity:0.4 + caption「個人設定への変更はノートのオーナーのみ行えます」

---

## edit.tsx の変更

```ts
// 追加 import
import { canManageMembers } from '@/features/memoryNotes/utils/permissions';
import { useManageNoteMembers } from '@/features/memoryNotes/hooks/useManageNoteMembers';

// 追加 hook
const { convertToPersonal, isLoading: isManaging } = useManageNoteMembers();

// isBusy に isManaging を追加
const isBusy = isSaving || isDeleting || isManaging;

// isOwner
const isOwner = uid && note ? canManageMembers(note, uid) : false;

// handleSave から isConvertingToShared ロジックを削除（router.back() のみ）

// 新ハンドラ
const handleRequestShare = () => router.push(`/(app)/notes/${noteId}/members`);
const handleConvertToPersonal = async () => {
  await convertToPersonal(noteId);
  router.back();
};
```

---

## preview.tsx の変更

- `noteRepository` import 削除（直接 updateNoteType を呼ばなくなった）
- `useState` import 削除（isConverting 不要）
- `isConverting` state 削除
- `handleConvertToShared`: Alert の「共有して招待する」で `router.push(members)` のみ（非同期処理なし）
- 表示条件: `userCanEdit` → `isOwner`（`note.ownerId === uid`）
- `actionRowLoader` スタイル削除

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- `firebase/functions npm run build`: Exit 0 ✓
