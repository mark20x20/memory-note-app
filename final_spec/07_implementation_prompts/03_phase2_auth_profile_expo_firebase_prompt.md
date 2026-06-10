# Phase 2 Auth Profile Expo Firebase Prompt v2

## 1. このプロンプトの目的

このドキュメントは、**Memory Note App / 思い出ノートアプリ** の **Phase 2: 認証・プロフィール基盤** を、  
**React Native + Expo + TypeScript + Expo Router** 前提で実装するための、Codex向け実装指示書です。

このPhaseの目的は、Firebase を既存バックエンドとして維持しながら、以下を実装可能な状態にすることです。

- Firebase Authentication によるログイン / ログアウト
- Email/Password 認証
- Google Sign-In
- Apple Sign-In
- users collection を使ったプロフィール保存
- AppUser 型を中心とした認証状態管理
- AuthRepository / ProfileRepository による責務分離
- UI から Firebase SDK を直接呼ばない構造の確立
- 将来のノート作成、共有、共同編集へつながる認証基盤の整備

---

## 2. 前提

### 2.1 技術スタック

- Mobile frontend: **React Native + Expo + TypeScript**
- Routing: **Expo Router**
- Backend: **Existing Firebase**
- Auth: **Firebase Authentication**
- DB: **Cloud Firestore**
- Storage: **Firebase Storage**
- Server: **Cloud Functions**
- Security: **Firestore Security Rules / Storage Rules**
- AI: **OpenAI API via Cloud Functions**
- Admin: **Streamlit + Firebase Admin SDK**
- Build: **EAS Build**

### 2.2 重要な制約

- **Supabase は使わない**
- **Flutter 前提は残さない**
- **OpenAI APIキーをモバイルアプリに入れない**
- **UI 層から Firebase SDK を直接呼ばない**
- Firebase の既存プロジェクト、Auth、Firestore、Storage、Functions、Rules は継続利用する
- このPhaseは「認証とプロフィールの土台」を作るもので、思い出ノート本体の実装はしない

### 2.3 認証方針

- Email/Password をサポートする
- Google Sign-In をサポートする
- Apple Sign-In をサポートする
- 匿名ログインは使わない
- ログイン状態は永続化する
- 新規ログイン後はプロフィール作成またはプロフィール補完へ誘導する

### 2.4 実装の考え方

- 画面は Expo Router で構成する
- 認証状態はアプリ起動時に復元する
- Firebase 認証情報は Repository 経由で扱う
- Firestore の `users/{userId}` をプロフィールの正とする
- 画面側は「表示」に徹し、データ取得・更新は UseCase / Repository に委譲する
- 既存ユーザーが再ログインした場合は、Firestore のプロフィールを読み出してアプリ状態へ反映する

---

## 3. Phase 2の実装範囲

### 3.1 実装するもの

| 分類 | 内容 |
|---|---|
| 認証基盤 | Firebase Auth 初期化、セッション復元、ログイン/ログアウト |
| 認証方式 | Email/Password、Google Sign-In、Apple Sign-In |
| プロフィール | `users` collection の作成・取得・更新 |
| 型定義 | `AppUser` 型、認証状態型、プロフィール型 |
| リポジトリ | `AuthRepository`、`ProfileRepository` |
| ストア / 状態管理 | 認証状態の管理、プロフィール状態の管理 |
| 画面 | ログイン、サインアップ、プロフィール作成、プロフィール編集、設定 |
| ガード | 未ログイン時のリダイレクト、プロフィール未完了時の誘導 |
| エラー処理 | 認証失敗、重複登録、ネットワーク失敗等の表示 |
| テスト | 認証フロー、プロフィール保存、遷移、失敗系 |

### 3.2 実装しないもの

| 分類 | 内容 |
|---|---|
| ノート作成 | 思い出ノート本体の作成フロー |
| 写真アップロード | 画像選択、圧縮、Storage 保存 |
| AI生成 | タイトル・日記生成 |
| 共有ノート | 招待、共同編集、権限管理 |
| SNS共有カード | カード生成・保存・共有 |
| 通知 | 招待通知、リマインド通知 |
| 課金 | サブスク、プラン、制限管理 |
| 管理画面連携 | Streamlit 側の実装 |
| 位置情報処理 | 位置情報取得、地図表示 |

