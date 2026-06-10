# Phase 2: Auth / Profile 実装プロンプト v2

あなたは **Flutter / Firebase 実装エージェント** です。  
これから **Memory Note App / 思い出ノートアプリ** の **Phase 2: Auth / Profile** を実装してください。

---

## 1. このフェーズの目的

Phase 2 では、アプリの土台の上に **認証・プロフィール・起動時分岐** を実装します。  
このフェーズのゴールは、ユーザーが以下を行える状態にすることです。

- Email / Password で登録・ログインできる
- Google Sign-In でログインできる
- Apple Sign-In でログインできる
- ログイン状態が保持される
- ユーザーのプロフィールを Firestore の `users` に保存できる
- プロフィール未作成なら ProfileSetup に誘導できる
- ログアウトできる
- アカウント削除導線の stub を用意できる
- UI から Firebase を直接呼ばず、Repository / UseCase / Controller 経由で実装できる

---

## 2. プロジェクト前提

### 2.1 既存成果物前提
Phase 0 / Phase 1 は完了済みとみなしてください。  
以下がすでにある前提で実装してください。

- Flutter プロジェクト初期化済み
- `lib/` の feature-first 構成あり
- `main.dart` / `app.dart` / bootstrap / theme / routing の土台あり
- `firebase_options_*.dart` の運用方針あり
- Firebase 初期化基盤あり
- Firestore / Storage / Functions / Analytics / Crashlytics の基盤あり
- `Result / Failure / AppException` の共通基盤あり
- 共通UI `AppScaffold` / `AppLoading` / `AppErrorView` などの雛形あり

### 2.2 技術方針
- Flutter + Firebase + Riverpod + go_router 前提
- feature-first 構成
- `presentation / application / domain / infrastructure` を分ける
- UI から Firebase SDK を直接呼ばない
- 認証とプロフィールは分離して扱う
- Google / Apple は環境依存部分があるため、必要なら TODO と実装手順を残す
- 秘密情報や API キーは直書きしない
- コメント、変数名、関数名、クラス名は英語
- 表示文言は日本語でよい

### 2.3 重要な制約
- **匿名ログインは使わない**
- **OpenAI API は触らない**
- **Memory Note 作成・アップロード・AI・共有カードはこのPhaseではやらない**
- **users collection のプロフィール保存に集中する**
- **Google / Apple の実装が環境依存で一部動かない場合は、理由と TODO を明示する**
- **本番デプロイ、ストア提出はしない**

---

## 3. Phase 2 の実装範囲

以下を実装してください。

### 3.1 認証
- Email / Password 登録
- Email / Password ログイン
- Google Sign-In
- Apple Sign-In
- ログアウト
- ログイン状態監視
- エラー表示
- 日本語エラーメッセージ変換

### 3.2 プロフィール
- `users` ドキュメントへの初期作成
- 表示名の作成・編集
- メールアドレス保存
- プロバイダ一覧保存
- locale / timezone 保存
- status 管理
- プロフィール監視
- プロフィール未作成時の誘導

### 3.3 起動・遷移
- SplashScreen
- OnboardingScreen
- SignInScreen
- SignUpScreen
- ProfileSetupScreen
- NoteListScreen への遷移
- Settings から SignOut

### 3.4 実装補助
- Auth guard
- Profile guard
- basic auth tests
- basic profile tests
- route guard tests
- widget test for SignInScreen

---

## 4. 実装ファイル一覧

必要に応じて補助ファイルを追加して構いませんが、少なくとも以下を作成・変更してください。

