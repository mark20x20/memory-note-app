以下に、**Flutter実装エージェントへそのまま渡せる Phase 0: Project Setup の実装プロンプト**を、日本語・実装指示形式でまとめます。

---

# Phase 0: Project Setup 実装プロンプト

あなたは **Flutter実装エージェント** です。  
これから **Memory Note App / 思い出ノートアプリ** の **Phase 0: Project Setup** を実装してください。

---

## 1. プロジェクト概要

### アプリ名
**Memory Note App / 思い出ノートアプリ**

### アプリの中心コンセプト
写真を入れるだけで、旅行・お出かけ・日常の思い出を、**地図付きノートとして自動整理できるスマートフォンアプリ**です。

### 対象プラットフォーム
- iOS
- Android

### 初期プロダクトの方向性
- 旅行特化ではなく、**「旅行も含む思い出ノートアプリ」**
- 初期MVPでは以下を中心に扱う
  - 旅行
  - お出かけ
  - グルメ

### Release v1 の中核思想
- 写真を起点に思い出ノートを自動生成する
- 共有ノート / 共同編集 / SNS共有カードを将来含める
- ただし Phase 0 ではまだビジネスロジックは入れず、**土台だけを整える**

---

## 2. このPhaseで守る方針

### 技術方針
- Flutter + Firebase + Riverpod + go_router を前提にする
- feature-first 構成を採用する
- `presentation / application / domain / infrastructure` を基本レイヤーにする
- UI から Firebase を直接呼ばない
- Phase 0 では Firebase の本実装はまだ最小限でよい
- まだ本番接続や認証フローは完成させなくてよいが、後続Phaseで差し替えやすい構成にする

### 品質方針
- `flutter analyze` が通ること
- `flutter test` が通ること
- 破壊的変更を避けること
- 既存ファイルがある場合は、必要最小限の変更に留めること

### コーディング方針
- コードコメント、変数名、関数名、クラス名は **英語**
- 画面ラベル、説明文、表示テキストは **日本語でよい**
- APIキーや秘密情報は直書きしない
- Firebase の秘密情報はコミットしない

---

## 3. Phase 0 の実装範囲

以下だけを実装してください。  
**このPhaseでは、アプリの土台を作ることが目的です。**

### 実装対象
- Flutterプロジェクト初期化
- 依存関係追加
- `analysis_options.yaml` 設定
- `lib/` 配下の構成作成
- `main.dart`
- `app.dart`
- bootstrap
- theme
- routing
- placeholder screens
- shared widgets
- `Result / Failure / AppException`
- logging stub
- `test/` フォルダ作成
- 最低限の起動確認

### まだやらないこと
- Firebase 本番接続
- 認証実装
- Firestore実装
- Storage実装
- Cloud Functions 実装
- EXIF読み取り
- 写真アップロード
- AI生成
- 共有カード生成
- 実データモデル実装
- 権限ロジック実装
- 本格的な画面UI実装

---

## 4. 実装要件

### 4.1 Flutterプロジェクト初期化
新規プロジェクトを作成、または既存プロジェクトに対して Phase 0 用の初期設定を行ってください。

### 4.2 依存関係追加
`pubspec.yaml` に以下を追加してください。

#### 必須依存
- `flutter_riverpod`
- `go_router`
- `firebase_core`
- `firebase_auth`
- `cloud_firestore`
- `firebase_storage`
- `cloud_functions`
- `firebase_analytics`
- `firebase_crashlytics`
- `google_sign_in`
- `sign_in_with_apple`
- `image_picker`
- `flutter_image_compress`
- `cached_network_image`
- `share_plus`
- `intl`
- `uuid`

### 4.3 ディレクトリ構成
feature-first 構成で以下を準備してください。

#### 期待する大枠
```text
lib/
  main.dart
  app.dart

  bootstrap/
  core/
  shared/
  features/
```

#### feature-first の基本構造
各 feature は最低限以下を持てるようにしてください。

```text
features/<feature_name>/
  presentation/
  application/
  domain/
  infrastructure/
```

