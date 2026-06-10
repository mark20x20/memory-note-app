# Phase 1 Firebase Foundation Expo Prompt v2

## 1. このプロンプトの目的

このPhase 1では、**Memory Note App / 思い出ノートアプリ** の本番バックエンドとして既存Firebaseを維持しながら、  
**React Native + Expo + TypeScript + Expo Router** でモバイルフロントエンドの基盤を作る。

目的は、今後の機能実装に先立って以下を成立させること。

- Firebase Authentication / Firestore / Storage / Functions を React Native から利用できる
- Expo ベースのアプリ初期構成が整っている
- `firebaseConfig`、`app.config.ts`、`.env` の運用方針が入っている
- OpenAI APIキーをモバイルアプリに入れない
- Emulator を使ったローカル検証の土台がある
- 以降の画面、認証、ノート作成、共有機能へ拡張しやすい
- 管理画面は将来の Streamlit + Firebase Admin SDK 方針に接続できる

このPhaseは、**アプリの見た目を完成させることではなく、Firebase接続と実装基盤を固めること**が目的。

---

## 2. 前提

### 採用スタック
- Mobile frontend: **React Native + Expo + TypeScript**
- Routing: **Expo Router**
- Backend: **既存 Firebase**
- Auth: **Firebase Authentication**
- DB: **Cloud Firestore**
- Storage: **Firebase Storage**
- Server: **Cloud Functions**
- Security: **Firestore Security Rules / Storage Rules**
- AI: **OpenAI API via Cloud Functions**
- Admin: **Streamlit + Firebase Admin SDK**
- Build: **EAS Build**

### 維持する方針
- Supabaseには移行しない
- Firebaseの既存構成を維持する
- OpenAI APIキーをモバイルアプリに直接入れない
- Firebase Admin SDK は管理画面・サーバ側でのみ利用する
- 画像保存は Firebase Storage を使う
- 権限は既存の Owner / Editor / Viewer 方針を維持する

### 開発環境前提
- Windows + PowerShell を主対象
- Expo 開発
- Firebase プロジェクトは既存のものを利用
- `.env` に秘密情報を置く場合は **Expoでクライアント公開してよい値のみ** を入れる
- Firebase のクライアント設定値は公開情報として扱う
- OpenAI APIキー、Admin SDK秘密鍵、サービスアカウントJSONはモバイルに置かない

### Phase 1で扱う対象
- アプリ起動
- Firebase初期化
- 認証状態監視
- Firestore読み書きの土台
- Storageアップロードの土台
- Functions呼び出しの土台
- 環境変数管理
- Emulator接続の土台
- 最低限のルート構成

---

## 3. Phase 1の実装範囲

### 3.1 実装すること

#### 1) Expo + TypeScript + Expo Router の初期構成
- Expo プロジェクトを TypeScript 前提で作成
- Expo Router を導入
- `app/` ベースのルーティング構成を作る
- 起動時に Firebase 初期化を通す

#### 2) Firebase Web SDK の導入
React Native + Expo では **Firebase Web SDK** を使う。

導入対象:
- `firebase/app`
- `firebase/auth`
- `firebase/firestore`
- `firebase/storage`
- `firebase/functions`

#### 3) Firebase 初期化レイヤー作成
- `src/lib/firebase.ts` などに Firebase 初期化を集約
- `firebaseConfig` を環境変数から組み立てる
- Auth / Firestore / Storage / Functions のインスタンスを export
- Emulator への切り替えを可能にする

#### 4) 環境変数運用
- `.env.example` を作成
- `.env.development` / `.env.production` の方針を決める
- `app.config.ts` で Expo の `extra` に渡す
- モバイルに入れてよいのは Firebase の公開設定値のみ
- OpenAI APIキーは入れない

#### 5) 最低限の認証基盤
- Firebase Authentication の初期化
- Auth state の監視
- サインイン前 / サインイン後の分岐
- 画面遷移のベースを作成