### 3.3 Phase 2のゴール

- ユーザーが **Email / Google / Apple** のいずれかでログインできる
- 初回ログイン時に `users/{userId}` が作成される
- ログイン済みユーザーはプロフィール情報を参照・更新できる
- アプリ再起動後もログイン状態が維持される
- 認証状態に応じて Expo Router で画面遷移制御ができる
- UI が Firebase を直呼びしない構成が成立している

---

## 4. 作成・変更ファイル一覧

### 4.1 推奨ディレクトリ構成

```text
src/
  app/
    _layout.tsx
    index.tsx
    (auth)/
      login.tsx
      sign-up.tsx
      profile-setup.tsx
    (app)/
      home.tsx
      settings.tsx
      profile-edit.tsx

  features/
    auth/
      components/
      hooks/
      screens/
      types/
      usecases/
    profile/
      components/
      hooks/
      screens/
      types/
      usecases/

  infrastructure/
    firebase/
      client.ts
      authRepository.ts
      profileRepository.ts
      firestoreCollections.ts
    dto/
    mappers/

  domain/
    auth/
      AppUser.ts
      AuthState.ts
    profile/
      Profile.ts

  shared/
    components/
    hooks/
    utils/
    constants/
    errors/
    validators/

  store/
    authStore.ts
    profileStore.ts
```

### 4.2 追加・変更ファイル一覧

| ファイル | 役割 |
|---|---|
| `src/infrastructure/firebase/client.ts` | Firebase 初期化 |
| `src/infrastructure/firebase/authRepository.ts` | Firebase Auth 操作を集約 |
| `src/infrastructure/firebase/profileRepository.ts` | Firestore `users` の CRUD |
| `src/domain/auth/AppUser.ts` | アプリ共通ユーザー型 |
| `src/domain/auth/AuthState.ts` | 認証状態型 |
| `src/domain/profile/Profile.ts` | プロフィール型 |
| `src/store/authStore.ts` | 認証状態管理 |
| `src/store/profileStore.ts` | プロフィール状態管理 |
| `src/app/_layout.tsx` | 認証ガード、初期ルート制御 |
| `src/app/index.tsx` | 起動時のルート分岐 |
| `src/app/(auth)/login.tsx` | ログイン画面 |
| `src/app/(auth)/sign-up.tsx` | 新規登録画面 |
| `src/app/(auth)/profile-setup.tsx` | 初回プロフィール設定 |
| `src/app/(app)/profile-edit.tsx` | プロフィール編集画面 |
| `src/app/(app)/settings.tsx` | 設定画面 |
| `src/shared/utils/auth.ts` | 認証ユーティリティ |
| `src/shared/validators/authValidators.ts` | 入力検証 |
| `src/shared/errors/authErrors.ts` | エラー文言マッピング |

---

## 5. データモデル

### 5.1 Firestore `users` collection

Firestore の `users/{userId}` をプロフィールの正データとする。  
`userId` は Firebase Auth の `uid` と一致させる。

#### `users/{userId}` のフィールド

| フィールド | 型 | 必須 | 説明 |
|---|---|---:|---|
| userId | string | Yes | Firebase Auth UID |
| displayName | string | Yes | 表示名 |
| photoUrl | string | No | アイコンURL |
| email | string | No | メールアドレス |
| authProviders | string[] | Yes | `password`, `google.com`, `apple.com` など |
| locale | string | Yes | `ja-JP` など |
| timezone | string | No | `Asia/Tokyo` など |
| createdAt | timestamp | Yes | 作成日時 |
| updatedAt | timestamp | Yes | 更新日時 |
| lastLoginAt | timestamp | No | 最終ログイン日時 |
| status | string | Yes | `active`, `deleted`, `disabled` |
| analyticsOptIn | boolean | Yes | 分析同意 |
| privacyAcceptedAt | timestamp | No | プライバシー同意日時 |
| termsAcceptedAt | timestamp | No | 利用規約同意日時 |

### 5.2 AppUser type

`AppUser` は認証情報とプロフィール情報を統合したアプリ内共通型とする。

