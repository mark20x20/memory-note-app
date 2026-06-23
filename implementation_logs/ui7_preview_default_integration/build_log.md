# UI-7 Build Log: Preview Default Integration / index.tsx Role Cleanup

## 実施日: 2026-06-23

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `app/(app)/notes/[noteId]/index.tsx` | redirect コンポーネントに置き換え |
| `app/(app)/notes/[noteId]/preview.tsx` | canManageMembers 追加 / action links section 追加 |

---

## index.tsx の差分 (旧 → 新)

### 旧 (Phase 10〜12 NoteDetailScreen)

- カバー写真 (220h)
- タイトル / 日付 / noteType / photoCount / userRole チップ
- メモ表示
- VisitTimelineSection (canEdit=true)
- AiDiarySection (canRegenerate=userCanGenerateAi)
- 写真グリッド (全枚数 / photosLoading スピナー)
- EventMapPreview (photosLoading ゲート付き)
- メンバーセクション (memberCount / 管理ボタン)
- 共有カードボタン
- noteIdHint (デバッグ表示)
- header right: 「編集」ボタン (canEdit)

### 新 (UI-7 Redirect)

```tsx
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  if (!noteId) return null;
  return <Redirect href={`/(app)/notes/${noteId}/preview` as any} />;
}
```

---

## preview.tsx の変更内容

### 1. canManageMembers インポート追加

```ts
import { canEdit, canManageMembers } from '@/features/memoryNotes/utils/permissions';
```

### 2. userCanManageMembers 追加

```ts
const userCanManageMembers = uid && note ? canManageMembers(note, uid) : false;
```

### 3. ナビゲーション導線セクション追加 (AI日記の後、編集CTAの前)

```tsx
{/* ── ナビゲーション導線 (UI-7) ── */}
<View style={styles.actionsSection}>
  {/* 🗺 地図で見る */}
  {/* ↗ 共有カードを作成 */}
  {/* 👥 メンバー (shared ノートまたは canManageMembers のみ) */}
</View>
```

メンバー導線の表示条件: `note.noteType === 'shared' || userCanManageMembers`

### 4. 追加スタイル

`actionsSection`, `actionRow`, `actionRowText`, `actionRowArrow`, `actionDivider`

---

## ルーティング変更

| 経路 | 変更前 | 変更後 |
|---|---|---|
| `home.tsx` → NoteCard タップ | `/(app)/notes/${note.id}` → index.tsx | `→ preview.tsx` (index が redirect) |
| `create/index.tsx` → ノート作成後 | `/(app)/notes/${noteId}` → index.tsx | `→ preview.tsx` (index が redirect) |
| `edit.tsx` → プレビューボタン | `/(app)/notes/${noteId}/preview` | 変更なし (すでに preview) |

home.tsx / create/index.tsx は **変更なし**。index.tsx の redirect により自動的に preview へ誘導される。

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- Functions build: 不要
