# UI-25 Integration QA — ビルドログ

## 日付
2026-06-28

## 概要
UI-18〜UI-24 のUIポリッシュ完了後の統合QA。
主要導線・権限分岐・共有UX・空状態・ルーティングを静的解析とコード確認で検証。

軽微修正1件:
- `app/(app)/notes/[noteId]/preview.tsx` — UI-16B Alert テキストの不整合を修正

## 確認ファイル

### App Routes (全26ファイル)
```
app/index.tsx
app/_layout.tsx
app/+not-found.tsx
app/(auth)/_layout.tsx
app/(auth)/onboarding.tsx
app/(auth)/login.tsx
app/(auth)/sign-up.tsx
app/(auth)/profile-setup.tsx
app/(app)/_layout.tsx
app/(app)/home.tsx
app/(app)/calendar.tsx
app/(app)/settings.tsx
app/(app)/create/index.tsx
app/(app)/dev/place-callable-test.tsx
app/(app)/notes/[noteId]/index.tsx
app/(app)/notes/[noteId]/preview.tsx
app/(app)/notes/[noteId]/edit.tsx
app/(app)/notes/[noteId]/map.tsx
app/(app)/notes/[noteId]/share.tsx
app/(app)/notes/[noteId]/members.tsx
app/(app)/notes/[noteId]/flow-settings.tsx
app/(app)/notes/[noteId]/flows/[placeGroupId].tsx
app/(app)/notes/[noteId]/places/index.tsx
app/(app)/notes/[noteId]/places/[placeGroupId].tsx
app/(app)/notes/[noteId]/places/manual.tsx
app/(app)/notes/[noteId]/photos/viewer.tsx
```

### Logic Files
```
src/features/memoryNotes/utils/permissions.ts
src/features/memoryNotes/hooks/useMemoryNotesList.ts
src/features/memoryNotes/hooks/useNoteDetail.ts
src/features/memoryNotes/hooks/useNoteEditDraft.ts
src/features/memoryNotes/hooks/useManageNoteMembers.ts
src/core/auth/AuthContext.tsx
src/features/auth/hooks/useAuthSession.ts
src/core/repositories/noteRepository.ts
```

## 変更ファイル
- `app/(app)/notes/[noteId]/preview.tsx` — UI-16B Alert テキスト修正 (3行)

## 実行コマンド結果

### `npx tsc --noEmit`
Exit 0（エラーなし）

### `npx expo lint`
Exit 0（エラーなし）

### Route 存在確認 (`find app -type f | sort`)
全参照ルートのファイルが存在することを確認。壊れたルートなし。