#### 対象 feature
Phase 0 では以下のフォルダだけ先に作成してください。
- `auth`
- `profile`
- `memory_notes`
- `photo_upload`
- `metadata_extraction`
- `map`
- `ai_generation`
- `collaboration`
- `permissions`
- `share_card`
- `search_calendar`
- `settings`

---

## 5. 作成・変更すべきファイル一覧

以下のような形式で、実装対象を整理してください。

| パス | 目的 | 実装内容 |
|---|---|---|
| `pubspec.yaml` | 依存関係管理 | 必須パッケージ追加 |
| `analysis_options.yaml` | 静的解析設定 | lint ルール設定 |
| `lib/main.dart` | エントリポイント | `ProviderScope` で起動 |
| `lib/app.dart` | アプリ本体 | `MaterialApp.router` 構成 |
| `lib/bootstrap/bootstrap.dart` | 初期化処理 | 起動時の初期化関数 |
| `lib/bootstrap/env.dart` | 環境定義 | dev/stg/prod の切替土台 |
| `lib/core/routing/app_router.dart` | ルーティング | go_router 定義 |
| `lib/core/routing/route_names.dart` | ルート名定義 | ルート名を定数化 |
| `lib/core/routing/route_paths.dart` | ルートパス定義 | パスを定数化 |
| `lib/core/theme/app_theme.dart` | テーマ | Material 3 ベーステーマ |
| `lib/core/theme/color_tokens.dart` | 色定義 | 基本色トークン |
| `lib/core/theme/text_styles.dart` | 文字スタイル | 基本テキストスタイル |
| `lib/core/theme/spacing.dart` | 余白定義 | spacing トークン |
| `lib/core/errors/app_exception.dart` | 例外定義 | アプリ用例外クラス |
| `lib/core/errors/failure.dart` | 失敗表現 | Failure モデル |
| `lib/core/result/result.dart` | 結果型 | Result 型 |
| `lib/core/logging/app_logger.dart` | ログ | logger stub |
| `lib/core/logging/crashlytics_logger.dart` | ログ | Crashlytics stub |
| `lib/core/widgets/app_scaffold.dart` | 共通UI | Scaffold wrapper |
| `lib/core/widgets/app_loading.dart` | 共通UI | ローディング表示 |
| `lib/core/widgets/app_error_view.dart` | 共通UI | エラー表示 |
| `lib/core/widgets/empty_state_view.dart` | 共通UI | 空状態表示 |
| `lib/core/widgets/confirm_dialog.dart` | 共通UI | 確認ダイアログ |
| `lib/features/...` | 機能フォルダ | placeholder screens 配置 |
| `test/` | テスト | 初期テスト配置 |

必要に応じて、これ以外の補助ファイルも作成して構いません。  
ただし、Phase 0 の範囲を超えないこと。

---

## 6. PowerShell コマンド例

Windows + PowerShell を主に想定して、以下のようなコマンドを使ってください。

### 6.1 Flutterプロジェクト作成
```powershell
flutter create memory_note_app
cd memory_note_app
```

### 6.2 依存追加
```powershell
flutter pub add flutter_riverpod
flutter pub add go_router
flutter pub add firebase_core
flutter pub add firebase_auth
flutter pub add cloud_firestore
flutter pub add firebase_storage
flutter pub add cloud_functions
flutter pub add firebase_analytics
flutter pub add firebase_crashlytics
flutter pub add google_sign_in
flutter pub add sign_in_with_apple
flutter pub add image_picker
flutter pub add flutter_image_compress
flutter pub add cached_network_image
flutter pub add share_plus
flutter pub add intl
flutter pub add uuid
```

