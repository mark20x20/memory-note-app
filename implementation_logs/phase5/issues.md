# Phase 5 既知の問題・残課題

## I1: Firestore インデックス — 将来的に必要

**状態**: 現在問題なし・Phase 11 以降で対応推奨
**詳細**: `where('ownerId', '==', uid)` + `orderBy('createdAt', 'desc')` の複合クエリは Firestore の複合インデックスが必要。
Phase 5 はクライアントソートで回避しているが、ノート件数が増えた Phase 11 以降では Firestore インデックスを追加することを推奨。
**対応方針**: `firestore.indexes.json` に `memory_notes` の複合インデックス（ownerId ASC, createdAt DESC）を追加する。
**影響**: 現時点では影響なし。

---

## I2: serverTimestamp の pending 状態

**状態**: 既知・許容
**詳細**: `addDoc` に `serverTimestamp()` を使うと、`onSnapshot` のローカルキャッシュでは `createdAt` が最初 `null` になる場合がある（`hasPendingWrites: true`）。
そのため、ノートカードの日付チップが一時的に表示されないことがある。
**対応方針**: `createdAt` が `null` の場合は日付チップを非表示にすることで対応済み（条件レンダリング）。
**影響**: UX 上の軽微な日付表示遅延のみ。実用上問題なし。

---

## I3: TypeScript / Lint の自動確認不可（Phase 4 から継続）

**状態**: 手動確認が必要
**詳細**: CI 環境の bash では `npx` が PATH に存在しないため、`npx tsc --noEmit` と `npx expo lint` を自動実行できない。
**対応方針**: ユーザーが PowerShell で手動実行する必要あり。
**コマンド**:
```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx tsc --noEmit
npx expo lint
```

---

## I4: notes/[noteId].tsx → notes/[noteId]/index.tsx への移行（Phase 4 から継続）

**状態**: 既知・Phase 8 で対応予定
**詳細**: Phase 8（Map実装）で `app/(app)/notes/[noteId]/map.tsx` を追加する際に移行が必要。
**対応方針**: Phase 8 実装開始前に移行する。

---

## I5: MemoryNote 型の不整合

**状態**: 既知・Phase 9〜10 で整理予定
**詳細**: `src/types/index.ts` の `MemoryNote` 型（Phase 0 定義）と `src/core/repositories/noteRepository.ts` の `NoteDoc` 型（Phase 5 定義）が並存している。
両者は構造が異なる（`description` vs `memo`、`coverPhotoUrl` の有無など）。
**対応方針**: Phase 9〜10（ノート詳細の本格実装時）に `src/types/index.ts` の `MemoryNote` を `NoteDoc` に統合または整理する。
**影響**: `useMemoryNotesList.ts` が `src/types/index.ts` の `MemoryNote` を使わなくなっているため、直接の問題はなし。ただし他箇所で `MemoryNote` を使っている場合は注意。

---

## I6: 共有ノート作成の UI は存在するが機能しない

**状態**: 既知・許容
**詳細**: Create 画面に「共有ノート」ボタンがあるが `disabled` になっており、押せない。
**対応方針**: Phase 11 で共有機能を実装する際に有効化する。
**影響**: なし。