#### 6) Firestore / Storage / Functions 接続確認
- Firestore の読み書き用ヘルパー
- Storage アップロード用ヘルパー
- Functions callable 呼び出し用ヘルパー
- 本実装はまだ薄くてよいが、呼び出し口は作る

#### 7) Emulator 基盤
- Firebase Emulator Suite を使う前提の設定
- ローカル開発で Auth / Firestore / Storage / Functions を切り替えられるようにする
- 開発時に emulator 接続ログを出せるようにする

#### 8) 最低限のUI
- Splash / Loading
- Auth gate
- Placeholder Home
- Placeholder Sign-in
- Firebase 接続状態表示（devのみでも可）

---

### 3.2 このPhaseでの実装対象イメージ

```text
App bootstrap
 ├─ load env
 ├─ initialize Firebase
 ├─ connect emulator if dev
 ├─ listen auth state
 ├─ route to auth or home
 └─ provide Firebase instances to app
```

---

### 3.3 実装ファイルの責務

| ファイル/領域 | 責務 |
|---|---|
| `app/` | Expo Router の画面ルート |
| `src/lib/firebase.ts` | Firebase 初期化 |
| `src/lib/firebase/env.ts` | 環境変数の読み込み |
| `src/lib/firebase/emulator.ts` | Emulator 接続処理 |
| `src/features/auth/` | 認証UI・状態管理 |
| `src/features/home/` | 仮ホーム画面 |
| `src/components/` | 共通UI |
| `src/hooks/` | Auth state 監視など |
| `app.config.ts` | Expo config と env 受け渡し |
| `.env.example` | 必須環境変数の見本 |

---

## 4. 作成・変更ファイル一覧

> 既存プロジェクトを前提に、必要な追加・変更ファイルを整理する。  
> 実際のリポジトリ構成に合わせてファイル名は微調整してよいが、責務は維持すること。

### 4.1 ルート設定
| ファイル | 内容 |
|---|---|
| `package.json` | Expo / Firebase / Router 依存追加 |
| `app.json` または `app.config.ts` | Expo設定、extraへenv注入 |
| `tsconfig.json` | TypeScript設定 |
| `metro.config.js` | 必要ならExpo向け調整 |
| `babel.config.js` | Expo Router対応確認 |
| `.gitignore` | `.env*` の除外設定 |
| `.env.example` | 環境変数の雛形 |

### 4.2 アプリルーティング
| ファイル | 内容 |
|---|---|
| `app/_layout.tsx` | Provider / 初期化 / Auth gate |
| `app/index.tsx` | 起動時の振り分け |
| `app/(auth)/sign-in.tsx` | ログイン画面プレースホルダ |
| `app/(app)/home.tsx` | ログイン後ホームのプレースホルダ |

### 4.3 Firebase初期化
| ファイル | 内容 |
|---|---|
| `src/lib/firebase/app.ts` | `initializeApp` と export |
| `src/lib/firebase/auth.ts` | Auth インスタンス |
| `src/lib/firebase/firestore.ts` | Firestore インスタンス |
| `src/lib/firebase/storage.ts` | Storage インスタンス |
| `src/lib/firebase/functions.ts` | Functions インスタンス |
| `src/lib/firebase/config.ts` | `firebaseConfig` 組み立て |
| `src/lib/firebase/emulator.ts` | emulator接続 |
| `src/lib/firebase/index.ts` | 再export集約 |

### 4.4 認証・状態管理
| ファイル | 内容 |
|---|---|
| `src/features/auth/hooks/useAuthState.ts` | Auth state 監視 |
| `src/features/auth/components/AuthGate.tsx` | 画面分岐 |
| `src/features/auth/components/SignInCard.tsx` | 仮サインインUI |
| `src/features/auth/types.ts` | 型定義 |

### 4.5 共通
| ファイル | 内容 |
|---|---|
| `src/components/LoadingScreen.tsx` | ローディング表示 |
| `src/components/ErrorState.tsx` | エラー表示 |
| `src/components/DevInfoPanel.tsx` | dev用接続情報表示 |
| `src/constants/firebase.ts` | Firebase関連定数 |
| `src/types/env.ts` | env型 |

