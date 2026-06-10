# Phase 1 Issues Log

## 実施日
2026-06-10

---

## 解決済み

| # | 問題 | 原因 | 解決策 |
|---|---|---|---|
| 1 | Firebase v12 は `getApp()` で取得する | `getApps()[0]` は FirebaseApp を返すが、型定義が変わっている可能性 | `getApp()` (引数なし) を使用して既存アプリを取得 |
| 2 | `measurementId` が空文字の場合に Firebase Config に混入 | 空文字を渡すと不要なフィールドが増える | `ENV.FIREBASE_MEASUREMENT_ID` が空の場合はオブジェクトに含めない (`...{} spread`) |

---

## 既知の注意事項（未解決だが問題なし）

| # | 事象 | 判断 |
|---|---|---|
| 1 | Firebase v12 は Expo SDK 54 の公式互換マトリクスに記載なし | Firebase Web SDK は pure JavaScript で Expo SDK バージョンに依存しない。実際の起動確認でエラーなし |
| 2 | npm audit: 12 moderate vulnerabilities | Phase 0 からの継続 + Firebase 追加分。アプリコードには無関係 |
| 3 | Auth 永続化 (AsyncStorage 未設定) | Phase 2 で `getReactNativePersistence` を追加する。Phase 1 では in-memory persistence で動作 |
| 4 | emulator.ts の `emulatorsConnected` フラグは hot reload でリセットされる | try-catch で二重接続を吸収。実際の開発時は大きな問題にならない |

---

## Phase 2 で注意すること

- Firebase Auth の永続化: `getReactNativePersistence(AsyncStorage)` を `initializeAuth` で設定すること
- Google Sign-In: `expo-auth-session` または `expo-google-sign-in` を使う
- Apple Sign-In: `expo-apple-authentication` を使う
- Firebase Emulator の EXPO_PUBLIC_FIREBASE_EMULATOR_HOST: 実機テスト時は PC の LAN IP に変更すること
- Android Emulator では `10.0.2.2` を使うこと
