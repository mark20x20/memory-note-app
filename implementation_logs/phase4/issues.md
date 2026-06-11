# Phase 4 既知の問題・残課題

## I1: auth 画面のカラーが theme と不一致

**状態**: 既知・許容
**詳細**: `login.tsx`, `sign-up.tsx`, `onboarding.tsx`, `profile-setup.tsx` はスタイルをハードコード（`#4A90D9` blue）しており、Phase 4 で更新した coral テーマとは見た目が異なる。
**対応方針**: Phase 14 (Settings / Privacy / UI 整備) で認証画面のスタイルを theme に統一する。
**影響**: 機能的な問題なし。見た目の不統一のみ。

---

## I2: `(app)/_layout.tsx` / `app/index.tsx` の ActivityIndicator が blue のまま

**状態**: 既知・許容
**詳細**: これら2ファイルはハードコードされた `color="#4A90D9"` を持つため、ローディング中のインジケータが blue のまま。
**対応方針**: Phase 14 で colors.ts トークンを参照するよう変更。
**影響**: 機能的問題なし。アプリ起動時・ルートロード時の一瞬のインジケータのみ。

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

## I4: Bottom Navigation が未実装

**状態**: Phase 11 以降で実装予定
**詳細**: 仕様書では「ホーム / 地図 / 作成 / カレンダー / 設定」の Bottom Nav が定義されているが、現在は各画面のヘッダーボタンで代替している。
**対応方針**: Phase 11 (Map / Calendar / Search) 実装時に Bottom Tab Navigator を追加。

---

## I5: `colors.gray*` トークンが warm 系に変更されたことによる互換性

**状態**: 確認済み・問題なし
**詳細**: `gray50`〜`gray900` の値を warm 系に変更したが、既存画面で `colors.gray*` を直接参照している箇所はほぼなく（セマンティックトークン `textPrimary` 等を使用）、影響は軽微。
**確認方法**: TypeScript チェックとリント結果で確認。