| パス | 目的 | 実装内容 |
|---|---|---|
| `lib/features/auth/domain/entities/app_user.dart` | 認証ユーザーのドメイン表現 | Firebase Auth / Firestore と独立したユーザーエンティティ |
| `lib/features/auth/domain/repositories/auth_repository.dart` | 認証抽象 | Email / Google / Apple / SignOut / auth state |
| `lib/features/profile/domain/repositories/profile_repository.dart` | プロフィール抽象 | create / update / watch |
| `lib/features/auth/infrastructure/repositories/firebase_auth_repository.dart` | 認証実装 | FirebaseAuth を使った実装 |
| `lib/features/profile/infrastructure/repositories/firestore_profile_repository.dart` | プロフィール実装 | Firestore `users` を使った実装 |
| `lib/features/auth/application/sign_in_with_email_use_case.dart` | UseCase | Email ログイン |
| `lib/features/auth/application/sign_up_with_email_use_case.dart` | UseCase | Email 登録 |
| `lib/features/auth/application/sign_in_with_google_use_case.dart` | UseCase | Google ログイン |
| `lib/features/auth/application/sign_in_with_apple_use_case.dart` | UseCase | Apple ログイン |
| `lib/features/auth/application/sign_out_use_case.dart` | UseCase | ログアウト |
| `lib/features/auth/application/watch_auth_state_use_case.dart` | UseCase | 認証状態監視 |
| `lib/features/profile/application/create_profile_use_case.dart` | UseCase | プロフィール作成 |
| `lib/features/profile/application/update_profile_use_case.dart` | UseCase | プロフィール更新 |
| `lib/features/profile/application/watch_profile_use_case.dart` | UseCase | プロフィール監視 |
| `lib/features/auth/application/auth_controller.dart` | Controller | 認証状態と操作管理 |
| `lib/features/profile/application/profile_controller.dart` | Controller | プロフィール状態と操作管理 |
| `lib/features/auth/presentation/screens/splash_screen.dart` | 画面 | 起動時判定 |
| `lib/features/auth/presentation/screens/onboarding_screen.dart` | 画面 | 初回説明 |
| `lib/features/auth/presentation/screens/sign_in_screen.dart` | 画面 | ログイン |
| `lib/features/auth/presentation/screens/sign_up_screen.dart` | 画面 | 登録 |
| `lib/features/profile/presentation/screens/profile_setup_screen.dart` | 画面 | プロフィール作成 |
| `lib/features/auth/presentation/widgets/auth_error_view.dart` | UI部品 | 認証エラー表示 |
| `lib/features/auth/presentation/widgets/social_sign_in_buttons.dart` | UI部品 | Google / Apple ボタン |
| `lib/features/profile/presentation/widgets/profile_form.dart` | UI部品 | 表示名入力フォーム |
| `lib/core/routing/app_router.dart` | ルーティング | auth/profile guard を追加 |
| `lib/core/routing/route_names.dart` | ルート名 | 追加ルート名定義 |
| `lib/core/routing/route_paths.dart` | ルートパス | 追加ルートパス定義 |
| `lib/core/di/providers.dart` | DI | repository / controller の Provider 追加 |
| `lib/core/di/firebase_providers.dart` | DI | FirebaseAuth / Firestore 参照追加 |
| `lib/core/validators/email_validator.dart` | バリデーション | email 形式チェック |
| `lib/core/validators/password_validator.dart` | バリデーション | password 強度チェック |
| `lib/core/errors/auth_error_mapper.dart` | エラー変換 | FirebaseException を日本語に変換 |
| `lib/core/widgets/loading_button.dart` | UI部品 | ローディング付きボタン |
| `test/features/auth/...` | テスト | AuthRepository / AuthController / route guard / widget test |
| `test/features/profile/...` | テスト | ProfileRepository / ProfileController test |

必要なら以下も追加してよいです。

- `lib/features/auth/infrastructure/models/`
- `lib/features/profile/infrastructure/models/`
- `lib/features/auth/presentation/controllers/`
- `lib/features/profile/presentation/controllers/`

ただし、責務は崩さないでください。

---

## 5. データモデル

### 5.1 `users` ドキュメントの初期フィールド
Firestore の `users/{userId}` に保存する初期フィールドは、最低でも以下を含めてください。

| フィールド | 型 | 必須 | 説明 |
|---|---|---:|---|
| `userId` | string | Yes | Firebase Auth UID と同一 |
| `displayName` | string | Yes | 表示名 |
| `email` | string | No | メールアドレス |
| `photoUrl` | string | No | アイコンURL |
| `authProviders` | array<string> | Yes | `password`, `google.com`, `apple.com` など |
| `locale` | string | Yes | 例: `ja-JP` |
| `timezone` | string | Yes | 例: `Asia/Tokyo` |
| `status` | string | Yes | `active`, `deleted`, `disabled` |
| `createdAt` | timestamp | Yes | 作成日時 |
| `updatedAt` | timestamp | Yes | 更新日時 |

### 5.2 推奨追加フィールド
必要なら以下も追加して構いません。

- `lastLoginAt`
- `deletedAt`
- `termsAcceptedAt`
- `privacyAcceptedAt`
- `analyticsOptIn`

ただし Phase 2 では、複雑化しすぎないことを優先してください。

### 5.3 データ設計の原則
- `users/{userId}` は本人のプロフィールとして扱う
- 外部公開プロフィールは作らない
- 共有ノート内での表示は将来 membership snapshot を使う想定だが、Phase 2 ではそこまで実装しない
- `users` は自分のみ read/write を基本とする
- Firestore の直読み書きは Repository に閉じる

---

## 6. 画面要件

### 6.1 SplashScreen
- 起動時に認証状態を判定する
- ログイン済みかどうかで遷移を分ける
- 画面上では簡潔なローディング表示でよい
- いきなりホームへ飛ばさず、profile の有無も判定する

