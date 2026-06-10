# Firebase Setup Guide v2

> **[旧Flutter仕様 / Deprecated]**  
> このファイルは旧Flutter前提（Flutter + Firebase + Riverpod + go_router）で作成されました。  
> **現行の React Native + Expo 前提の Firebase 接続設定は以下を参照してください。**  
> → [`07_firebase_client_integration_for_expo.md`](./07_firebase_client_integration_for_expo.md)  
>
> 本ファイルの内容は旧仕様の参考資料として残してありますが、**実装時には参照しないでください。**

---

## 1. 目的

この手順は、**Memory Note App / 思い出ノートアプリ** の **Release v1** を、  
**Flutter + Firebase + Riverpod + go_router** 前提で、実際に開発・検証・公開準備できる状態まで持っていくためのセットアップガイドです。

このガイドで達成すること:

- iOS / Android の Flutter アプリを Firebase に接続する
- Authentication / Firestore / Storage / Cloud Functions / Analytics / Crashlytics を使えるようにする
- Emulator Suite でローカル検証できるようにする
- OpenAI API を **Cloud Functions 経由のみ** で使う前提を作る
- Release v1 の共有ノート・共同編集・SNS共有カードを見据えた基盤を作る

---

## 2. 前提

以下を前提にします。

- Flutter プロジェクトは作成済み、またはこれから作成する
- 開発環境は **Windows + PowerShell** を主に想定する
- 対象は **iOS / Android**
- Firebase は以下を使う
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Storage
  - Cloud Functions
  - Firebase Analytics
  - Firebase Crashlytics
  - Emulator Suite
- AI生成は **Cloud Functions 経由**
- **OpenAI APIキーをモバイルアプリに直接入れない**
- 画像は **圧縮画像 + サムネイル中心**
- 原本画像は **原則保存しない**
- 位置情報は **外部公開時にぼかす**
- 共有ノートの権限は **Owner / Editor / Viewer**

### Firebase無料枠・コスト注意
- Firebase は無料枠で始められますが、**写真アップロード、ストレージ容量、Functions 呼び出し、外部地図API** はコストが増えやすいです。
- MVPでは以下を優先してください。
  - 無料枠
  - OS標準API
  - 低コスト構成
  - キャッシュ
  - 圧縮
- 料金の最終判断は**人間承認**を前提にしてください。

---

## 3. Firebaseプロジェクト構成

Release v1 では、以下の2案があります。

### 3.1 1プロジェクトで flavor 分離する案
1つの Firebase プロジェクトを使い、Flutter 側の flavor で `dev / staging / production` を切り替える方式です。

#### メリット
- Firebase プロジェクトが少なくて管理しやすい
- 初期構築がやや簡単
- 小規模開発では楽

#### デメリット
- 本番・検証・開発のデータ分離が弱くなりやすい
- 誤って本番データを壊すリスクがある
- Rules / Storage / Functions の設定差分管理が難しくなる

---

### 3.2 複数Firebaseプロジェクトに分ける案
`dev / staging / production` ごとに Firebase プロジェクトを分ける方式です。

#### メリット
- 環境分離が明確
- 本番事故を防ぎやすい
- Rules、Storage、Functions の検証がしやすい
- 将来の運用が安定しやすい

#### デメリット
- 管理するものが増える
- 初期セットアップが少し重い
- FlutterFire の設定を環境ごとに持つ必要がある

---

### 3.3 推奨案
**Release v1 では「複数 Firebase プロジェクトに分ける案」を推奨**します。

おすすめ構成:

| 環境 | 用途 | 推奨 |
|---|---|---|
| dev | ローカル開発・検証 | 必須 |
| staging | QA / ストア提出前確認 | 推奨 |
| production | 本番公開 | 必須 |

### 推奨理由
- 思い出・写真・位置情報を扱うため、**誤操作の影響が大きい**
- 共有ノート・権限・削除があるので、環境分離が重要
- Release v1 は「本番アプリ」として扱うため、初期から分けた方が安全

---

## 4. Flutterプロジェクト初期化手順

既存プロジェクトがない場合の例です。

### 4.1 Flutterプロジェクト作成

```powershell
flutter --version
flutter create memory_note_app
cd memory_note_app
```

### 4.2 パッケージ追加の前提
Release v1 では最低限以下を使う想定です。

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

### 4.3 開発用フォルダ確認
Flutter File Structure v2 に合わせて、`lib/` 配下を feature-first に分けます。

