# Phase 0 Expo Project Setup Prompt v2

## 1. このプロンプトの目的

この Phase 0 では、**Memory Note App / 思い出ノートアプリ** の本番フロントエンドを **React Native + Expo + TypeScript + Expo Router** で立ち上げるための、最小のプロジェクト基盤を作成します。

目的は以下です。

- Expo プロジェクトを新規作成する
- TypeScript 前提の構成を確定する
- Expo Router を導入し、ルーティングの骨組みを作る
- 画面遷移の土台を作る
- Firebase 接続はまだ実装せず、Phase 1 で行うための準備だけ整える
- Figma Make / Figma Design / generated_ui は**参考入力**として扱えるようにする
- Codex がそのまま実装に着手できる状態にする

この Phase 0 は「アプリを動かし始めるための土台」であり、機能実装ではありません。

---

## 2. 実装エージェントへの前提説明

あなたはこのアプリの実装エージェントです。  
以下の前提を厳守してください。

### 技術スタック固定
- Mobile frontend: **React Native + Expo + TypeScript**
- Routing: **Expo Router**
- Backend: **既存の Firebase**
- Auth: **Firebase Authentication**
- DB: **Cloud Firestore**
- Storage: **Firebase Storage**
- Server: **Cloud Functions**
- Security: **Firestore Security Rules / Storage Rules**
- AI: **OpenAI API via Cloud Functions**
- Admin: **Streamlit + Firebase Admin SDK**
- Build: **EAS Build**

### 重要な制約
- **Flutter は使わない**
- **Supabase は使わない**
- **OpenAI APIキーをモバイルアプリに入れない**
- Firebase 接続本体は **Phase 1** で実装する
- 既存 Firebase バックエンドは維持する
- `generated_ui/figma_make` は**あくまで参考**として扱う
- 本 Phase では認証・Firestore・Storage・Functions の実接続はしない

### 実装方針
- 実装は **Expo Router のファイルベースルーティング** を基本にする
- TypeScript を標準とする
- 将来の Firebase 接続を見越して、`src/` 配下に責務を分ける
- UI は最小限でよいが、後続フェーズの差し替えを容易にする
- 初期状態で lint / typecheck / start が通ることを優先する

---

## 3. Phase 0の実装範囲

Phase 0 で実装する範囲は以下です。

### 3.1 プロジェクト初期化
- Expo プロジェクト新規作成
- TypeScript 有効化
- Expo Router 有効化
- 必要なベース設定ファイル作成
- `package.json` の依存関係整理

### 3.2 ディレクトリ構成の初期化
- 画面ルート
- 共通コンポーネント置き場
- 型定義置き場
- 定数・テーマ置き場
- Firebase 接続前提の `src/` 構造を用意

### 3.3 ルーティング骨組み
- 初期ルート
- オンボーディング用ルート
- ログイン用ルート
- ホーム用ルート
- 404 / Not Found ルート
- 将来のタブ構成を見据えた土台

### 3.4 初期画面
最低限、以下の画面を作成する。

- Splash / 起動判定
- Onboarding
- Login
- Home
- Not Found

### 3.5 開発体験の準備
- 起動コマンド
- 型チェック
- 必要なら lint の土台
- 開発用設定の確認

---

## 4. 作成・変更ファイル一覧

以下は Phase 0 で作成・変更対象にする推奨ファイルです。

### 4.1 ルート直下
```text
package.json
app.json
tsconfig.json
babel.config.js
metro.config.js
eslint.config.js        (または .eslintrc.js)
prettier.config.js      (必要なら)
```

### 4.2 Expo Router
```text
app/_layout.tsx
app/index.tsx
app/(auth)/_layout.tsx
app/(auth)/onboarding.tsx
app/(auth)/login.tsx
app/(app)/_layout.tsx
app/(app)/home.tsx
app/+not-found.tsx
```

### 4.3 ソースコード
```text
src/
  components/
    ui/
      AppText.tsx
      AppButton.tsx
      Screen.tsx
  constants/
    app.ts
    routes.ts
  theme/
    colors.ts
    spacing.ts
    typography.ts
  types/
    navigation.ts
  utils/
    noop.ts
    env.ts
  features/
    auth/
    presentation/
    application/
    domain/
    infrastructure/
    ...
```

### 4.4 画像・参考データ
```text
generated_ui/
  figma_make/
    README.md
```

> 注意: `generated_ui/figma_make` は参照用であり、Phase 0 の実装ロジックの依存先にはしないこと。

---

## 5. PowerShellコマンド

以下は Windows + PowerShell を前提とした初期セットアップ例です。

### 5.1 Expo プロジェクト作成
```powershell
npx create-expo-app@latest memory-note-app --template
cd memory-note-app
```

TypeScript テンプレートを選べる場合は **TypeScript 前提** を選択してください。

### 5.2 Expo Router 導入
```powershell
npx expo install expo-router
```

### 5.3 主要依存関係の導入
Phase 0 で最低限入れておく候補です。

```powershell
npx expo install react-native-screens react-native-safe-area-context
npx expo install expo-constants expo-linking
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install zustand
npm install clsx
npm install tailwind-merge
npm install react-native-gesture-handler
```

必要に応じて以下も追加候補です。

```powershell
npm install react-hook-form zod
npm install @expo/vector-icons
npm install dayjs
```

### 5.4 開発起動
```powershell
npx expo start
```

### 5.5 型チェック
```powershell
npx tsc --noEmit
```

### 5.6 lint
```powershell
npm run lint
```

---

## 6. 依存関係候補

Phase 0 では「今すぐ必要なもの」と「後で入れるもの」を分ける。