### 6.2 OnboardingScreen
- 初回利用向けの簡単な説明
- 写真から思い出ノートが作れることを伝える
- 位置情報・AI・共有について簡単な説明を入れる
- 「はじめる」ボタンから SignIn へ遷移

### 6.3 SignInScreen
- Email / Password ログイン
- Google Sign-In
- Apple Sign-In
- SignUp への遷移
- パスワード忘れの stub があってもよい
- エラーは日本語で表示

### 6.4 SignUpScreen
- Email / Password 登録
- 表示名の初期入力を受けてもよい
- 登録後は ProfileSetup へ遷移
- Email / Password のバリデーションを入れる

### 6.5 ProfileSetupScreen
- 表示名の作成・編集
- 必須入力は表示名
- 送信後 `users/{userId}` を作成または更新
- 完了後は NoteListScreen へ遷移

### 6.6 NoteListScreen への遷移
- Phase 2 では NoteList の中身は未完成でもよい
- ただし遷移先としては存在させる
- 既存の placeholder がある場合はそれを利用してよい

### 6.7 Settings から SignOut
- 設定画面にログアウト導線を置く
- ログアウト後は SignIn または Onboarding に戻す
- 既存 Settings がない場合は最小の placeholder を追加してよい

---

## 7. 認証フロー

以下のフローを正しく実装してください。

### 7.1 起動時の判定
1. SplashScreen で認証状態を監視する
2. 未ログインなら Onboarding または SignIn へ
3. ログイン済みなら `users/{userId}` を確認する
4. プロフィール未作成なら ProfileSetup へ
5. プロフィール作成済みなら NoteListScreen へ

### 7.2 ログイン
- Email / Password でログイン
- Google / Apple ログインも同じ流れに接続する
- ログイン成功後はプロフィール確認を行う

### 7.3 新規登録
- Email / Password で登録
- 登録直後は profile 未作成扱いでよい
- ProfileSetup へ誘導する

### 7.4 ログアウト
- FirebaseAuth sign out
- ローカル状態をクリア
- SignIn もしくは Onboarding に戻る

### 7.5 アカウント削除 stub
- 実削除は Phase 14 以降でもよい
- ただし導線だけは stub で用意する
- 「アカウント削除は後続Phaseで実装予定」と分かるようにする

---

## 8. Firebase Authentication 要件

### 8.1 対応プロバイダ
- Email / Password
- Google Sign-In
- Apple Sign-In

### 8.2 匿名ログイン
- **使わない**
- 絶対に主要導線へ入れない

### 8.3 エラー表示
以下を日本語で分かりやすく出してください。

- invalid email
- weak password
- wrong password
- user not found
- email already in use
- network error
- cancelled sign-in
- too many requests
- popup / credential error
- Apple / Google 設定不足

### 8.4 実装方針
- FirebaseAuth の例外をそのまま表示しない
- エラーは `auth_error_mapper.dart` で日本語化する
- Google / Apple は環境依存のため、必要なら `TODO` を残す
- iOS / Android どちらでもビルドが壊れないようにする

---

## 9. Firestore users 要件

### 9.1 作成
- 初回ログイン時または ProfileSetup 完了時に `users/{userId}` を作成する
- `displayName` は必須
- `authProviders` は FirebaseAuth の provider 情報から保存する
- `createdAt` / `updatedAt` は server timestamp を利用する

### 9.2 更新
- 表示名編集を可能にする
- `updatedAt` は毎回更新する
- `status` は `active` を初期値とする

### 9.3 参照
- 現在ログイン中のユーザーのプロフィールを監視する
- `currentProfileProvider` を通じて画面に流す

### 9.4 削除
- 実削除は stub でもよい
- 少なくとも `status = deleted` にする設計を残す
- 他人の doc は読まない

---

## 10. Riverpod 設計

以下の Provider を実装してください。

- `authRepositoryProvider`
- `profileRepositoryProvider`
- `authStateProvider`
- `authControllerProvider`
- `profileControllerProvider`
- `currentUserProvider`
- `currentProfileProvider`

### 10.1 役割
- `authRepositoryProvider`
  - FirebaseAuth 実装を注入する
- `profileRepositoryProvider`
  - Firestore 実装を注入する
- `authStateProvider`
  - 認証状態ストリームを流す
- `currentUserProvider`
  - 現在の認証ユーザー情報を保持する
- `currentProfileProvider`
  - Firestore のプロフィールを監視する
- `authControllerProvider`
  - ログイン・ログアウト操作をまとめる
- `profileControllerProvider`
  - プロフィール作成・更新をまとめる

### 10.2 設計注意
- UI は Controller のみを見る
- UI から Firebase SDK を直接触らない
- UseCase を挟み、操作の意図を明確にする
- State は `AsyncValue` または独自 state で整理してよい

