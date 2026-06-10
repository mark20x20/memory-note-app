以下に、**Flutter/Firebase実装エージェントへそのまま渡せる Phase 1: Firebase Foundation の実装プロンプト**を、日本語・実装指示形式でまとめます。  
Phase 0 の成果物を前提に、**Firebase接続・初期設定・Rules雛形・Functions土台・Provider基盤**までを実装対象にしています。

---

# Phase 1: Firebase Foundation 実装プロンプト

あなたは **Flutter/Firebase実装エージェント** です。  
これから **Memory Note App / 思い出ノートアプリ** の **Phase 1: Firebase Foundation** を実装してください。

---

## 1. プロジェクトの前提

### アプリ名
**Memory Note App / 思い出ノートアプリ**

### アプリの中心コンセプト
写真を入れるだけで、旅行・お出かけ・日常の思い出を、**地図付きノートとして自動整理できるスマートフォンアプリ**です。

### 対象プラットフォーム
- iOS
- Android

### 重要な設計思想
- Flutter + Firebase を基本構成にする
- feature-first 構成
- `presentation / application / domain / infrastructure` を基本レイヤーにする
- UI から Firebase を直接呼ばない
- Cloud Functions 経由で AI や秘密情報を扱う
- **OpenAI APIキーをFlutterアプリに直接入れない**

### Phase 0 の前提
Phase 0 で以下はすでにある前提で進めてください。
- Flutter プロジェクト初期化済み
- `lib/` の基本構成作成済み
- `main.dart` / `app.dart` / bootstrap / theme / routing の雛形あり
- placeholder screen や共通UIの雛形あり
- `analysis_options.yaml` の最低限設定あり

---

## 2. このPhaseで実現したいこと

Phase 1 は、**Firebase を実際に接続し、今後の本実装に進めるための土台を作るフェーズ**です。

### このPhaseの目的
- Firebase プロジェクトと Flutter の接続基盤を整える
- dev / staging / production の方針を定める
- Firebase 初期化処理を実装する
- Emulator Suite でローカル検証できるようにする
- Firestore / Storage / Functions / Analytics / Crashlytics の土台を用意する
- Security Rules の雛形を作る
- Cloud Functions の最小構成を用意する
- FirebaseProvider を用意して後続Phaseで DI しやすくする

### このPhaseのゴール
後続の Phase 2 以降で、
- 認証
- Firestore
- Storage
- Cloud Functions
- Analytics
- Crashlytics  
を安全に実装できる状態にすること。

---

## 3. 守るべき方針

### 技術方針
- Firebase は **環境分離前提**で設計する
- dev / staging / production を最初から意識する
- ただし Phase 1 ではすべてを完成させる必要はない
- まずは **接続・切替・雛形・疎通確認** を優先する
- Emulator を使ってローカル検証可能にする
- 秘密情報は Flutter アプリに置かない
- Cloud Functions 側で OpenAI などの秘密情報を扱う前提を崩さない

### セキュリティ方針
- 本番キーや secret をコミットしない
- Firebase Admin SDK の秘密鍵をアプリ側へ入れない
- OpenAI APIキーを Flutter 側に入れない
- Firestore / Storage Rules は安全側に倒す
- クライアント直書きで権限を広げない
- AI / 削除 / 招待 / usage limits は後続Phaseでも慎重に扱う

### コーディング方針
- コードコメント、変数名、関数名、クラス名は **英語**
- 画面ラベルや表示文言は **日本語でよい**
- 既存ファイルがある場合は破壊的変更を避ける
- 変更は最小限かつ後続Phaseで拡張しやすくする

---

## 4. Phase 1 の実装範囲

以下を実装してください。

### 4.1 Firebase 接続基盤
- Firebase CLI / FlutterFire CLI を前提とした設定
- FlutterFire の設定ファイル運用方針
- `firebase_options_dev.dart` / `firebase_options_stg.dart` / `firebase_options_prod.dart` の方針
- `bootstrap` で Firebase 初期化
- 環境切替 `env` の整備
- Emulator 接続の切替土台

### 4.2 Firebase SDK の基盤
- Firebase Core
- Firebase Auth
- Cloud Firestore
- Firebase Storage
- Cloud Functions
- Firebase Analytics
- Firebase Crashlytics

### 4.3 DI / Provider
- `core/di/firebase_providers.dart` を実装
- Firebase インスタンスを Provider で公開
- 後続 feature から参照しやすい構成にする

### 4.4 Firebase Paths
- `firestore_paths.dart`
- `storage_paths.dart`
- コレクション名 / パス名を定数化

