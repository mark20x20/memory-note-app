# Phase 0 → Phase 1 引き継ぎ事項

## Phase 0 完了状態
- React Native + Expo + TypeScript プロジェクト初期化済み
- Expo Router 設定済み
- app/ ルート構造作成済み
- src/ 基礎構成作成済み
- 共通UIコンポーネント (AppText, AppButton, Screen) 作成済み
- theme (colors, spacing, typography) 作成済み
- Splash/Onboarding/Login/Home/NotFound 画面作成済み
- Firebase スタブ (全拒否 rules, client.ts) 作成済み
- typecheck 通過、lint 通過

---

## Phase 1 でやること

### 必須
1. Firebase SDK インストール
   ```bash
   npx expo install firebase
   npx expo install @react-native-firebase/app @react-native-firebase/auth
   ```
   または Firebase JS SDK (v9):
   ```bash
   npm install firebase --legacy-peer-deps
   ```

2. `src/core/firebase/client.ts` の実装
   - .env に EXPO_PUBLIC_FIREBASE_* を設定
   - initializeApp, getFirestore, getAuth, getStorage, getFunctions を実装

3. Firebase Auth 実装
   - `src/features/auth/hooks/useAuthSession.ts` を Firebase Auth に接続
   - Email/Password, Google Sign-In, Apple Sign-In の実装
   - セッション永続化

4. Firebase Emulator Suite 設定
   - `firebase.json` に emulator 設定追加
   - `firebase emulator:start` でローカル検証

5. `app/index.tsx` の認証ガード実装
   - `useAuthSession` を使って認証状態で振り分け

### 推奨
- `src/core/repositories/` に AuthRepository, UserRepository のスタブ実装
- Zustand ストアで認証状態管理

---

## Phase 1 での注意点

| 項目 | 注意 |
|---|---|
| Firebase SDK バージョン | Expo SDK 56 に対応した Firebase JS SDK v11 推奨 |
| iOS Apple Sign-In | Apple Developer Program 要。expo-apple-authentication を使う |
| Android Google Sign-In | expo-auth-session または @react-native-google-signin を使う |
| Firebase Emulator | 開発中は必ず Emulator を使い、本番に書かない |
| Firestore Rules | 認証後のルールを段階的に実装 |
| --legacy-peer-deps | 引き続き必要な可能性が高い |

---

## Windows での起動手順

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx expo start
```

iOS/Android エミュレータまたは Expo Go で確認する。
