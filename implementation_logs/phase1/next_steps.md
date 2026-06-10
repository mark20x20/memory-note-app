# Phase 1 → Phase 2 引き継ぎ事項

## Phase 1 完了状態
- Firebase Web SDK (v12.14.0) インストール済み
- `src/core/firebase/client.ts` 実装済み (initializeApp, getAuth, getFirestore, getStorage, getFunctions)
- `src/core/firebase/emulator.ts` 実装済み (Emulator 接続ロジック)
- `src/features/auth/hooks/useAuthSession.ts` Firebase Auth に接続済み (`onAuthStateChanged`)
- `app/_layout.tsx` Emulator 接続呼び出し追加
- `app/index.tsx` useAuthSession フック使用
- `.env.example` 全変数追加済み
- typecheck 通過、lint 通過、Expo start 確認済み

---

## Phase 2 でやること

### 必須
1. Firebase Auth の永続化設定
   ```ts
   import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   // getAuth の代わりに initializeAuth を使う
   ```
   - `@react-native-async-storage/async-storage` のインストールが必要

2. Apple Sign-In 実装
   ```bash
   npx expo install expo-apple-authentication
   ```
   - Apple Developer Program 要

3. Google Sign-In 実装
   ```bash
   npx expo install expo-auth-session expo-web-browser
   ```
   - または `@react-native-google-signin/google-signin`

4. Email/Password Sign-In 実装
   - `createUserWithEmailAndPassword`
   - `signInWithEmailAndPassword`

5. ユーザープロフィール作成
   - Firestore `users/{uid}` への初回書き込み
   - `src/core/repositories/user_repository.ts` 実装

6. ログアウト機能
   - `signOut(auth)` の実装

7. Firestore Security Rules 更新
   - `firebase/firestore.rules` を認証済みユーザーベースのルールに更新

### 推奨
- Firebase Emulator Suite のローカル検証
  ```bash
  firebase emulators:start --only auth,firestore,storage,functions
  ```
- `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true` + `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=<PC LAN IP>` で実機テスト

---

## Phase 2 での注意点

| 項目 | 注意 |
|---|---|
| initializeAuth vs getAuth | React Native では initializeAuth + getReactNativePersistence を使う |
| iOS Apple Sign-In | Apple Developer Program 要。束縛 (nonce) の実装に注意 |
| Android Google Sign-In | GoogleService-Info.plist / google-services.json が必要 |
| Firebase Emulator Host | 実機・Expo Go では localhost は使えない。PC の LAN IP を使う |
| Firestore Rules | `allow read, write: if false;` をまず緩め、段階的に権限ルールを追加 |
| --legacy-peer-deps | 引き続き必要な可能性が高い |

---

## Windows での起動手順

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx expo start
```

実際の Firebase プロジェクトに接続するには:
1. Firebase Console で Web アプリを登録
2. `.env.example` を `.env` にコピー
3. Firebase の設定値を `.env` に記入
4. アプリを再起動

参照: `final_spec/07_implementation_prompts/03_phase2_auth_profile_expo_firebase_prompt.md`
