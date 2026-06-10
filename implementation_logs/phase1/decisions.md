# Phase 1 技術決定メモ

## 実施日
2026-06-10

---

## 決定事項

### 1. Firebase Web SDK v12 を採用 (not @react-native-firebase)
- **理由**: 仕様要件。@react-native-firebase はネイティブビルドを要するため、Expo Go での動作不可
- **影響**: 認証の永続化には Phase 2 で `getReactNativePersistence` (AsyncStorage) の設定が必要になる見込み

### 2. Firebase 未設定時の graceful fallback
- **理由**: 実際の Firebase プロジェクト値がなくてもアプリが crash しないようにする (Phase 1 要件)
- **内容**: `EXPO_PUBLIC_FIREBASE_API_KEY` と `PROJECT_ID` が空の場合、initializeApp をスキップ
- **動作**: auth/db/storage/functions が全て null になり、useAuthSession が isLoading=false で起動する

### 3. Emulator 接続をモジュールレベルではなく useEffect から呼ぶ設計
- **理由**: _layout.tsx の useEffect (一度だけ呼ばれる) から connectToEmulators() を呼ぶことで、アプリ起動時に一度だけ接続される
- **hot reload 対策**: emulator.ts 内の `emulatorsConnected` フラグと try-catch でダブルコネクションを防ぐ

### 4. src/core/firebase/ 構成を維持 (src/lib/firebase/ に移動しない)
- **理由**: Phase 0 で既に src/core/firebase/client.ts が存在し、spec の 03_expo_file_structure.md も src/core/ を Firebase 初期化の場所と定義している
- **変更点**: client.ts (実装済み) + emulator.ts (新規) の 2 ファイル構成

### 5. FIREBASE_FUNCTIONS_REGION デフォルト: asia-northeast1
- **理由**: 日本向けアプリのため。仕様書 (07_firebase_client_integration_for_expo.md) の推奨値

### 6. Expo SDK バージョンを上げない
- **理由**: Phase 0 で Expo Go (SDK 54) 対応に調整済み。Firebase 導入時も `npx expo install --fix` を使わず、Firebase Web SDK のみを追加
- **影響**: Firebase Web SDK は Expo に依存しない pure JavaScript のため、SDK バージョンに関係なく動作

### 7. app.config.ts へ移行しない
- **理由**: `EXPO_PUBLIC_` 変数は `app.json` 環境でも `process.env` から直接参照可能。Phase 1 では必要性なし
- **Phase 2 以降**: 環境ごとの config 分岐が必要になった時点で移行を検討