最低限の確認:

- `lib/core`
- `lib/features/auth`
- `lib/features/memory_notes`
- `lib/features/photo_upload`
- `lib/features/ai_generation`
- `lib/features/collaboration`
- `lib/features/share_card`

---

## 5. Firebase CLI / FlutterFire CLI セットアップ

### 5.1 Firebase CLI インストール

Firebase CLI は Node.js 経由で入れます。

#### Node.js の確認
```powershell
node -v
npm -v
```

#### Firebase CLI インストール
```powershell
npm install -g firebase-tools
firebase --version
```

#### Firebase ログイン
```powershell
firebase login
```

必要ならブラウザが開きます。

---

### 5.2 FlutterFire CLI インストール

```powershell
dart pub global activate flutterfire_cli
flutterfire --version
```

必要に応じて PATH を通します。

#### PATH 確認例
```powershell
$env:Path
```

`Pub\Cache\bin` が入っていない場合は追加してください。

---

### 5.3 Firebase プロジェクト作成

Firebase Console で以下のプロジェクトを作成します。

- `memory-note-app-dev`
- `memory-note-app-stg`
- `memory-note-app-prod`

---

### 5.4 FlutterFire 設定生成

各環境ごとに実施します。

#### dev
```powershell
flutterfire configure
```

#### 実行時のポイント
- 対象 Firebase プロジェクトを選ぶ
- iOS / Android 両方を選ぶ
- `lib/firebase_options.dart` を生成する
- 環境ごとに分ける場合は、**生成ファイルを上書きしない運用**に注意する

### 実務上のおすすめ
- `firebase_options_dev.dart`
- `firebase_options_stg.dart`
- `firebase_options_prod.dart`

のように分けるか、flavorごとに生成・管理してください。

---

## 6. Firebase Authentication設定

Release v1 では以下を使います。

- Email/Password
- Google Sign-In
- Apple Sign-In
- 匿名ログインは使わない

### 6.1 Authentication 有効化
Firebase Console:
1. Authentication を開く
2. 「Sign-in method」を選ぶ
3. 以下を有効化
   - Email/Password
   - Google
   - Apple

---

### 6.2 Email/Password
最初に有効化してください。

#### 用途
- 新規登録
- ログイン
- アカウント復元の基礎

#### 注意
- パスワードルールはアプリ側でも最低限チェックする
- 失敗時の文言は日本語で分かりやすくする

---

### 6.3 Google Sign-In
Android だけでなく iOS でも提供可能です。

#### Firebase Console 側
- Google プロバイダを有効化

#### Android 側
- SHA-1 / SHA-256 登録が必要になることがあります
- 後述の Android 設定も確認してください

---

### 6.4 Apple Sign-In
iOS ユーザー向けに必須です。

#### 注意
- iOS で Apple ログインを出す
- 審査上の要件に注意する
- Apple Developer 側の設定が必要

---

### 6.5 匿名ログインは使わない
本サービスは共有ノート・共同編集・機種変更・クラウド保存が前提のため、匿名ログインは採用しません。

---

## 7. Firestore設定

### 7.1 database作成
Firebase Console で Firestore を有効化します。

#### 手順
1. Firestore Database を開く
2. 作成
3. モードは本番運用に合わせて慎重に選ぶ
4. 初期リージョンを決める

---

### 7.2 region方針
Release v1 は日本ユーザー優先です。

#### 推奨
- Firestore / Functions のリージョンは、**日本に近いリージョン**を優先
- 具体値は Firebase の提供状況に合わせて選定
- 最終選定は人間承認を前提

---

### 7.3 初期collection
最低限、以下のコレクションを想定します。

- `users`
- `memory_notes`
- `memory_notes/{noteId}/members`
- `memory_notes/{noteId}/photos`
- `memory_notes/{noteId}/place_groups`
- `memory_notes/{noteId}/ai_results`
- `memory_notes/{noteId}/share_cards`
- `invitations`
- `user_note_index`
- `notifications`
- `usage_limits`
- `audit_logs`
- `app_settings`

---

### 7.4 indexes
Release v1 では以下の検索が発生しやすいです。

- user ごとのノート一覧
- 日付順並び替え
- お気に入り
- タグ検索
- 共有メンバーごとの参照
- ステータス別フィルタ