### 4.6 将来接続前提の予約領域
| ファイル/フォルダ | 内容 |
|---|---|
| `src/features/memory-notes/` | 将来のノート機能 |
| `src/features/photo-upload/` | 写真アップロード |
| `src/features/share-card/` | 共有カード |
| `src/features/settings/` | 設定 |
| `src/lib/functions/callables.ts` | callable wrapper |

---

## 5. PowerShellコマンド

### 5.1 Expoプロジェクト作成
```powershell
npx create-expo-app@latest memory-note-app --template
cd memory-note-app
```

TypeScript前提で、必要なら以下を確認する。

```powershell
npx expo --version
node -v
npm -v
```

---

### 5.2 依存関係の追加
```powershell
npx expo install expo-router react-native-safe-area-context react-native-screens
npx expo install @react-native-async-storage/async-storage
npm install firebase
npm install zustand
npm install zod
npm install dotenv
```

必要に応じてUI基盤を追加する場合:
```powershell
npx expo install expo-constants
npx expo install expo-linking
npx expo install expo-dev-client
```

---

### 5.3 Expo Router 有効化
`package.json` に `main` を設定する必要がある場合は確認する。

```json
{
  "main": "expo-router/entry"
}
```

---

### 5.4 Firebase CLI / Emulator
```powershell
npm install -g firebase-tools
firebase --version
firebase login
```

必要ならプロジェクト初期化:
```powershell
firebase init
```

選択候補:
- Firestore
- Functions
- Storage
- Emulators
- Rules
- Hosting は現時点では不要でも可

---

### 5.5 Firebase Emulator 起動
```powershell
firebase emulators:start
```

または一部のみ:
```powershell
firebase emulators:start --only auth,firestore,storage,functions
```

---

### 5.6 Expo起動
```powershell
npx expo start
```

開発ビルドが必要なら:
```powershell
eas build:configure
```

---

## 6. Firebase設定

### 6.1 Firebase Console 側で確認する項目
既存Firebaseを利用するため、以下を確認・整理する。

- Firebase Authentication が有効
- Firestore が作成済み
- Storage が作成済み
- Cloud Functions が利用可能
- Emulator の対象サービスを決定
- Webアプリが Firebase Console に登録済み
- Expo アプリ用の Firebase Web config が取得済み

---

### 6.2 使う Firebase Web SDK 設定値
Expoアプリ側で必要なのは **Web app config**。