### 6.1 必須候補
| パッケージ | 用途 | 理由 |
|---|---|---|
| `expo-router` | ルーティング | ファイルベースルーティングの中核 |
| `react-native-screens` | ナビゲーション最適化 | Expo Router / React Navigation の前提 |
| `react-native-safe-area-context` | Safe Area 対応 | iPhone 等で必要 |
| `expo-linking` | ディープリンク | 将来の招待リンクに備える |
| `expo-constants` | 環境・端末情報 | 将来の設定管理に利用 |
| `@react-navigation/native` | ナビゲーション基盤 | Expo Router の内部前提理解にも有用 |

### 6.2 推奨候補
| パッケージ | 用途 | 理由 |
|---|---|---|
| `zustand` | 軽量状態管理 | Phase 1以降の状態管理補助 |
| `zod` | 入力バリデーション | 将来のフォーム検証に有効 |
| `react-hook-form` | フォーム管理 | ログイン・編集画面で便利 |
| `dayjs` | 日付処理 | ノート表示で使いやすい |
| `@expo/vector-icons` | アイコン | 初期UI作成が楽 |

### 6.3 この Phase では不要
- Firebase SDK 一式
- OpenAI SDK
- 画像アップロード SDK
- 地図 SDK
- Analytics / Crashlytics 本体
- 管理画面関連

---

## 7. 初期ルート

Phase 0 のルートは以下を基準にする。

### 7.1 ルート構成
```text
/                   -> 起動判定
/onboarding         -> 初回説明
/login              -> ログイン
/home               -> ホーム
```

### 7.2 将来拡張を見据えたルートグループ
```text
app/
  _layout.tsx
  index.tsx
  +not-found.tsx

  (auth)/
    _layout.tsx
    onboarding.tsx
    login.tsx

  (app)/
    _layout.tsx
    home.tsx
```

### 7.3 ルーティング方針
- `app/index.tsx` は起動判定の分岐に使う
- 認証未完了なら `(auth)` に送る
- 認証済みなら `(app)` に送る
- Phase 0 では認証判定の実装は仮でよい
- 画面遷移は Expo Router の `redirect` または `router.push` を利用する

---

## 8. 初期画面

Phase 0 で最低限必要な画面は以下。

### 8.1 Splash / 起動判定
**目的**
- アプリ起動直後の初期画面
- 認証状態判定のプレースホルダ

**要件**
- ロゴまたはアプリ名を表示
- 「読み込み中」表示を置く
- 後続フェーズで認証判定を差し込める

---

### 8.2 Onboarding
**目的**
- アプリの価値を簡単に伝える
- 「写真を選ぶだけで思い出ノートを作る」ことを明示する

**要件**
- 3枚程度の簡単な説明カードでよい
- 共有ノート、地図付きノート、SNS共有カードを簡潔に表現
- 「ログインへ進む」導線を置く

---

### 8.3 Login
**目的**
- ログイン画面の骨組み

**要件**
- ボタンのみでもよい
- Firebase Authentication 本接続は Phase 1
- 将来の Apple / Google / Email ログイン導線を想定する

**表示例**
- Apple で続ける
- Google で続ける
- メールで続ける

---

### 8.4 Home
**目的**
- ログイン後のホーム画面の骨組み

**要件**
- ノート一覧のプレースホルダ
- 新規作成ボタン
- 共有ノートへの導線の土台
- 本体のデータ取得はまだ実装しない

---

### 8.5 Not Found
**目的**
- 存在しないルートへの対応

**要件**
- 404 相当の簡易画面
- ホームへ戻る導線を置く

---

## 9. 完了条件

Phase 0 の完了条件は以下です。

### プロジェクト
- Expo プロジェクトが TypeScript 前提で作成されている
- Expo Router が導入されている
- 起動コマンドでアプリが立ち上がる

### 画面
- `Splash / Onboarding / Login / Home / Not Found` が存在する
- Expo Router で画面遷移できる
- 各画面が最低限表示される

### 構成
- `src/` 配下の責務分割の土台がある
- 将来の Firebase 接続を見据えた構造になっている
- `generated_ui/figma_make` は参照用として分離されている

### 開発品質
- `npx tsc --noEmit` が通る
- `npx expo start` で起動できる
- 主要ファイルの責務が明確である

---

## 10. このPhaseではやらないこと

Phase 0 では以下は実装しない。

- Firebase Authentication の本実装
- Firestore の読み書き
- Firebase Storage アップロード
- Cloud Functions 呼び出し
- OpenAI API の利用
- 画像圧縮・EXIF解析の実装
- 地図表示の実装
- 共同編集ロジックの実装
- 権限管理の実装
- SNS共有カード生成の実装
- 課金機能
- 通知機能
- 管理画面実装
- EAS Build の本番ビルド運用設定
- Figma Make からの自動生成コードを本体に直結すること

---

## Codexへの実装指示

以下の条件で Phase 0 を実装してください。

1. **React Native + Expo + TypeScript** で新規プロジェクトを構築する  
2. **Expo Router** を導入してルート構成を作る  
3. `app/` と `src/` の責務を分離する  
4. `Splash / Onboarding / Login / Home / Not Found` の最小画面を作る  
5. Firebase 接続はまだ実装しない  
6. OpenAI APIキーは絶対にアプリへ含めない  
7. `generated_ui/figma_make` は参考として扱い、本体依存にしない  
8. PowerShell で再現可能なコマンドと依存関係を整える  
9. 将来の Phase 1 で Firebase を接続しやすい構造にする  
10. まずはビルド可能・起動可能・型が通る状態を優先する

必要であれば次に、**この Phase 0 をそのまま実行できる `Codex用の具体的なファイル生成指示`** まで落としてお渡しできます。