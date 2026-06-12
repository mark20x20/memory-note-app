# Phase 11 Build Log — Shared Notes / Member Management / Permission Control

## 実施日: 2026-06-12

## TypeScript チェック
```
npx tsc --noEmit
→ Exit 0 (エラーなし)
```

## Lint チェック
```
npx expo lint
→ Exit 0 (エラーなし)
```

## Cloud Functions ビルド
```
cd firebase/functions && npm run build
→ Exit 0 (エラーなし)
tsc コンパイル完了: lib/index.js 生成
```

## 作成ファイル一覧

### アプリ側
- `src/features/memoryNotes/utils/permissions.ts` — 権限ヘルパー（pure functions）
- `src/core/repositories/memberRepository.ts` — Cloud Functions callable ラッパー
- `src/features/memoryNotes/hooks/useNoteMembers.ts` — メンバープロフィール取得フック
- `src/features/memoryNotes/hooks/useManageNoteMembers.ts` — メンバー管理状態フック
- `app/(app)/notes/[noteId]/members.tsx` — メンバー管理画面

### Cloud Functions
- `firebase/functions/src/index.ts` — 3 functions 追加:
  - `addNoteMemberByEmail`
  - `updateNoteMemberRole`
  - `removeNoteMember`
  - `generateMemoryDiary` 更新（viewer 不可に変更）

## 更新ファイル一覧

### アプリ側
- `src/features/memoryNotes/hooks/useMemoryNotesList.ts` — 共有ノートクエリ追加
- `src/features/memoryNotes/components/AiDiarySection.tsx` — `canRegenerate` prop 追加
- `app/(app)/notes/[noteId]/index.tsx` — 権限ゲート（edit/members ボタン、AI再生成）
- `app/(app)/notes/[noteId]/edit.tsx` — 権限ゲート（viewer 拒否、editor の削除ボタン非表示）

### Firebase Rules
- `firebase/firestore.rules` — users read 開放、note update 強化、photos 権限 role ベース
- `firebase/storage.rules` — members read 許可（firestore.get 使用）

## デプロイ必要なもの
```bash
# Functions
npx firebase-tools deploy --only functions --project memory-note-app-dev

# Rules（両方）
npx firebase-tools deploy --only firestore:rules,storage --project memory-note-app-dev
```
