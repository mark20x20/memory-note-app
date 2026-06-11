# Phase 4.5 既知の問題・残課題

## I1: notes/[noteId].tsx → notes/[noteId]/index.tsx への移行が必要

**状態**: 既知・Phase 8 で対応予定
**詳細**: Phase 8（Map実装）で `app/(app)/notes/[noteId]/map.tsx` を追加する際、現在の `notes/[noteId].tsx`（単一ファイル）との共存が不可能になる。Expo Router では `[noteId].tsx` と `[noteId]/` ディレクトリは共存できない。
**対応方針**: Phase 8 実装開始前に `notes/[noteId].tsx` → `notes/[noteId]/index.tsx` に移行する。
**影響**: 機能的な問題なし（現時点）。Phase 8 開始前のリマインダーとして記録。

---

## I2: Bottom Navigation は Phase 11 まで未実装

**状態**: 既知・許容
**詳細**: 仕様書（`01_screen_list.md` §15）では「ホーム / 地図 / 作成 / カレンダー / 設定」の Bottom Tab Navigation が定義されているが、現在は各画面のヘッダーボタンで代替している。
**対応方針**: Phase 11（Collaboration / Permissions）実装時に Bottom Tab Navigator を追加。Phase 4.5 の `ui_design_system.md` にデザインルールを記録済み。
**影響**: 機能的な問題なし。UIナビゲーション体験が仕様書と異なるのみ。

---

## I3: TypeScript / Lint の自動確認不可

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

## I4: auth 画面のカラーが theme と不一致

**状態**: 既知・許容（Phase 4 から継続）
**詳細**: `login.tsx`, `sign-up.tsx`, `onboarding.tsx`, `profile-setup.tsx` はスタイルをハードコード（`#4A90D9` blue）しており、coral テーマとは見た目が異なる。
**対応方針**: Phase 14 で認証画面のスタイルを theme に統一する。
**影響**: 機能的な問題なし。見た目の不統一のみ。

---

## I5: Figma Make の実際の生成はまだ行われていない

**状態**: Phase 5 開始前に実施予定
**詳細**: Phase 4.5 では Figma Make 生成のルール・プロンプト・保存場所を整備したが、実際の生成はまだ行っていない。`generated_ui/figma_make/phase5_memory_note_creation/` 以降のフォルダはまだ空。
**対応方針**: Phase 5 実装開始前にユーザーが Figma Make で以下を生成する:
- SCR-CREATE-001（作成開始）
- SCR-CREATE-002（写真選択）
- SCR-HOME-001（ノートカード一覧状態）
**影響**: Phase 5 実装を始める前に生成しておくことを推奨。生成なしでも実装は可能（参考なしで進む）。

---

## I6: `memory_notes` Firestore Security Rules が未設定

**状態**: Phase 5 開始前に対応必須
**詳細**: Phase 5 で `memory_notes` コレクションへの Firestore 保存を実装する前に、Security Rules を設定する必要がある。現在 `memory_notes` コレクションのルールは未定義。
**対応方針**: Phase 5 実装開始前に、`implementation_logs/phase4/next_steps.md` §注意事項 に従って Firestore Security Rules を設定する。
**コレクション設計例**:
```
/memory_notes/{noteId}
  - ownerId: string (= Firebase Auth uid)
  - title: string
  - memo: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - members: { [uid]: 'owner' | 'editor' | 'viewer' }
```
**影響**: Phase 5 実装前に必ず解決すること。
