# Phase 9 Build Log — AI Generation via Cloud Functions

**Date:** 2026-06-12
**Status:** Completed (deploy pending)

## 作業内容

### 新規作成ファイル

| ファイル | 概要 |
|---|---|
| `firebase/functions/package.json` | Functions 依存関係定義（firebase-admin / firebase-functions / openai / typescript） |
| `firebase/functions/tsconfig.json` | Functions TypeScript コンパイル設定（target: es2017, module: commonjs） |
| `firebase/functions/.gitignore` | lib/ と node_modules/ を除外 |
| `src/core/repositories/aiDiaryRepository.ts` | httpsCallable で generateMemoryDiary を呼び出すリポジトリ |
| `src/features/memoryNotes/hooks/useNoteDetail.ts` | memory_notes/{noteId} を onSnapshot でリアルタイム購読するフック |
| `src/features/memoryNotes/hooks/useGenerateDiary.ts` | AI日記生成フック（isGenerating / error 管理） |
| `src/features/memoryNotes/components/AiDiarySection.tsx` | 4状態 UI コンポーネント（idle / generating / completed / failed） |
| `implementation_logs/phase9/build_log.md` | このファイル |
| `implementation_logs/phase9/decisions.md` | 設計決定記録 |
| `implementation_logs/phase9/issues.md` | 既知の問題・リスク |
| `implementation_logs/phase9/next_steps.md` | 実装ステップと次フェーズへの引き継ぎ |

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `firebase/functions/src/index.ts` | generateMemoryDiary Callable Function 実装（スタブから本実装へ） |
| `firebase.json` | functions.source を追加 |
| `src/core/repositories/noteRepository.ts` | NoteDoc に aiDiary* フィールドを optional 追加 |
| `app/(app)/notes/[noteId].tsx` | useNoteDetail に切り替え、AiDiarySection を統合 |
| `generated_ui/figma_make/reference_map.md` | Phase 9 ステータス更新 |

### インストールパッケージ（Functions 側）

`firebase/functions/` でユーザーが `npm install` を実行する必要がある:
- `firebase-admin@^13.0.0`
- `firebase-functions@^6.0.0`
- `openai@^4.0.0`
- `typescript@~5.9.0`（devDependencies）
- `@types/node@^20.0.0`（devDependencies）

### インストールパッケージ（モバイル側）

なし（httpsCallable は firebase/functions から使用。既存パッケージで対応）

## 実装内容詳細

### firebase/functions/src/index.ts

- `onCall` (Firebase Functions v2) で `generateMemoryDiary` を実装
- `defineSecret('OPENAI_API_KEY')` で Secret Manager から APIキーを参照
- 認証チェック → noteId バリデーション → Firestore 取得 → 権限確認 → 重複生成拒否 → 生成 → 保存
- 写真メタデータのみを AI に渡す（画像は送らない）
- 生成失敗時も `aiDiaryStatus: 'failed'` を保存してノート閲覧を妨げない
- モデル: gpt-4o-mini / max_tokens: 300 / temperature: 0.7

### モバイル側の変更

- `useNoteDetail`: `getNoteById`（1回取得）→ `onSnapshot`（リアルタイム購読）へ切り替え
- `AiDiarySection`: 4状態に応じた UI を独立コンポーネント化
- `[noteId].tsx`: `useEffect` / `useState` によるノート読み込みを `useNoteDetail` に置き換え

## 確認コマンド結果

```
npx tsc --noEmit    → 通過（エラーなし）
npx expo lint       → 通過（エラーなし）
cd firebase/functions && npm install → ユーザー実行待ち（npm がエージェント環境では利用不可）
cd firebase/functions && npm run build → ユーザー実行待ち
```
