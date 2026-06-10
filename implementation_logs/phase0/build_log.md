# Phase 0 Build Log

## 実施日
2026-06-10

## 環境
- OS: Ubuntu 22.04 (WSL2)
- Node.js: v20.20.2
- npm: 10.8.2
- Expo SDK: 56.0.9

---

## 実行コマンド一覧

### プロジェクト作成
```bash
npx create-expo-app@latest memory-note-app --template blank-typescript
```
- 結果: 成功 (Expo SDK 56, React 19.2.3, React Native 0.85.3)

### Expo Router 導入
```bash
cd memory-note-app
npx expo install expo-router react-native-screens react-native-safe-area-context expo-linking expo-constants
```
- 結果: 成功。app.json に expo-router プラグインが自動追加された

### 追加パッケージ
```bash
npm install zustand zod react-hook-form dayjs --legacy-peer-deps
```
- 結果: 成功
- `--legacy-peer-deps` 使用理由: expo-router 内部の react-dom が react@^19.2.7 を要求するが、インストール済みは react@19.2.3 のため

### ESLint 設定
```bash
npx expo lint
```
- 初回実行で eslint@^9.0.0, eslint-config-expo@~56.0.4 が自動インストール
- eslint.config.js が自動生成された

### 型チェック
```bash
npx tsc --noEmit
```
- 1件エラー修正後、通過 (exit 0)

### lint
```bash
npx expo lint
```
- 修正後、通過 (exit 0)

---

## 修正した問題

| ファイル | 問題 | 修正内容 |
|---|---|---|
| src/shared/components/ui/AppText.tsx | 型エラー: Variant に 'button' がない | 'button' を Variant に追加 |
| app/(app)/home.tsx | lint: 未使用の router import | import を削除 |
| src/shared/components/ui/AppText.tsx | lint: 未使用の StyleSheet import | import を削除 |
| src/utils/env.ts | lint: expo/no-dynamic-env-var | 動的アクセスをやめ静的に ENV オブジェクトに変更 |
| src/utils/noop.ts | lint: Unused eslint-disable directive | コメントを削除 |

---

## 確認済み

- [x] `npx tsc --noEmit` 通過
- [x] `npx expo lint` 通過
- [ ] `npx expo start` - WSL2環境でデバイス/エミュレータ無しのため完全実行は不可。Windows PowerShell から実行すること
- [ ] EAS Build - Phase 1以降で設定

---

## 作成・変更ファイル一覧

### 設定ファイル
- `package.json` - main を expo-router/entry に変更、scripts追加
- `app.json` - scheme, bundleIdentifier, typedRoutes 追加
- `tsconfig.json` - paths 設定追加
- `babel.config.js` - 新規作成
- `metro.config.js` - 新規作成
- `eas.json` - 新規作成
- `.env.example` - 新規作成

### 削除ファイル
- `App.tsx` - expo-router 移行により不要
- `index.ts` - expo-router/entry に置き換え

### app/ (Expo Router)
- `app/_layout.tsx`
- `app/index.tsx`
- `app/+not-found.tsx`
- `app/(auth)/_layout.tsx`
- `app/(auth)/onboarding.tsx`
- `app/(auth)/login.tsx`
- `app/(app)/_layout.tsx`
- `app/(app)/home.tsx`

### src/ (アプリ本体)
- `src/shared/theme/colors.ts`
- `src/shared/theme/spacing.ts`
- `src/shared/theme/typography.ts`
- `src/shared/theme/index.ts`
- `src/shared/components/ui/AppText.tsx`
- `src/shared/components/ui/AppButton.tsx`
- `src/shared/components/ui/Screen.tsx`
- `src/shared/components/ui/index.ts`
- `src/core/constants/app.ts`
- `src/core/constants/routes.ts`
- `src/core/firebase/client.ts`
- `src/types/index.ts`
- `src/utils/noop.ts`
- `src/utils/env.ts`
- `src/features/auth/hooks/useAuthSession.ts`
- `src/features/memoryNotes/hooks/useMemoryNotesList.ts`
- `src/features/settings/hooks/useSettingsData.ts`

### firebase/
- `firebase/firestore.rules`
- `firebase/storage.rules`
- `firebase/functions/src/index.ts`

### generated_ui/
- `generated_ui/figma_make/notes.md`