### 6.3 フォルダ作成
```powershell
New-Item -ItemType Directory -Force lib\bootstrap
New-Item -ItemType Directory -Force lib\core\errors
New-Item -ItemType Directory -Force lib\core\result
New-Item -ItemType Directory -Force lib\core\logging
New-Item -ItemType Directory -Force lib\core\routing
New-Item -ItemType Directory -Force lib\core\theme
New-Item -ItemType Directory -Force lib\core\widgets
New-Item -ItemType Directory -Force lib\shared
New-Item -ItemType Directory -Force lib\features\auth\presentation
New-Item -ItemType Directory -Force lib\features\auth\application
New-Item -ItemType Directory -Force lib\features\auth\domain
New-Item -ItemType Directory -Force lib\features\auth\infrastructure
New-Item -ItemType Directory -Force lib\features\profile\presentation
New-Item -ItemType Directory -Force lib\features\profile\application
New-Item -ItemType Directory -Force lib\features\profile\domain
New-Item -ItemType Directory -Force lib\features\profile\infrastructure
New-Item -ItemType Directory -Force lib\features\memory_notes\presentation
New-Item -ItemType Directory -Force lib\features\memory_notes\application
New-Item -ItemType Directory -Force lib\features\memory_notes\domain
New-Item -ItemType Directory -Force lib\features\memory_notes\infrastructure
New-Item -ItemType Directory -Force lib\features\photo_upload\presentation
New-Item -ItemType Directory -Force lib\features\photo_upload\application
New-Item -ItemType Directory -Force lib\features\photo_upload\domain
New-Item -ItemType Directory -Force lib\features\photo_upload\infrastructure
New-Item -ItemType Directory -Force lib\features\metadata_extraction\application
New-Item -ItemType Directory -Force lib\features\metadata_extraction\infrastructure
New-Item -ItemType Directory -Force lib\features\map\presentation
New-Item -ItemType Directory -Force lib\features\map\application
New-Item -ItemType Directory -Force lib\features\map\domain
New-Item -ItemType Directory -Force lib\features\map\infrastructure
New-Item -ItemType Directory -Force lib\features\ai_generation\presentation
New-Item -ItemType Directory -Force lib\features\ai_generation\application
New-Item -ItemType Directory -Force lib\features\ai_generation\domain
New-Item -ItemType Directory -Force lib\features\ai_generation\infrastructure
New-Item -ItemType Directory -Force lib\features\collaboration\presentation
New-Item -ItemType Directory -Force lib\features\collaboration\application
New-Item -ItemType Directory -Force lib\features\collaboration\domain
New-Item -ItemType Directory -Force lib\features\collaboration\infrastructure
New-Item -ItemType Directory -Force lib\features\permissions\presentation
New-Item -ItemType Directory -Force lib\features\permissions\application
New-Item -ItemType Directory -Force lib\features\permissions\domain
New-Item -ItemType Directory -Force lib\features\permissions\infrastructure
New-Item -ItemType Directory -Force lib\features\share_card\presentation
New-Item -ItemType Directory -Force lib\features\share_card\application
New-Item -ItemType Directory -Force lib\features\share_card\domain
New-Item -ItemType Directory -Force lib\features\share_card\infrastructure
New-Item -ItemType Directory -Force lib\features\search_calendar\presentation
New-Item -ItemType Directory -Force lib\features\search_calendar\application
New-Item -ItemType Directory -Force lib\features\search_calendar\domain
New-Item -ItemType Directory -Force lib\features\search_calendar\infrastructure
New-Item -ItemType Directory -Force lib\features\settings\presentation
New-Item -ItemType Directory -Force lib\features\settings\application
New-Item -ItemType Directory -Force lib\features\settings\domain
New-Item -ItemType Directory -Force lib\features\settings\infrastructure
New-Item -ItemType Directory -Force test
```

### 6.4 品質確認
```powershell
flutter analyze
flutter test
```

---

## 7. ルーティング初期設計

以下のルートを作成してください。

- `/`
- `/onboarding`
- `/login`
- `/signup`
- `/profile-setup`
- `/home`
- `/settings`

### ルーティング方針
- `go_router` を使用する
- 起動時は `/` で Splash 的な振る舞いを行う
- 認証状態はまだ仮でよい
- Phase 0 では、`/` から `/login` または `/home` に仮遷移できるようにする
- `go_router` の設定は後続Phaseで拡張可能にする

---

## 8. 初期画面

以下の画面を **placeholder** として作成してください。

- `SplashScreen`
- `OnboardingScreen`
- `SignInScreen`
- `SignUpScreen`
- `ProfileSetupScreen`
- `NoteListScreen`
- `NoteCreateStartScreen`
- `SettingsScreen`

