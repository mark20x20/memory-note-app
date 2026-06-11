# Phase 5 Build Log — Memory Note Creation

## 実施日
2026-06-11

## 実施内容

### 作成ファイル

| ファイル | 種別 | 説明 |
|---|---|---|
| `src/core/repositories/noteRepository.ts` | 新規 | Firestoreノート CRUD (createNote / getNotesByOwner / getNoteById) |
| `src/features/memoryNotes/hooks/useCreateNote.ts` | 新規 | ノート作成フォーム状態管理 hook |
| `implementation_logs/phase5/build_log.md` | 新規 | 本ファイル |
| `implementation_logs/phase5/decisions.md` | 新規 | Phase 5 設計決定ログ |
| `implementation_logs/phase5/issues.md` | 新規 | Phase 5 既知の問題・残課題 |
| `implementation_logs/phase5/next_steps.md` | 新規 | Phase 5 → Phase 6 引き継ぎ事項 |

### 更新ファイル

| ファイル | 種別 | 説明 |
|---|---|---|
| `firebase/firestore.rules` | 更新 | `memory_notes` コレクションのルールを追加 |
| `src/features/memoryNotes/hooks/useMemoryNotesList.ts` | 更新 | Firestore onSnapshot でリアルタイムノート一覧取得に変更 |
| `app/(app)/create/index.tsx` | 更新 | プレースホルダー → 実フォーム（タイトル/メモ/ノート種別/保存ボタン）|
| `app/(app)/home.tsx` | 更新 | プレースホルダー一覧 → 実ノートカード一覧表示 |
| `app/(app)/notes/[noteId].tsx` | 更新 | プレースホルダー表示 → Firestore実データ表示 |

---

## チェックリスト

- [x] Firestore Security Rules に `memory_notes` ルール追加
- [x] `noteRepository.ts` 作成 (createNote / getNotesByOwner / getNoteById)
- [x] `useCreateNote.ts` 作成 (title / memo / noteType / isSaving / error / validate / saveNote)
- [x] `useMemoryNotesList.ts` を Firestore onSnapshot 対応に更新
- [x] Create 画面をフォーム化（タイトル必須バリデーション、保存中ローディング、エラー表示）
- [x] 保存成功後に `/(app)/notes/[noteId]` へ遷移
- [x] Home 画面にノートカード一覧を表示
- [x] Home 画面にローディング・エラー状態を表示
- [x] Detail 画面で Firestore からノートを取得・表示
- [x] Detail 画面にローディング・エラー・NotFound 状態を表示
- [ ] `npx tsc --noEmit` — ユーザーが手動実行（bash から npx が使えないため）
- [ ] `npx expo lint` — ユーザーが手動実行
- [ ] Expo Go での動作確認 — ユーザーが手動確認

---

## 確認コマンド（ユーザー実行）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx tsc --noEmit
npx expo lint
```
