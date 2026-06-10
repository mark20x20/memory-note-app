# Phase 2 Build Log

## 実施日
2026-06-11

## 環境
- OS: Ubuntu 22.04 (WSL2)
- Node.js: v20.20.2
- npm: 10.8.2
- Expo SDK: ~54.0.0
- React Native: ~0.81.5
- Firebase Web SDK: 12.14.0

---

## 実行コマンド一覧

### @react-native-async-storage/async-storage インストール
```bash
npm install @react-native-async-storage/async-storage --legacy-peer-deps
```
- 結果: 成功 (@react-native-async-storage/async-storage@2.1.2)
- `--legacy-peer-deps` 使用理由: Phase 0/1 から継続

### 型チェック
```bash
npx tsc --noEmit
```
- 結果: 通過 (exit 0, 出力なし)

### lint
```bash
npx expo lint
```
- 結果: 通過 (exit 0)

### expo start 確認
```bash
CI=1 npx expo start
```
- 結果: Metro Bundler 起動確認 (port 8081 で既存インスタンスが動作中)

---

## 作成ファイル一覧

### 新規作成
- `src/features/auth/types/index.ts` - UserProfile, AuthState 型定義
- `src/shared/errors/authErrors.ts` - Firebase エラーコード → 日本語メッセージ変換
- `src/core/repositories/authRepository.ts` - Firebase Auth 操作 (signUp/signIn/logout)
- `src/core/repositories/userRepository.ts` - Firestore users/{uid} CRUD
- `src/types/firebase-rn.d.ts` - getReactNativePersistence の型拡張宣言
- `app/(auth)/sign-up.tsx` - 新規登録画面
- `app/(auth)/profile-setup.tsx` - プロフィール設定画面
- `app/(app)/settings.tsx` - 設定画面 (ログアウト含む)
- `implementation_logs/phase2/` (本ファイル含む4ファイル)

### 変更ファイル
- `src/core/firebase/client.ts` - initializeAuth + getReactNativePersistence に変更
- `src/features/auth/hooks/useAuthSession.ts` - AuthState を返すよう拡張
- `app/index.tsx` - needsProfileSetup 状態対応
- `app/(auth)/_layout.tsx` - sign-up, profile-setup 追加
- `app/(app)/_layout.tsx` - Auth ガード + settings 追加
- `app/(auth)/login.tsx` - Email/Password UI + 実装
- `app/(app)/home.tsx` - 設定ボタン追加
- `firebase/firestore.rules` - users/{uid} セキュリティルール
- `firebase/storage.rules` - 認証済みユーザーのみに更新
- `.expo/types/router.d.ts` - 新ルート追加

---

## 確認済み

- [x] `npx tsc --noEmit` 通過
- [x] `npx expo lint` 通過
- [x] `CI=1 npx expo start` - Metro Bundler 起動確認
- [ ] 実機 (Expo Go) 動作確認 - Windows PowerShell から実施
- [ ] Email/Password 登録・ログイン動作確認
- [ ] Firestore users/{uid} 作成確認

---

## 特記事項

### getReactNativePersistence 型解決問題
- `firebase/auth` (firebase パッケージのラッパー) の exports に react-native 条件がなく、TypeScript が browser 型を使用
- 解決策: `src/types/firebase-rn.d.ts` でモジュール拡張宣言を追加
- runtime (Metro) は正しく React Native ビルドを使用するため動作問題なし

### Expo Router 型定義
- 新規ルート (sign-up, profile-setup, settings) は `.expo/types/router.d.ts` を手動更新
- `npx expo start` 起動時に自動再生成される

## Expo Go / Firebase 実機確認

### 実施内容

- iPhone / Expo Go でアプリを起動
- Email/Password で新規登録
- プロフィール設定画面で displayName を保存
- Firestore Console で users/{uid} を確認

### 結果

- 新規登録後に users コレクションが作成された
- users/{uid} に uid, email, displayName, photoURL, plan, createdAt, updatedAt が保存された
- plan の初期値が free で保存された
- Phase 2 の主要な実機確認が完了

### 補足

- Google Sign-In / Apple Sign-In は未実装のまま後続Phaseへ延期
- 写真アップロード / AI生成 / SNS共有は未実装