### 画面の要件
- 見た目は簡素でよい
- ただし画面遷移が成立すること
- 日本語ラベルを使ってよい
- 共通 Scaffold を使うこと
- 後で実装を差し替えやすい構造にすること

---

## 9. 共通UI

最低限、以下の共通UIを作成してください。

- `AppScaffold`
- `AppLoading`
- `AppErrorView`
- `EmptyStateView`
- `ConfirmDialog`

### 要件
- Material 3 に沿った簡素な見た目
- 後続Phaseで再利用できること
- Viewの中に直接 Firebase 依存を入れないこと

---

## 10. エラー・結果型

以下を作成してください。

### `AppException`
- アプリ内で扱う例外の基底クラス
- message / code / cause 等を持てる設計にする

### `Failure`
- ユースケースやRepositoryの失敗を表現する
- 表示用メッセージを持てるようにする

### `Result`
- 成功/失敗を扱える共通の結果型
- 後続Phaseでユースケースに使えるようにする

---

## 11. ログ設計

### 実装要件
- `app_logger.dart` は stub でよい
- `crashlytics_logger.dart` も stub でよい
- 将来 `FirebaseCrashlytics` に差し替えられる構造にすること

### 注意
- 機微情報をログに直接残さない前提にする
- Phase 0 ではログの本実運用は不要

---

## 12. bootstrap / app / main

### `main.dart`
- `WidgetsFlutterBinding.ensureInitialized()` を呼ぶ
- `bootstrap()` を経由して起動する
- `ProviderScope` で全体を包む

### `bootstrap.dart`
- 初期化の入口として作る
- Phase 0 では最小限でよい
- 後で Firebase 初期化を差し込める構造にする

### `app.dart`
- `MaterialApp.router` を使う
- theme を適用する
- router を注入する
- debug 用の設定をここに集約しすぎない

---

## 13. テーマ要件

`app_theme.dart` で Material 3 ベースのテーマを作成してください。

### 最低限の内容
- カラートークン
- テキストスタイル
- 余白トークン
- ボタンやカードの最低限の見た目

### 方針
- 日本向けの落ち着いたトーン
- 写真や地図を中心にしたアプリに合う、過剰に派手すぎない見た目
- 後でデザイントークンを拡張しやすくする

---

## 14. テスト

`test/` フォルダを作成し、最低限以下を準備してください。

- 1つ以上の smoke test
- `app.dart` または `main.dart` の起動確認テスト
- placeholder 画面の表示確認テスト

### テストの方針
- Phase 0 ではロジックテストを深くやらなくてよい
- ただし `flutter test` が通る状態にする
- 後続Phaseで拡張できるテスト構成にする

---

## 15. 完了条件

以下すべてを満たしてください。

- Flutter プロジェクトが作成されている
- 必須パッケージが追加されている
- 主要フォルダが存在する
- `ProviderScope` が設定されている
- `go_router` が動作する
- 起動時に Splash から Home または Login へ仮遷移できる
- Material 3 テーマが適用されている
- `flutter analyze` が通る
- `flutter test` が通る

---

## 16. 実装時の注意

- APIキーを直書きしない
- Firebase秘密情報をコミットしない
- まだ本番Firebase接続を強制しない
- UIは仮でよいが、構成を壊さない
- 既存ファイルがある場合は破壊的変更を避ける
- 後続Phaseで Firebase, Auth, Firestore, Storage, Functions を安全に接続できる土台にする

---

## 17. このPhaseではやらないこと

以下は **Phase 0 では実装しない** でください。

- Firebase の本番初期設定
- 認証画面の実処理
- Firestore CRUD
- Storage アップロード
- Cloud Functions 実装
- EXIF 読み取り
- 写真圧縮処理
- AI生成処理
- 共有カード生成
- 権限モデル実装
- 招待フロー
- ノート作成ロジック
- 地図表示の本実装
- 詳細なUIデザイン
- App Store / Google Play 提出準備

---

必要であれば次に、これをそのまま使える形で  
**「Phase 0 実装指示をさらに短くした版」** または  
**「Codex向けにより厳密な実行命令形式」** に整形できます。