```ts
type AppUser = {
  uid: string;
  email: string | null;
  displayName: string;
  photoUrl: string | null;
  providers: string[];
  locale: string;
  timezone: string | null;
  status: 'active' | 'deleted' | 'disabled';
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
};
```

### 5.3 AuthState type

```ts
type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'needsProfileSetup'; uid: string; email: string | null }
  | { status: 'signedIn'; user: AppUser };
```

### 5.4 Profile type

`Profile` は `users` collection の Firestore ドメイン表現として扱う。

```ts
type Profile = {
  userId: string;
  displayName: string;
  photoUrl: string | null;
  email: string | null;
  authProviders: string[];
  locale: string;
  timezone: string | null;
  status: 'active' | 'deleted' | 'disabled';
  analyticsOptIn: boolean;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
};
```

### 5.5 Firestore との対応方針

- Auth の UID を Firestore ドキュメントIDに使う
- プロフィールは `users/{uid}` に保存する
- 初回ログイン時に `users/{uid}` がなければ作成する
- 既存ユーザーは `users/{uid}` を取得して状態を復元する
- UI は Firestore を直接触らず、Repository を通す

---

## 6. 画面要件

### 6.1 画面一覧

| 画面ID | 画面名 | 目的 |
|---|---|---|
| AUTH-001 | スプラッシュ / 起動判定 | 認証状態を復元してルート分岐 |
| AUTH-002 | ログイン画面 | Email / Google / Apple でログイン |
| AUTH-003 | 新規登録画面 | Email/Password でアカウント作成 |
| AUTH-004 | プロフィール作成画面 | 初回表示名設定 |
| AUTH-005 | プロフィール編集画面 | 表示名・アイコン・同意情報の更新 |
| AUTH-006 | 設定画面 | ログアウト、アカウント情報確認 |

### 6.2 ログイン画面の要件

- Email/Password ログイン
- Google ログインボタン
- Apple ログインボタン
- 「新規登録」への導線
- パスワードリセット導線は Phase 2 に含めてよいが必須ではない
- 認証中はローディング表示を出す
- エラー時は原因が分かる文言を表示する

### 6.3 新規登録画面の要件

- Email アドレス入力
- パスワード入力
- パスワード確認入力
- 利用規約・プライバシー同意導線
- 登録完了後にプロフィール作成へ遷移
- 既存アカウント重複時はログイン誘導

### 6.4 プロフィール作成画面の要件

- 表示名入力は必須
- アイコン画像は任意
- 初期言語は日本語前提
- 完了後にホームへ遷移
- `users/{userId}` を作成または更新する

### 6.5 プロフィール編集画面の要件

- 表示名変更
- アイコン更新
- ロケール、タイムゾーンの確認
- 利用規約・プライバシー同意日時の確認表示
- 保存ボタンで Firestore 更新

### 6.6 設定画面の要件

- 現在のログインユーザー情報表示
- ログアウト
- アカウント削除導線は Phase 2 では表示のみでも可
- サポート・プライバシー・規約リンク
- 認証プロバイダの表示

---

## 7. 認証フロー

### 7.1 アプリ起動時フロー

1. アプリ起動
2. Firebase 初期化
3. Auth のセッション復元を待つ
4. 未ログインならログイン画面へ
5. ログイン済みなら `users/{uid}` を取得
6. プロフィール未作成ならプロフィール作成画面へ
7. プロフィールありならホームへ遷移

### 7.2 Email/Password フロー

#### 新規登録
1. Email/Password を入力
2. Firebase Auth でアカウント作成
3. `users/{uid}` を作成
4. 表示名入力へ誘導
5. 完了後、ホームへ遷移

#### ログイン
1. Email/Password を入力
2. Firebase Auth でログイン
3. `users/{uid}` を取得
4. プロフィール存在確認
5. ホームへ遷移、またはプロフィール補完へ遷移

### 7.3 Google Sign-In フロー

1. Google ログインを開始
2. Expo / React Native の Google Sign-In 実装で ID Token を取得
3. Firebase Auth に credential を渡す
4. Firebase Auth でサインイン
5. `users/{uid}` を取得または作成
6. プロフィール未作成ならプロフィール作成へ
7. 完了後ホームへ遷移