`.env.example` には以下を置く。

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION=asia-northeast1
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=10.0.2.2
```

### 6.3 注意
- `EXPO_PUBLIC_` 付きの値はアプリに埋め込まれる前提
- **OpenAI APIキーは禁止**
- Firebaseの公開設定値は問題ない
- Admin SDK の秘密情報はモバイルに入れない

---

### 6.4 `app.config.ts` での受け渡し
`app.config.ts` で `process.env` を読み、`expo.extra` に渡す設計にする。  
Expo Router と相性がよく、環境ごとの切り替えがしやすい。

必要な値:
- Firebase API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID
- Measurement ID
- Functions Region
- Emulator利用フラグ

---

### 6.5 Firebase初期化の実装方針
`src/lib/firebase/config.ts` で config を組み立てる。

例:
- `projectId` は必須
- `storageBucket` は Storage 利用のため必須
- `functionsRegion` は日本リージョンをデフォルトにする
- dev 環境では emulator に切り替える

---

### 6.6 Firebase SDK 初期化の責務
- `initializeApp(firebaseConfig)`
- `getAuth(app)`
- `getFirestore(app)`
- `getStorage(app)`
- `getFunctions(app, region)`
- `connectAuthEmulator(...)`
- `connectFirestoreEmulator(...)`
- `connectStorageEmulator(...)`
- `connectFunctionsEmulator(...)`

---

### 6.7 Firestore / Storage / Functions の初期設定
このPhaseでは本格的なルール設計はまだ不要だが、最低限以下を確認する。

- Firestore への接続確認
- Storage への接続確認
- Functions callable の接続確認
- 認証済みユーザーでのみ将来の読み書きができる構造を見据える
- ルート画面から Firebase インスタンスへアクセス可能

---

## 7. Emulator設定

### 7.1 利用目的
Emulator は以下の確認に使う。

- 認証状態遷移
- Firestore 読み書き
- Storage アップロード経路
- Functions 呼び出し経路
- ルールのローカル検証
- 将来のノート作成フローの足場作り

---

### 7.2 接続切替方針
`.env` または `app.config.ts` で切り替える。

```env
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=10.0.2.2
```

#### 補足
- Android Emulator は `10.0.2.2` を使うことが多い
- iOS Simulator / 実機ではホストIPを変更する必要がある
- 共通化のため、`EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` を環境変数化する

---

### 7.3 Emulatorで接続するサービス
- Auth Emulator
- Firestore Emulator
- Storage Emulator
- Functions Emulator

必要であれば、将来の段階で:
- Analytics は Emulator非対象でもよい
- Crashlytics はローカルでは実質検証不要

---

### 7.4 ローカル確認項目
- アプリ起動時に Firebase 初期化エラーが出ない
- Auth state が正しく監視できる
- Firestore の `getDoc` / `setDoc` が動く
- Storage への参照が作れる
- callable function が発火できる
- emulator 接続時に本番へ誤接続しない

---

## 8. 完了条件

Phase 1 の完了条件は以下。

### 8.1 プロジェクト基盤
- Expo + TypeScript + Expo Router でアプリが起動する
- `app.config.ts` が存在し、環境変数を扱える
- `firebaseConfig` が環境変数から組み立てられる
- `.env.example` が用意されている

### 8.2 Firebase接続
- Firebase Authentication が初期化される
- Firestore が初期化される
- Storage が初期化される
- Functions が初期化される
- 必要なら Emulator に切り替えられる

### 8.3 認証基盤
- Auth state を監視できる
- ログイン前後でルート分岐できる
- プレースホルダ画面で動作確認できる

### 8.4 開発基盤
- Firebase CLI を使って Emulator を起動できる
- Expo から Emulator 接続を確認できる
- OpenAI APIキーがモバイル側に存在しない
- 将来の Auth / Note / Upload / Share Card 実装に接続できる構成になっている

---

## 9. このPhaseではやらないこと

以下は Phase 1 では実装しない。

### プロダクト機能
- 本格的なノート作成UI
- 写真の本格アップロードフロー
- EXIF解析の実装詳細
- AIタイトル生成
- AI日記生成
- 共有ノート作成
- 招待機能
- 権限変更
- SNS共有カード生成

### バックエンド詳細
- Cloud Functions の本格API実装
- Firestore Security Rules の完成版
- Storage Rules の完成版
- 監査ログの本実装
- usage limits の本格実装

### 運用系
- Streamlit 管理画面の本体実装
- 課金
- 通知
- 本番向け分析ダッシュボード
- 位置情報の詳細なぼかしロジック

### AI関連
- OpenAI APIキーをアプリに入れること
- クライアント直叩きのAI実行
- ローカルでの生成結果保存の本実装

---

## Codex向け実装指示まとめ

以下の前提を守って、Phase 1 を実装すること。

1. **React Native + Expo + TypeScript + Expo Router** で構築する  
2. **既存Firebase** をそのまま使う  
3. `firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`, `firebase/functions` を導入する  
4. `app.config.ts` で env を受け渡す  
5. `.env.example` を作成する  
6. `firebaseConfig` を env から組み立てる  
7. Auth / Firestore / Storage / Functions を初期化する  
8. Emulator 切り替えを入れる  
9. OpenAI APIキーは絶対にモバイルアプリに入れない  
10. 将来のノート機能・共有機能へ拡張可能な構造にする  

必要であれば次に、これをそのまま使える **Codex用の実装プロンプト形式** に整形して出力できます。