#### 対応方針
- 最初はエラーを見て必要な composite index を追加
- 無駄なインデックスを作りすぎない
- ノート一覧用の冗長フィールドを持つ

---

### 7.5 emulator
Firestore は Emulator で初期から検証できるようにします。

#### 起動例
```powershell
firebase emulators:start --only firestore
```

---

## 8. Firebase Storage設定

### 8.1 bucket
Storage バケットは Firebase プロジェクトごとに作成されます。

Release v1 では画像を主に保存します。

---

### 8.2 paths
推奨パスは以下です。

```text
users/{userId}/profile/profile_{version}.jpg

memory_notes/{noteId}/compressed/{photoId}.jpg
memory_notes/{noteId}/thumbnails/{photoId}.jpg
memory_notes/{noteId}/share_cards/{shareCardId}/{format}.jpg
memory_notes/{noteId}/previews/{previewId}.jpg
memory_notes/{noteId}/temp_uploads/{uploadId}.jpg
memory_notes/{noteId}/originals/{photoId}.jpg
```

---

### 8.3 compressed
- ノート詳細の表示用
- 高画質すぎないが見やすい画像
- Release v1 の主保存対象

---

### 8.4 thumbnails
- 一覧表示用
- 軽量
- スクロール性能向上に重要

---

### 8.5 share_cards
- SNS共有カード画像
- 外部共有用
- 位置情報はぼかす
- ノート画像本体とは分離

---

### 8.6 temp_uploads
- アップロード途中の一時保存
- 成功後に削除
- 失敗後も残しすぎない

---

### 8.7 optional originals
原本画像は **原則保存しない** 方針です。  
保存する場合は、別同意や別料金設計の候補になります。

---

### 8.8 profile images
- `users/{userId}/profile/`
- ノート画像と権限を分ける
- メンバー表示で使う

---

## 9. Cloud Functions設定

### 9.1 functions directory
通常はプロジェクト直下に `functions/` を置きます。

```text
memory_note_app/
  functions/
```

---

### 9.2 TypeScript推奨
Release v1 では **TypeScript 推奨**です。

理由:
- 型安全
- Firebase Functions の保守がしやすい
- OpenAI 呼び出しや Firestore 連携の事故を減らしやすい

---

### 9.3 Node.js version
Firebase Functions の対応版に合わせます。  
現時点では Node.js 18 または 20 系が候補になることが多いですが、**最終値は Firebase の対応状況で確認**してください。

---

### 9.4 OpenAI API key secret
**絶対に Flutter アプリへ入れないでください。**

#### 正しい置き場所
- Cloud Functions の環境変数
- もしくは Secret Manager 相当の安全な仕組み

#### 悪い例
- `lib/` 配下の Dart ファイルに直書き
- `dart define` で本番キーを入れる
- Git 管理する `.env` に本キーを置く

---

### 9.5 callable functions
Release v1 では以下の callable 関数を想定できます。

- `generateTitle`
- `generateDiary`
- `generateSummary`
- `createInvitation`
- `acceptInvitation`
- `rebuildShareCard`
- `deleteMemoryNote`

---

### 9.6 emulator
Cloud Functions も Emulator で動かします。

```powershell
firebase emulators:start --only functions
```

Firestore と合わせるなら:

```powershell
firebase emulators:start --only firestore,functions
```

---

## 10. Analytics / Crashlytics設定

### 10.1 Analytics
Firebase Analytics を有効化し、最低限のイベントを見ます。

例:
- アプリ起動
- ログイン成功
- 写真選択完了
- アップロード完了
- AI生成開始
- AI生成成功
- ノート保存完了
- 共有カード生成
- 共有シート起動

---

### 10.2 Crashlytics
Crashlytics は以下を監視します。

- 写真アップロード失敗
- EXIF 読み取り失敗
- Firestore 書き込み失敗
- Storage 保存失敗
- Functions 失敗
- 共有シート失敗

---

### 10.3 Flutter 側の初期化
`main.dart` で Firebase 初期化と Crashlytics/Analytics 初期化を行います。

---

## 11. iOS設定

### 11.1 Bundle ID
iOS の Bundle ID を決めます。

例:
- `com.example.memorynoteapp`

実運用では、dev / staging / prod で分けることも検討します。

---

### 11.2 GoogleService-Info.plist
FlutterFire configure 後、iOS 用の `GoogleService-Info.plist` を取得し、Xcode プロジェクトに組み込みます。

---