---

## 11. go_router guard

以下の guard を実装してください。

### 11.1 未認証 guard
- 未ログイン状態で NoteList などへ行けない
- 未認証なら Onboarding / SignIn に戻す

### 11.2 profile 未作成 guard
- ログイン済みでも `users/{userId}` が無い、または `displayName` が空なら ProfileSetup に誘導する

### 11.3 既ログイン時の遷移
- SignIn / SignUp に居るときに既ログインなら NoteList に戻す
- 無限リダイレクトしないようにする

### 11.4 invite link
- Phase 2 では stub でよい
- guard の設計にだけ余地を残す

---

## 12. エラー処理

以下のケースを処理してください。

- invalid email
- weak password
- wrong password
- account exists
- user not found
- network error
- cancelled sign-in
- Firestore profile create failed
- profile watch failed
- sign out failed

### 12.1 実装方針
- `AppException` / `Failure` に変換する
- UI では日本語メッセージに統一する
- 表示だけでなく、必要ならログも残す
- Crashlytics は Phase 1 の基盤を使ってよい

---

## 13. テスト

以下のテストを追加してください。

### 13.1 unit test
- email validator test
- password validator test
- AuthController test
- ProfileController test

### 13.2 repository test
- fake AuthRepository
- fake ProfileRepository

### 13.3 routing test
- 未認証時に guard が働くこと
- profile 未作成時に ProfileSetup に飛ぶこと
- profile 作成済みで NoteList に飛ぶこと

### 13.4 widget test
- SignInScreen の基本描画
- エラー表示
- ボタン押下で controller が呼ばれること

### 13.5 テスト方針
- Firebase 実接続に依存しすぎない
- fake を使って疎通を切り分ける
- まずは基本のロジックと遷移を保証する

---

## 14. 完了条件

以下を満たしたら Phase 2 完了です。

- `flutter analyze` が通る
- `flutter test` が通る
- Email 登録 / ログイン / ログアウトが動く
- Google / Apple ログインは実装済み、または環境依存部分に TODO がある
- `users` にプロフィールが作成される
- profile 未作成時に `ProfileSetupScreen` に遷移する
- profile 作成後に `NoteListScreen` に遷移する
- UI から Firebase を直接呼んでいない
- OpenAI API キーを Flutter 側に置いていない

---

## 15. 実装上の注意

### 15.1 Google / Apple 実装
- 環境依存でビルドやログインがすぐ通らない場合がある
- その場合は、コードを壊さず、TODO とセットアップ手順を残す
- Android の Google Sign-In は SHA 設定が必要になることがある
- iOS の Apple Sign-In は Capabilities や Apple Developer 設定が必要になることがある

### 15.2 進めすぎ禁止
以下は **このPhaseではやらない** でください。

- Memory Note の作成フロー実装
- 写真アップロード
- EXIF 読み取り
- 地図表示
- AI生成
- 共同編集
- 招待機能
- SNS共有カード
- search / calendar / tags の本実装
- notifications
- analytics のイベント詳細設計
- 本番デプロイ
- ストア提出
- プライバシーポリシー実装
- 利用規約実装
- 課金機能

### 15.3 コード品質
- 命名は英語
- 表示文言は日本語でよい
- 変更は最小限
- 既存構成を壊さない
- 後続Phaseで拡張しやすいようにする
- Firebase の秘密情報を直書きしない

---

## 16. 期待する実装イメージ

Phase 2 の実装後、アプリは以下の状態になっているべきです。

1. 起動すると Splash で認証状態を確認する
2. 未ログインなら Onboarding / SignIn に案内される
3. Email / Google / Apple でログインできる
4. ログイン後、プロフィールの有無を判定する
5. プロフィール未作成なら ProfileSetup に進む
6. プロフィール作成後、NoteListScreen に進む
7. 設定からログアウトできる
8. 認証・プロフィールの責務が分離されている
9. 画面から Firebase 直呼び出しがない
10. テストで主要ロジックが守られている

---

## 17. このPhaseではやらないこと

以下は Phase 2 の対象外です。実装しないでください。

- 写真選択
- 写真アップロード
- EXIF / GPS 読み取り
- ノート作成・編集・削除
- 地図表示
- 位置情報推定
- AIタイトル生成
- AI日記生成
- 共有ノート・共同編集
- 招待リンク
- 権限の詳細実装
- SNS共有カード
- 検索 / カレンダー / On This Day
- 通知
- 解析ダッシュボード
- 決済
- 原本画像保存
- OpenAI API 連携
- 本番公開準備

---

必要であれば次に、この Phase 2 プロンプトをさらに **「実装エージェントが迷わないように、ファイル単位の具体的な実装指示」** まで落とし込めます。