### 4.5 Firebase 設定ファイル
- `firebase.json`
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`
- `functions/` の初期化
- `functions/src/index.ts`

### 4.6 Cloud Functions 雛形
- TypeScript 構成
- callable の healthCheck
- auth 必須チェック helper
- error response helper
- OpenAI secret はまだ使わないが置き場所をコメントで明示
- Emulator で呼び出せる状態

### 4.7 Firebase 初期計測
- Analytics 初期化
- Crashlytics 初期化
- 例外時の記録基盤
- 開発時は過剰送信しない配慮

---

## 5. 実装対象ファイル一覧

以下のファイルを作成・変更してください。必要なら補助ファイルを追加して構いません。

| パス | 目的 | 実装内容 |
|---|---|---|
| `pubspec.yaml` | 依存関係管理 | Firebase / Riverpod / go_router 関連依存の確認と追加 |
| `analysis_options.yaml` | 静的解析設定 | 既存 lint を維持しつつ Firebase 実装向けに破綻しない設定 |
| `lib/bootstrap/env.dart` | 環境定義 | dev / staging / production 切替方針を定義 |
| `lib/bootstrap/bootstrap.dart` | 初期化処理 | Firebase 初期化、Crashlytics/Analytics 設定の入口 |
| `lib/main.dart` | エントリポイント | bootstrap 呼び出し、ProviderScope 起動 |
| `lib/app.dart` | アプリ本体 | Firebase初期化済み前提で `MaterialApp.router` を構成 |
| `lib/core/di/firebase_providers.dart` | DI | Firebase インスタンス群を Provider 化 |
| `lib/core/constants/firestore_paths.dart` | DBパス | コレクション / サブコレクション定数 |
| `lib/core/constants/storage_paths.dart` | Storageパス | 画像保存パスの定数 |
| `lib/core/logging/app_logger.dart` | ログ | 開発用ログの薄いラッパー |
| `lib/core/logging/crashlytics_logger.dart` | ログ | Crashlytics 連携の薄いラッパー |
| `lib/core/errors/app_exception.dart` | 例外 | アプリ共通例外の基盤 |
| `lib/core/errors/failure.dart` | 失敗表現 | Failure モデル |
| `lib/core/result/result.dart` | 結果型 | `Result<T>` の基盤 |
| `firebase.json` | Firebase設定 | emulator / hosting / functions の土台 |
| `firestore.rules` | Firestore保護 | 安全側の初期ルール |
| `firestore.indexes.json` | index管理 | 初期 index 方針 |
| `storage.rules` | Storage保護 | ノート参加者のみアクセスできる雛形 |
| `functions/package.json` | Functions設定 | TypeScript / lint / build |
| `functions/tsconfig.json` | TS設定 | Functions 用 TypeScript 設定 |
| `functions/src/index.ts` | Functions入口 | `healthCheck` callable 実装 |
| `functions/src/shared/auth.ts` | 共通処理 | auth 必須チェック helper |
| `functions/src/shared/errors.ts` | 共通処理 | error response helper |
| `functions/src/shared/logger.ts` | 共通処理 | 機微情報を残しにくいログ補助 |
| `test/` | テスト | 初期テスト追加 |

---

## 6. Firebase 環境設計

### 6.1 環境分離の方針
以下の3環境を前提にしてください。

| 環境 | 用途 | 備考 |
|---|---|---|
| dev | ローカル開発 | Emulator 連携必須 |
| staging | QA / 動作確認 | ストア提出前確認用 |
| production | 本番 | 人間承認が必要 |

### 6.2 実装上の考え方
- Phase 1 では dev を最優先で動かす
- staging / production は方針だけ先に整える
- `Env` によって Firebase options を切り替えられるようにする
- `--dart-define` か flavor を使う運用を想定する
- ただし Phase 1 では「方針が壊れないこと」を重視し、完全実装は後続Phaseでもよい

### 6.3 Firebase options 方針
FlutterFire の生成ファイルは以下の扱いを推奨します。

- `firebase_options_dev.dart`
- `firebase_options_stg.dart`
- `firebase_options_prod.dart`

必要なら 1 ファイル運用でもよいが、**環境分離が見える構成**にしてください。

---

## 7. Firebase 初期化要件

### 7.1 `bootstrap` でやること
- Flutter binding 初期化
- Firebase 初期化
- Analytics / Crashlytics 初期化
- 例外ハンドリング設定
- Emulator 接続切替
- app 起動前の最小セットアップ

### 7.2 Crashlytics / Analytics の考え方
- 本番では有効化を前提
- 開発環境では必要以上のノイズを出さない
- 例外は `FlutterError.onError` と zone で捕捉する
- 起動失敗時も、原因が追えるようにする

### 7.3 Emulator 接続
- Firestore emulator
- Functions emulator
- Storage emulator  
をローカルで切り替え可能にする土台を作ること

---

## 8. Firestore / Storage Rules 初期雛形

Phase 1 の rules は、**厳密な最終版ではなく安全な雛形**で構いません。  
ただし、後続Phaseで拡張しやすい形にしてください。

### 8.1 Firestore Rules
以下を必ず含めてください。

- 認証必須
- `users/{userId}` は自分のみ read/write
- `memory_notes` は membership-based access の前提を仮関数で用意
- `ai_results` はクライアント書き込み禁止
- `usage_limits` はクライアント書き込み禁止
- `audit_logs` はクライアント書き込み禁止
- `invitations` は安全側の雛形のみ
- `app_settings` は読み取り最小化
- まだ未実装の詳細は「拒否」を基本にする

### 8.2 Storage Rules
以下を必ず含めてください。

- 認証必須
- `users/{userId}/profile/...` は本人のみ
- `memory_notes/{noteId}/compressed/...`
- `memory_notes/{noteId}/thumbnails/...`
- `memory_notes/{noteId}/share_cards/...`
- 上記は将来 membership-based access で制御する前提の雛形
- それ以外は原則拒否
- 公開バケットのような実装はしない

### 8.3 Rules の考え方
- Phase 1 では「まだ厳密な権限が完成していないから開ける」ではなく、**必要なもの以外は閉じる** を優先すること
- 安全側に倒す
- 後続Phaseで具体化する前提のコメントを残してよい

---

## 9. Cloud Functions 初期雛形

### 9.1 Functions の要件
- TypeScript
- callable function を 1 つ以上実装
- `healthCheck` を実装
- auth 必須チェック helper を共通化
- error response helper を共通化
- emulator で疎通可能にする
- OpenAI API はまだ呼ばない
- 秘密情報の置き場所はコメントで明示する

### 9.2 最低限の関数
- `healthCheck`
  - 認証済みなら success を返す
  - 認証なしなら拒否
  - emulator から呼べること
- 可能なら `echoRequest` のような補助関数は不要。最小限に留める

### 9.3 Functions の注意
- モバイルアプリから直接 OpenAI API にアクセスしない
- APIキーは Functions の環境変数または Secret Manager 前提
- ログに個人情報・写真情報・招待トークンを残さない

---

## 10. Provider / DI 実装要件

`lib/core/di/firebase_providers.dart` では、以下を Provider 化してください。

- `FirebaseApp`
- `FirebaseAuth`
- `FirebaseFirestore`
- `FirebaseStorage`
- `FirebaseFunctions`
- `FirebaseAnalytics`
- `FirebaseCrashlytics`

### 実装方針
- `ProviderScope` 配下で利用可能にする
- `useFirestoreEmulator` などの切替はここか bootstrap で行う
- feature 層から直接 `FirebaseFirestore.instance` を呼び続けない
- 後続の Repository 実装へつなぎやすくする

---

## 11. コマンド前提

Windows + PowerShell を主に想定して、以下のセットアップが可能な前提で進めてください。  
必要なら README や docs に補足を書いてください。

### 11.1 CLI
```powershell
npm install -g firebase-tools
dart pub global activate flutterfire_cli
firebase login
```

### 11.2 Firebase 初期化
```powershell
firebase init
```

以下を含める想定です。
- Firestore
- Functions
- Storage
- Emulator
- 必要なら Hosting は任意

### 11.3 FlutterFire 設定
```powershell
flutterfire configure
```

### 11.4 依存取得
```powershell
flutter pub get
```

### 11.5 Emulator 起動
```powershell
firebase emulators:start
```

### 11.6 Flutter 起動
```powershell
flutter run
```

---

## 12. 完了条件

以下を満たしたら Phase 1 完了としてください。

### 必須完了条件
- `flutter analyze` が通る
- `flutter test` が通る
- Flutter アプリ起動時に `Firebase.initializeApp` が成功する
- Firebase Provider が使える
- Firestore / Storage / Functions の接続土台がある
- Emulator 起動時の接続切替の方針がある
- `healthCheck` callable function が呼べる
- `firestore.rules` が存在する
- `storage.rules` が存在する
- `OpenAI APIキー` が Flutter 側に存在しない
- dev/stg/prod の切替方針が壊れていない

### 推奨完了条件
- Analytics / Crashlytics 初期化ができる
- Firebase 初期化失敗時のログが追える
- Functions の TypeScript ビルドが通る
- Firestore / Storage / Functions の emulator 疎通が確認できる

---

## 13. 実装時の注意

必ず以下を守ってください。

- 本番キーや secret をコミットしない
- Firebase Admin SDK の秘密鍵を Flutter に置かない
- `firebase_options` の環境管理に注意する
- dev / staging / production の方針を崩さない
- Rules は最初は安全側に倒す
- AI生成や写真アップロード本体は Phase 1 では実装しすぎない
- 変数名、関数名、クラス名は英語
- UI文言や画面ラベルは日本語でよい
- 既存の Phase 0 成果物を壊さない

---

## 14. このPhaseではやらないこと

以下は **Phase 1 では実装しない** でください。

- 認証フロー本体の完成
- Firestore の本格的な CRUD 実装
- Storage への写真アップロード実装
- EXIF 読み取り実装
- AI 生成実装
- 共有カード生成実装
- 招待・権限ロジックの本実装
- ノート一覧や詳細画面の本格 UI
- 位置情報推定や地図表示の実装
- 本番デプロイ
- App Store / Google Play 提出

---

必要であれば次に、**Phase 2: Auth / Profile の実装プロンプト** も同じ形式で作成できます。