### 11.3 Apple Sign-In
Apple ログインを有効にします。

#### 注意
- Apple Developer 側設定が必要
- Capability の追加が必要になることがある
- Sign in with Apple を iOS で有効化する

---

### 11.4 Photos permission
写真を選ぶための権限説明が必要です。

#### 想定用途
- ユーザーが選択した写真のみをアップロード
- 端末内全写真を勝手に送信しない

#### 注意
- 「選択した写真だけアクセスする」意図を明確にする
- App Store 審査で説明しやすい文言にする

---

### 11.5 location metadata注意
このアプリは写真の EXIF から位置情報を読みますが、**外部共有では位置情報をぼかす**方針です。

#### 重要
- 位置情報を勝手に公開しない
- 精密座標を共有カードに出さない
- 設定画面で説明する

---

### 11.6 Info.plist文言
最低限、以下の説明を検討してください。

- 写真アクセスの理由
- 位置情報を扱う理由
- 共有時に画像を保存する理由
- Apple Sign-In の利用理由

---

## 12. Android設定

### 12.1 Application ID
Android の Application ID を決めます。

例:
- `com.example.memorynoteapp`

---

### 12.2 google-services.json
FlutterFire configure で生成・配置します。

通常は `android/app/google-services.json` に配置します。

---

### 12.3 SHA-1 / SHA-256
Google Sign-In を使う場合は、SHA-1 / SHA-256 の登録が必要になることがあります。

#### 取得例
```powershell
cd android
./gradlew signingReport
```

PowerShell から実行する場合は、環境により以下も検討します。

```powershell
cd android
gradlew signingReport
```

#### 取得した値を Firebase Console に登録
- Android アプリ設定
- SHA フィンガープリント登録

---

### 12.4 permissions
必要最小限にします。

主に考えるもの:
- 画像選択関連
- ネットワーク
- 共有
- 必要に応じた位置情報関連

ただし、**常時GPSトラッキングはしない**方針です。

---

### 12.5 AndroidManifest
AndroidManifest では、不要な権限を増やしすぎないよう注意します。

---

## 13. 環境変数 / Secrets

### 13.1 OpenAI API key
**モバイルアプリに入れない**ことが最重要です。

#### 正しい管理場所
- Cloud Functions の Secret
- サーバー側環境変数

---

### 13.2 map / geocoding key
地図・ジオコーディングが必要なら、用途別にキーを分けることを検討します。

- 地図表示用
- ジオコーディング用
- 共有カード生成用

#### 注意
- 利用制限をかける
- 不要な公開を避ける
- コスト上限を確認する

---

### 13.3 Firebase config
Flutter 側には `firebase_options.dart` を使います。  
秘密情報は入れません。

---

### 13.4 mobile appに秘密情報を入れない
再掲ですが、以下はアプリへ直埋めしないでください。

- OpenAI API key
- Firebase Admin SDK secret
- 本番用サーバー秘密鍵
- 招待トークン生成の秘密
- 管理者用キー

---

## 14. Emulator Suite起動手順

### 14.1 初期化
Firebase 初回設定がまだなら:

```powershell
firebase init
```

選択候補:
- Firestore
- Functions
- Storage
- Emulators
- Hosting は必要なら後回し

---

### 14.2 Emulator 起動
```powershell
firebase emulators:start
```

特定のみ起動する場合:

```powershell
firebase emulators:start --only auth,firestore,storage,functions
```

---

### 14.3 Flutter 側のエミュレータ接続
Flutter からローカルエミュレータを参照するよう、開発用コードで切り替えます。

#### 例
- Auth Emulator
- Firestore Emulator
- Storage Emulator
- Functions Emulator

---

## 15. 初期疎通確認

セットアップ後、最低限以下を確認します。

### 15.1 auth
- Email/Password 登録できる
- ログインできる
- ログアウトできる
- Google Sign-In が動く
- Apple Sign-In が動く

### 15.2 firestore
- `users` に書き込める
- `memory_notes` を作成できる
- membership 判定ができる
- Rules で拒否できる

### 15.3 storage
- 圧縮画像をアップロードできる
- サムネイルを保存できる
- 共有カード画像を保存できる
- 削除で派生物が消せる

### 15.4 functions
- callable function が呼べる
- OpenAI 呼び出しの前段が動く
- エラー時のフォールバックが返る

### 15.5 analytics
- 起動イベントが記録される
- 主要イベントが送れる