### 7.4 Apple Sign-In フロー

1. Apple ログインを開始
2. Apple の認証結果から identity token を取得
3. Firebase Auth に credential を渡す
4. Firebase Auth でサインイン
5. `users/{uid}` を取得または作成
6. プロフィール未作成ならプロフィール作成へ
7. 完了後ホームへ遷移

### 7.5 ログアウトフロー

1. 設定画面からログアウトを押す
2. AuthRepository で signOut
3. 認証状態を signedOut に切り替える
4. ログイン画面へ遷移する

---

## 8. エラー処理

### 8.1 想定エラー

| エラー種別 | 例 | 表示方針 |
|---|---|---|
| 認証失敗 | パスワード不一致 | 具体的に案内する |
| 重複登録 | Email 既存 | ログイン誘導を出す |
| ネットワーク失敗 | 通信断 | 再試行ボタンを出す |
| トークン失効 | 再認証必要 | ログイン再実行へ誘導 |
| Firestore 失敗 | プロフィール保存失敗 | 再保存可能にする |
| Google/Apple失敗 | キャンセル、失敗 | ユーザーキャンセルと障害を分ける |
| 権限不足 | 想定外アクセス | エラー画面とログ出力 |

### 8.2 エラーハンドリング方針

- UI に生の Firebase エラーコードをそのまま出さない
- Repository でエラーをドメインエラーへ変換する
- 画面側は表示文言だけを扱う
- ユーザーキャンセルはエラー扱いにしない
- 失敗時は再試行可能な設計にする

### 8.3 必須エラー文言例

- 「ログインに失敗しました。入力内容をご確認ください。」
- 「通信に失敗しました。ネットワーク接続を確認して再試行してください。」
- 「プロフィールの保存に失敗しました。もう一度お試しください。」
- 「このアカウントは既に登録されています。ログインしてください。」

---

## 9. テスト観点

### 9.1 単体テスト

- Email/Password の入力検証
- 表示名バリデーション
- AppUser へのマッピング
- Profile へのマッピング
- エラーコードの変換

### 9.2 Repository テスト

- AuthRepository の signIn / signUp / signOut
- ProfileRepository の create / get / update
- users collection の存在チェック
- 初回ログイン時のプロフィール作成

### 9.3 画面テスト

- ログイン成功でホームへ遷移する
- プロフィール未作成で作成画面へ遷移する
- ログアウトでログイン画面へ戻る
- Google / Apple のキャンセル時に画面が壊れない
- エラー時に適切な文言が出る

### 9.4 統合テスト

- アプリ起動 → 認証復元 → ルート分岐
- 新規登録 → プロフィール作成 → ホーム
- 既存ログイン → users 取得 → ホーム
- 再起動後にセッション維持
- 認証状態変更時の Expo Router リダイレクト

### 9.5 手動確認項目

- iOS で Apple Sign-In が表示される
- Android で Google Sign-In が表示される
- Email/Password で新規登録できる
- ログアウト後に再ログインできる
- Firestore の `users/{uid}` が作成される
- UI から Firebase SDK を直接呼んでいない

---

## 10. 完了条件

このPhaseが完了したとみなす条件は以下です。

- React Native + Expo + TypeScript でアプリが起動する
- Expo Router による認証ガードが機能する
- Firebase Authentication で Email/Password、Google、Apple のログインができる
- ログイン後に `users/{uid}` が作成・参照される
- `AppUser` 型を中心にアプリ状態が管理されている
- `AuthRepository` と `ProfileRepository` が実装されている
- UI から Firebase SDK を直接呼ぶ構造になっていない
- エラー処理と再試行導線がある
- 手動テストで主要フローが通る

---

## 11. このPhaseではやらないこと

- 思い出ノート作成
- 写真選択・アップロード
- EXIF 取得
- 地図表示
- AIタイトル生成
- AI日記生成
- 共有ノート
- 招待
- 権限管理の本実装
- SNS共有カード生成
- 通知
- 課金
- 管理画面
- OpenAI API のモバイル直結
- Firebase 以外への移行
- Flutter 実装
- Supabase 実装

---