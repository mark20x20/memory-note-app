# Phase 2 → Phase 3 引き継ぎ事項

## Phase 2 完了状態
- `@react-native-async-storage/async-storage` 導入済み
- `initializeAuth + getReactNativePersistence` による Auth persistence 設定済み
- Email/Password 認証 (signUp/signIn/logout) 実装済み
- `users/{uid}` Firestore ドキュメント作成・取得ロジック実装済み
- プロフィール設定画面 (displayName 入力) 実装済み
- 設定画面 (ログアウト) 実装済み
- Firestore Security Rules: users/{uid} ユーザー自身のみ read/write 可に更新済み
- Storage Rules: 認証済みユーザーのみに更新済み

---

## Phase 3 でやること

### 必須
1. ノート作成フロー
   - `memory_notes` コレクション + Firestore Security Rules 追加
   - 写真選択 (expo-image-picker)
   - ノート一覧画面の実装

2. Firestore Security Rules 追加
   ```
   match /memory_notes/{noteId} {
     allow read: if request.auth != null && ...memberCheck...;
     allow write: if request.auth != null && ...roleCheck...;
   }
   ```

3. Auth Context 化
   - `useAuthSession` を React Context に移行して多重 subscription を防ぐ
   - アプリ全体から `useCurrentUser()` で参照できるようにする

### 推奨
4. Google Sign-In 完成
   ```bash
   npx expo install expo-auth-session expo-web-browser
   ```
5. Apple Sign-In 完成
   ```bash
   npx expo install expo-apple-authentication
   ```
6. パスワードリセット機能
   - `sendPasswordResetEmail(auth, email)`

---

## Windows での起動手順

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx expo start -c
```

実機確認手順:
1. iPhone で Expo Go アプリを開く
2. QR コードをスキャン
3. Email/Password で新規登録テスト
4. ログアウト → 再ログインテスト
5. Firebase Console で users/{uid} が作成されていることを確認

---

## Phase 3 での注意点

| 項目 | 注意 |
|---|---|
| Firestore Rules | memory_notes のルールは memberUserIds array-contains で読み取り制限 |
| photo upload | 圧縮後サイズ < 2MB を守る。expo-image-manipulator で圧縮 |
| Google Sign-In | expo-auth-session の PKCE フロー。google-services.json 不要 |
| Apple Sign-In | Apple Developer Program 必要。nonce の実装に注意 |
| useAuthSession | 現状は各コンポーネントで独立した subscription。Context 化で統一を推奨 |

参照: `final_spec/07_implementation_prompts/` 配下の Phase 3 プロンプト (未作成)
