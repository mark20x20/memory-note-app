# Phase 1 Build Log

## 実施日
2026-06-10

## 環境
- OS: Ubuntu 22.04 (WSL2)
- Node.js: v20.20.2
- npm: 10.8.2
- Expo SDK: ~54.0.0
- React Native: ~0.81.5

---

## 実行コマンド一覧

### Firebase Web SDK インストール
```bash
npm install firebase --legacy-peer-deps
```
- 結果: 成功 (firebase@12.14.0)
- `--legacy-peer-deps` 使用理由: Phase 0 から継続。react-dom peer dep 問題回避

### 型チェック
```bash
npx tsc --noEmit
```
- 結果: 通過 (exit 0, 出力なし)

### lint
```bash
npx expo lint
```
- 結果: 通過 (exit 0, 出力なし)

### expo start 確認
```bash
CI=1 npx expo start
```
- 結果: Metro Bundler 起動確認。"Waiting on http://localhost:8081" まで到達、エラーなし

---

## 作成・変更ファイル一覧

### 変更ファイル
- `package.json` - firebase@^12.14.0 追加
- `src/utils/env.ts` - FIREBASE_MEASUREMENT_ID, FUNCTIONS_REGION, USE_FIREBASE_EMULATOR, EMULATOR_HOST 追加
- `src/core/firebase/client.ts` - Firebase 初期化実装 (stubs → 本実装)
- `src/features/auth/hooks/useAuthSession.ts` - Firebase Auth に接続
- `app/_layout.tsx` - Emulator 接続を useEffect で呼び出すよう更新
- `app/index.tsx` - useAuthSession フック使用に変更
- `.env.example` - 全変数追加

### 作成ファイル
- `src/core/firebase/emulator.ts` - Emulator 接続ロジック (新規)
- `implementation_logs/phase1/build_log.md` (本ファイル)
- `implementation_logs/phase1/decisions.md`
- `implementation_logs/phase1/issues.md`
- `implementation_logs/phase1/next_steps.md`

---

## 確認済み

- [x] `npx tsc --noEmit` 通過
- [x] `npx expo lint` 通過
- [x] `CI=1 npx expo start` - Metro Bundler 起動確認
- [x] `@react-native-firebase` 未使用
- [x] OpenAI APIキー未使用
- [x] Firebase Admin SDK 未使用
- [x] `.env` は git 管理対象外 (.gitignore に `.env.*` あり)
- [x] `.env.example` は git 管理対象 (`!.env.example` あり)
- [x] Firebase Web SDK のみ使用
- [ ] 実機 (Expo Go) 動作確認 - Windows PowerShell から実施

## Windows PowerShell / iPhone Expo Go 起動確認

### 実施内容

npx expo start -c

### 結果

- Windows PowerShell から Metro Bundler 起動確認
- iPhone / Expo Go で iOS bundle 確認
- ログイン手前の初期画面まで表示確認
- Firebase Config 未設定状態でもアプリがクラッシュしないことを確認
- Phase 1 の実機起動確認完了

### 警告

- SafeAreaView deprecated warning が表示された
- 現時点ではクラッシュ要因ではないため、Phase 2以降またはUI調整時に react-native-safe-area-context の SafeAreaView へ置き換える

## Firebase 実設定後の Expo Go 起動確認

### 実施内容

- Firebase Console で memory-note-app-dev を作成
- Authentication を有効化
- Firestore Database を作成
- Storage を作成
- Web App の Firebase config を .env に設定
- npx expo start -c で起動確認

### 結果

- iPhone / Expo Go でログイン画面まで表示確認
- Firebase config 設定後もアプリはクラッシュしなかった
- Firebase Auth は初期化されている

### 警告

- Firebase Auth の AsyncStorage persistence 未設定警告あり
- SafeAreaView deprecated warning あり

### 判断

- Phase 1 Firebase foundation は実機確認まで完了
- Auth persistence は Phase 2 で対応する
- SafeAreaView warning は UI調整時に対応する