### 15.6 crashlytics
- テストクラッシュを検知できる
- 例外を送れる

---

## 16. セキュリティ初期チェック

Release v1 の重要ポイントです。

### 必須チェック
- [ ] OpenAI APIキーを Flutter アプリに入れていない
- [ ] Firestore Rules で membership 判定している
- [ ] Storage Rules でノート参加者以外を拒否している
- [ ] ノート削除は Owner のみ
- [ ] Viewer は閲覧のみ
- [ ] 共有カードで精密座標を出していない
- [ ] 原本画像を原則保存していない
- [ ] 招待トークンに期限がある
- [ ] Emulator で Rules を確認している
- [ ] 本番プロジェクトと開発プロジェクトを分けている

---

## 17. よくあるエラーと対処

### 17.1 Firebase初期化失敗
原因候補:
- `firebase_options.dart` が古い
- `flutterfire configure` が未実行
- `main.dart` で `Firebase.initializeApp()` していない

対処:
```powershell
flutter clean
flutter pub get
flutter run
```

---

### 17.2 Google Sign-In が失敗する
原因候補:
- SHA-1 未登録
- Google provider 未有効
- Android 設定不備

対処:
- Firebase Console を確認
- `signingReport` で SHA を取得
- 再ビルド

---

### 17.3 Apple Sign-In が失敗する
原因候補:
- Apple Developer 側設定不足
- Capability 未追加
- iOS 設定不足

対処:
- Xcode 設定確認
- Apple Developer の設定確認

---

### 17.4 Storage アップロード失敗
原因候補:
- Rules が厳しすぎる
- パス設計ミス
- 認証状態不一致

対処:
- Emulator で Rules を確認
- パスと認可条件を見直す

---

### 17.5 Functions で OpenAI 呼び出し失敗
原因候補:
- Secret 未設定
- 認可エラー
- タイムアウト
- 入力整形不足

対処:
- Functions ログ確認
- Secret 設定確認
- フォールバックを返す

---

## 18. 次に作成すべき設定ファイル

セットアップ後、次に用意するとよいファイルです。

### Firebase関連
- `firebase.json`
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`
- `functions/package.json`
- `functions/tsconfig.json`
- `functions/src/index.ts`

### Flutter関連
- `lib/bootstrap/env.dart`
- `lib/bootstrap/bootstrap.dart`
- `lib/core/constants/firestore_paths.dart`
- `lib/core/constants/storage_paths.dart`
- `lib/core/di/providers.dart`
- `lib/core/routing/app_router.dart`
- `lib/features/auth/...`
- `lib/features/memory_notes/...`

### 環境分離関連
- `firebase_options_dev.dart`
- `firebase_options_stg.dart`
- `firebase_options_prod.dart`

---

## 19. 実装上の決定事項ログ

### 決定したこと
- Flutter + Firebase を基本構成にする
- Firebase は dev / staging / production に分けるのが推奨
- Authentication は Email / Google / Apple を使う
- 匿名ログインは使わない
- Firestore / Storage / Functions / Analytics / Crashlytics を使う
- AI は Cloud Functions 経由のみ
- OpenAI APIキーをモバイルアプリへ直埋めしない
- 画像は圧縮画像 + サムネイル中心
- 原本画像は原則保存しない
- 共有カードは外部公開用として分離する

### 未決定のこと
- Firebase / Functions の最終リージョン
- 地図SDKの最終選定
- 原本画像の将来的な有料プラン採用可否
- 共有カードの最終レイアウト細部
- プライバシーポリシー文面の最終版

### 足りない証拠
- 実際の Firebase 使用量見込み
- 写真1件あたりの平均容量
- 共有カードの生成頻度
- Functions の実行回数見積もり
- ストア審査での文言最適解

### リスク
- 画像保存コストが想定以上になる可能性
- 位置情報の扱いがプライバシー事故につながる可能性
- Rules 設計が甘いと共有ノートで漏えいが起きる可能性
- OpenAI の呼び出しをクライアントに置くと重大事故になる可能性

---

必要であれば次に、以下のどれかを続けて作成できます。

1. **`firebase.json` / `firestore.rules` / `storage.rules` の初期テンプレート**
2. **FlutterFire の flavor 別設定手順**
3. **Cloud Functions の初期 `index.ts` テンプレート**
4. **Firestore / Storage の具体的なセキュリティルール設計**