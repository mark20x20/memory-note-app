# Phase 2 技術決定メモ

## 実施日
2026-06-11

---

## 決定事項

### 1. initializeAuth + getReactNativePersistence を使用
- **理由**: Phase 1 の Auth persistence 警告を解消するため
- **実装**: `src/core/firebase/client.ts` の `getOrInitAuth()` 関数で `try-catch` を使用し、hot reload 時の二重初期化を防ぐ
- **型問題**: `firebase/auth` の TypeScript 型に `getReactNativePersistence` が含まれないため、`src/types/firebase-rn.d.ts` でモジュール拡張宣言を追加

### 2. AuthState 型を導入
- **理由**: `isLoading/isAuthenticated` の boolean ペアより、状態を明確に表現できる
- **状態**: `loading` | `signedOut` | `needsProfileSetup` | `signedIn`
- **配置**: `src/features/auth/types/index.ts`

### 3. Repository パターン
- **AuthRepository**: `src/core/repositories/authRepository.ts` に Firebase Auth 操作を集約
- **UserRepository**: `src/core/repositories/userRepository.ts` に Firestore users CRUD を集約
- **理由**: UI から Firebase SDK を直接呼ばない構成

### 4. Sign-up フローの分離
- **sign-up.tsx**: Firebase Auth アカウント作成のみ実施、Firestore には書かない
- **profile-setup.tsx**: displayName 入力後に `userRepository.createUser` を呼ぶ
- **理由**: 登録直後のユーザーが必ず表示名を設定するフローを強制する

### 5. (app)/_layout.tsx に Auth ガードを配置
- **理由**: 認証済みユーザーのみが (app) グループ配下にアクセスできるよう保護
- **動作**: `loading` → ローディング表示、`signedIn` 以外 → onboarding にリダイレクト

### 6. profile-setup.tsx は auth.currentUser を直接参照
- **理由**: `useAuthSession` の `needsProfileSetup` 状態との二重依存を避ける
- **動作**: 保存成功後に `router.replace('/(app)/home')` で明示的に遷移

### 7. Firestore Security Rules の段階的更新
- `users/{uid}`: 認証済みユーザーが自分のドキュメントのみ read/write 可
- その他: 引き続き全拒否 (Phase 3 以降で順次開放)
- Storage: 認証済みユーザーのみ全パスにアクセス可 (Phase 3 以降でパスベースのルール追加)

### 8. UserProfile に plan フィールドを追加
- **理由**: 仕様書の要件 + 将来の課金機能への拡張に備える
- **初期値**: `free`
