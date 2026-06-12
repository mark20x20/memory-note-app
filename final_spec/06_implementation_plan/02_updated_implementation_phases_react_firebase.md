# Updated Implementation Phases React Firebase v2

## 1. 目的

本ドキュメントは、**Memory Note App / 思い出ノートアプリ** を、  
**React Native + Expo + TypeScript + Expo Router + Firebase** 前提で実装するための、開発順序・成果物・依存関係を定義した実装フェーズ資料です。

目的は以下です。

- 既存の Firebase バックエンドを維持したまま、モバイルフロントエンドを React 系へ移行する
- **写真を選ぶだけで、思い出を地図付きノートとして共同で残せる**体験を、段階的に実装できるようにする
- **OpenAI API キーをモバイルアプリに入れず**、Cloud Functions 経由で AI 生成を行う
- 共有、権限、削除、SNS共有カードまでを本番運用前提で実装する
- Figma Make で作った UI 草案を、Figma Design で確認し、Codex で React Native 実装へつなぐ
- EAS Build を使って iOS / Android の配布可能な形へ持っていく
- 管理画面は **Streamlit + Firebase Admin SDK** の方針を維持する

---

## 2. 旧Phaseからの変更点

### 2.1 技術スタックの変更
旧前提は Flutter でしたが、今回の固定方針では以下に変更します。

| 項目 | 旧前提 | 新前提 |
|---|---|---|
| モバイルフロントエンド | Flutter | React Native + Expo + TypeScript |
| ルーティング | go_router | Expo Router |
| ビルド | Flutter build / store 手順 | EAS Build |
| UI草案作成 | Flutter実装前提の設計 | Figma Make → Figma Design → Codex 実装 |
| 管理画面 | 既存方針に依存 | Streamlit + Firebase Admin SDK |
| バックエンド | Firebase | Firebase 維持 |
| AIキー管理 | Cloud Functions 経由 | Cloud Functions 経由を維持 |

### 2.2 変更しないもの
以下は維持します。

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Cloud Functions
- Firestore Security Rules / Storage Rules
- OpenAI API は Cloud Functions 経由のみ
- 共有ノート、共同編集、Owner / Editor / Viewer 権限
- SNS共有カード必須
- プライバシー・削除・権限説明の必須化

### 2.3 実装順序の考え方
旧Phaseは Flutter 実装の都合が強かったため、今回の Phase では  
**「Expo で立ち上げるための基盤」→「Firebase 接続」→「認証」→「画面骨格」→「UI参照統合」→「コア機能」**  
の順に再編成します。

---

## 3. 新Phase一覧

以下を、実装順の基本ラインとします。

| Phase | 名称 | 目的 |
|---|---|---|
| Phase 0 | Expo Project Setup | React Native / Expo / TypeScript の土台構築 |
| Phase 1 | Firebase Foundation for Expo | Firebase 接続と環境分離の確立 |
| Phase 2 | Auth / Profile | 認証・プロフィール・セッション管理 |
| Phase 3 | Core Navigation / UI Shell | アプリの画面骨格・ルーティング・共通UI |
| Phase 4 | Figma Make UI Reference Integration | Figma草案を実装UIへ落とし込む |
| Phase 4.5 | UI Design System / Figma Screen Map Finalization | UIルール固定・ルート整理・Figma生成ルール定義 |
| Phase 5 | Memory Note Creation | ノート作成フローの基本実装 |
| Phase 6 | Photo Picker / Metadata Extraction | 写真選択とEXIF取得 |
| Phase 7 | Firebase Storage Upload | 写真アップロードと同期 |
| Phase 8 | Map / Place Grouping | 地図表示・位置情報・スポットまとめ |
| Phase 9 | AI Generation via Cloud Functions | タイトル・短文日記のAI生成 |
| Phase 10 | Note Detail / Edit / Delete | 詳細閲覧・編集・削除 |
| Phase 11 | Collaboration / Permissions | 共有ノート、招待、権限管理 |
| Phase 12 | SNS Share Card | 共有カード生成・保存・共有 |
| Phase 12.5 | Place Intelligence / Location Enrichment | 場所推定・施設候補取得・ユーザー確認・AI補助ランキング |
| Phase 13 | Search / Calendar / Timeline | 検索・カレンダー・時系列閲覧 |
| Phase 14 | Settings / Privacy / Support | 設定・権限説明・ヘルプ |
| Phase 15 | Analytics / Monitoring / Cost Controls | 分析・監視・コスト制御 |
| Phase 16 | QA / EAS Build / Store Release | 品質確認・配布・審査対応 |
| Phase 17 | Streamlit Admin Dashboard / AI Ops | 管理画面・運用支援・AI補助 |

---

## 4. Phase別成果物

### Phase 0: Expo Project Setup
**目的**
- React Native + Expo + TypeScript の初期構築
- 開発者全員が同じ起点から作業できる状態にする

**成果物**
- Expo プロジェクト初期化
- TypeScript 設定
- Expo Router 導入
- ESLint / Prettier / path alias 設定
- 環境変数設計
- ベーステーマとフォルダ構成
- 開発・ステージング・本番の分離方針

**完了条件**
- iOS / Android で起動できる
- ルーティングが動く
- ベース画面が表示される

---

### Phase 1: Firebase Foundation for Expo
**目的**
- Expo から Firebase を安全に使えるようにする

**成果物**
- Firebase initialization
- Authentication / Firestore / Storage / Functions の接続
- 環境別 Firebase 設定
- セキュアな env 管理
- Firebase emulator 利用方針
- 認証状態の接続確認

**完了条件**
- Expo から Firebase に接続できる
- dev / staging / prod を切り替え可能
- APIキーや秘密情報をアプリに埋め込んでいない

---

### Phase 2: Auth / Profile
**目的**
- ログイン・プロフィール・セッション維持を実装する

**成果物**
- メール認証
- Apple Sign-In
- Google Sign-In
- ログイン / ログアウト
- 初回プロフィール作成
- 表示名編集
- アカウント削除導線
- 認証ガード

**完了条件**
- 未ログインでは主要画面に入れない
- ログイン後にプロフィールが永続化される

---

### Phase 3: Core Navigation / UI Shell
**目的**
- アプリ全体の画面遷移の土台を作る

**成果物**
- Expo Router のルート構成
- タブ / スタック構成
- Home
- Create
- Detail
- Settings
- Shared Note 関連の導線
- ローディング、空状態、権限エラーの共通UI

**完了条件**
- 主要画面へ遷移できる
- 認証状態に応じてルート制御できる

---

### Phase 4: Figma Make UI Reference Integration
**目的**
- Figma Make で作った草案を、実装UIに反映しやすくする

**成果物**
- 画面ごとの Figma 参照番号管理
- デザインコンポーネントの命名ルール
- 色、余白、文字サイズ、カード構造の設計
- Codex に渡す UI 実装指示テンプレート
- Figma Design と実装差分の管理方針

**完了条件**
- デザイン参照から実装への変換ルートが明確
- 画面単位でレビュー可能

---

### Phase 4.5: UI Design System / Figma Screen Map Finalization
**目的**
- Phase 5 以降でデザインがブレないようにUIルールを固定する
- 未定義だったExpo Routerルートを整理し、全画面の設計地図を完成させる
- Figma Make の生成・保存・採用・実装反映のルールを文書化する

**成果物**
- `generated_ui/figma_make/ui_design_system.md` — カラー / フォント / 余白 / 角丸 / 影 / コンポーネントルール
- `generated_ui/figma_make/figma_make_common_prompt.md` — Figma Make 共通プロンプト（完成形）
- `generated_ui/figma_make/generation_rules.md` — 生成・保存・採用判断ルール
- `generated_ui/figma_make/implementation_rules.md` — Figma → React Native 実装反映ルール
- `generated_ui/figma_make/phase_plan.md` — Phase別 Figma 作成・実装計画
- `generated_ui/figma_make/screen_priority.md` — 画面優先順位（A / B / C）
- `generated_ui/figma_make/reference_map.md` — 全38画面の予定ルート・Figma優先度・実装Phase補強版
- `app/index.tsx`, `app/(app)/_layout.tsx` — ActivityIndicator の色を `colors.primary` に修正

**完了条件**
- 主要画面の予定 Expo Router ルートが全て決まっている
- Figma Make 共通プロンプトが完成している
- UI Design System md がある
- 生成ルールと実装反映ルールがある
- Phase 5 以降で Figma を参照して実装できる状態になっている

---

### Phase 5: Memory Note Creation
**目的**
- 思い出ノートの作成フローを実装する

**成果物**
- 新規ノート作成
- タイトル入力
- メモ入力
- 保存前プレビュー
- 下書き保存
- ノート初期データ生成

**完了条件**
- ノートの器が作れる
- 保存前に確認できる

---

### Phase 6: Photo Picker / Metadata Extraction
**目的**
- 写真起点の体験を作る

**成果物**
- OS標準ピッカーによる写真選択
- 複数写真選択
- EXIF 取得
- 撮影日時取得
- GPS取得
- 向き情報取得
- GPSなし写真の例外処理
- 選択写真のみを扱うプライバシー制御

**完了条件**
- 選んだ写真から必要メタデータを抽出できる
- 欠損写真でも落ちない

---

### Phase 7: Firebase Storage Upload
**目的**
- 写真をクラウド保存に載せる

**成果物**
- 圧縮画像アップロード
- サムネイル生成
- アップロード進捗表示
- 再試行
- Storage 参照と Firestore 連携
- 削除時の同期設計

**完了条件**
- 写真が Firebase Storage に保存される
- 一覧・詳細で再表示できる

---

### Phase 8: Map / Place Grouping
**目的**
- 地図付きノートの体験を成立させる

**成果物**
- 地図表示
- ピン表示
- 場所名推定
- 場所グループ化
- 位置情報なし時の代替表示
- スポット単位の表示

**完了条件**
- 写真が場所ごとにまとまって見える
- ノート詳細で地図と整合する

---

### Phase 9: AI Generation via Cloud Functions
**目的**
- AIでタイトル・短文日記を補助生成する

**成果物**
- Cloud Functions 経由の AI 呼び出し
- タイトル生成
- 短文日記生成
- 再生成
- 手動編集
- 失敗時の代替文
- OpenAI APIキー非公開の担保

**完了条件**
- モバイルから直接 OpenAI を呼ばない
- 生成結果を編集して保存できる

---

### Phase 10: Note Detail / Edit / Delete
**目的**
- ノートの閲覧・編集・削除を実用レベルにする

**成果物**
- ノート詳細画面
- 写真一覧
- メモ表示
- 地図表示
- 編集画面
- 削除確認
- ソフト削除 / 物理削除の連携
- 閲覧権限に応じた表示制御

**完了条件**
- 作成したノートを見返せる
- Owner のみ削除できる

---

### Phase 11: Collaboration / Permissions
**目的**
- 共有ノートと共同編集を成立させる

**成果物**
- Owner / Editor / Viewer の表示
- 招待
- メンバー一覧
- 権限変更
- 自己離脱
- 参加状態管理
- Security Rules と整合したUI制御

**完了条件**
- 共有ノートが複数人で使える
- 権限ごとの操作差が正しく反映される

---

### Phase 12: SNS Share Card
**目的**
- 外部共有用の見栄えを完成させる

**成果物**
- 1:1、4:5、9:16 共有カード
- プレビュー
- 端末保存
- OS共有シート
- Instagram / LINE / X / Facebook 共有導線
- 位置情報ぼかし表現

**完了条件**
- SNS向けに美しく共有できる
- アプリの成長導線として機能する

---

### Phase 12.5: Place Intelligence / Location Enrichment
**目的**
- 写真の GPS 座標から「どこに行ったか」を名称・カテゴリとして推定する
- 外部 Places API 候補 + スコアリング + AI 補助でユーザーに場所を提案する

**成果物**
- Google Places API (New) を Cloud Functions 経由で呼び出し
- PlaceGroup / PlaceCandidate データモデル・Firestore 保存
- 候補スコアリング・AI ランキング
- ユーザー確認 UI（places / places/[id] / manual 画面）
- Detail 画面への「訪れた場所」セクション追加
- 本格 Map SDK（react-native-maps）でのピン表示
- AI 日記・共有カードへの場所情報連携

**完了条件**
- 写真から訪れた場所名が推定できる
- ユーザーが場所を確認・修正できる
- 確定場所名が AI 日記と共有カードに反映される

**サブフェーズ**
- Phase 12.5A: Planning / Provider Decision
- Phase 12.5B: Data Model / Firestore Schema
- Phase 12.5C: Cloud Functions Candidate Retrieval
- Phase 12.5D: Candidate Scoring / AI Ranking
- Phase 12.5E: Places UI / User Confirmation
- Phase 12.5F: Map SDK / Pin Plotting

**詳細設計:** `docs/phase12_5_place_intelligence/` を参照

---

### Phase 13: Search / Calendar / Timeline
**目的**
- 後から見返しやすくする

**成果物**
- 検索
- タグ
- カレンダー
- 時系列タイムライン
- On This Day
- 月次・年次サマリー

**完了条件**
- ノートが増えても探せる
- 振り返りがしやすい

---

### Phase 14: Settings / Privacy / Support
**目的**
- 本番アプリに必要な説明・設定・サポートを揃える

**成果物**
- 設定画面
- 権限説明
- プライバシーポリシー
- 利用規約
- AI利用説明
- 問い合わせ導線
- データ削除導線
- 公開範囲説明

**完了条件**
- 審査・運用・ユーザー説明の土台がある

---

### Phase 15: Analytics / Monitoring / Cost Controls
**目的**
- 本番運用での異常検知とコスト制御を行う

**成果物**
- Firebase Analytics
- Crashlytics
- 基本ログ
- 失敗率監視
- AI利用回数監視
- Storage 容量監視
- usage limits 方針
- Feature flag 方針

**完了条件**
- 異常やコスト増加を早期検知できる

---

### Phase 16: QA / EAS Build / Store Release
**目的**
- ストア公開可能な品質にする

**成果物**
- テスト計画
- EAS Build 設定
- iOS / Android ビルド設定
- ストア審査用メタ情報
- 画面遷移確認
- 権限・削除・共有の動作確認

**完了条件**
- 配布可能なビルドが出せる
- ストア提出に必要な情報が揃う

---

### Phase 17: Streamlit Admin Dashboard / AI Ops
**目的**
- 運用者向け管理画面とAI補助運用を整える

**成果物**
- Streamlit 管理画面
- Firebase Admin SDK 連携
- ユーザー / ノート / 招待 / ログ確認
- 監視補助
- 問い合わせ分類支援
- 定型レポート支援

**完了条件**
- 管理者が本番運用を安全に行える

---

## 5. 最初に実装する縦スライス

最初に作るべきは、**「写真を選ぶ → アップロードする → メタデータを取る → ノートを作る → 詳細で見る」** の最小縦スライスです。  
共有やAIより先に、まず「1人で成立する基本体験」を作ります。

### 推奨縦スライス構成
1. Phase 0: Expo Project Setup
2. Phase 1: Firebase Foundation for Expo
3. Phase 2: Auth / Profile
4. Phase 3: Core Navigation / UI Shell
5. Phase 5: Memory Note Creation
6. Phase 6: Photo Picker / Metadata Extraction
7. Phase 7: Firebase Storage Upload
8. Phase 10: Note Detail / Edit / Delete の一部

### この順番の理由
- 認証と Firebase 接続がないと、後続機能が検証できない
- ノート作成がないと、アプリの核が見えない
- 写真選択とアップロードがないと、このサービスの価値が伝わらない
- 共有やAIは強いが、最初に入れると不具合切り分けが難しくなる

### 縦スライスの完了定義
- ログインできる
- 写真を選べる
- 1件のノートを作れる
- Firestore に保存できる
- Storage に写真を置ける
- 詳細画面で見返せる

---

## 6. Codexに渡す順番

Codex に実装を依頼する場合は、以下の順番が安全です。

### 6.1 推奨投入順
1. **Phase 0**
   - Expo 初期化
   - フォルダ構成
   - TypeScript / ESLint / Router 設定

2. **Phase 1**
   - Firebase 初期化
   - 環境変数
   - Emulator 接続

3. **Phase 2**
   - 認証
   - プロフィール
   - 認証ガード

4. **Phase 3**
   - Shell UI
   - ナビゲーション
   - 共通状態

5. **Phase 5**
   - ノート作成
   - 入力フォーム
   - プレビュー

6. **Phase 6**
   - 写真選択
   - EXIF 抽出
   - 例外処理

7. **Phase 7**
   - Storage アップロード
   - 進捗表示
   - 再試行

8. **Phase 8〜12**
   - 地図
   - AI
   - 編集
   - 共同編集
   - 共有カード

### 6.2 Codexに渡す単位
- 1 Phase ずつ
- さらに大きい Phase は「画面単位」「コンポーネント単位」「Hooks単位」に分割
- 1回の依頼でやることは 1つに絞る

### 6.3 渡す際に必ず含める情報
- 画面ID
- 入力
- 出力
- Firebase 参照先
- 権限制約
- エラー時の挙動
- Figma 参照
- 受け入れ条件

---

## 7. Figma Makeとの関係

### 7.1 役割分担
- **Figma Make**: 画面草案を短時間で作る
- **Figma Design**: 草案を確認・修正・確定する
- **Codex**: 確定したUIを React Native + Expo 実装へ落とす

### 7.2 実装での使い方
Figma Make の段階では、以下を確定しすぎないことが重要です。

- 最終的な文言
- 最終的な余白や色
- 権限説明の長文
- エラー文の細部

まずは以下を確認します。

- 画面構成
- 情報の優先順位
- ボタンの配置
- ノート詳細の見せ方
- 共有カードの見え方

### 7.3 実装への反映ルール
- Figma の画面名とコード側の screen 名を一致させる
- 重要コンポーネントは再利用できる形にする
- 1画面ごとに「必要な状態」と「不要な状態」を明記する
- デザインだけで判断せず、Firestore / Rules / 権限制御とセットで確認する

---

## 8. Firebaseとの関係

### 8.1 維持する Firebase 構成
今回の固定方針では、既存 Firebase を継続利用します。

| Firebase機能 | 役割 |
|---|---|
| Authentication | ログイン / セッション管理 |
| Cloud Firestore | ノート、メンバー、メタデータ、設定 |
| Firebase Storage | 写真、サムネイル、共有カード画像 |
| Cloud Functions | AI、招待、削除、共有カード生成 |
| Security Rules | 権限制御 |
| Analytics | 利用分析 |
| Crashlytics | クラッシュ監視 |

### 8.2 Expo からの接続方針
- Firebase 初期化はアプリ起動時に一度だけ行う
- 認証状態をアプリ全体で監視する
- Firestore の読み取りは membership ベースで制限する
- Storage の読み書きも同様に権限を揃える
- OpenAI は必ず Cloud Functions 経由で呼ぶ

### 8.3 実装時の注意
- モバイルアプリに OpenAI API キーを絶対に入れない
- Firestore の値を UI 側だけで信用しない
- 削除や招待は Cloud Functions と Rules の両方で守る
- 位置情報は外部共有前に弱める
- 共有URLを安易に公開しない

---

## 9. 注意事項

### 9.1 Flutter前提を残さない
本フェーズ以降、実装方針に Flutter は含めません。  
UI、ルーティング、状態管理、ビルド、配布はすべて **React Native + Expo + TypeScript** を前提にします。

### 9.2 Supabase前提を入れない
DB、認証、Storage、Functions、Rules は **Firebase 維持**です。  
Supabase 移行や二重管理を前提にしません。

### 9.3 OpenAIキーをアプリに入れない
AI生成は必ず **Cloud Functions 経由**です。  
モバイルアプリから OpenAI API に直接アクセスしないでください。

### 9.4 共有・権限を後回しにしない
このサービスは単独記録ではなく、**共同の思い出**が価値です。  
そのため、共有・権限・削除の設計は Phase 11 以降に必ず実装します。

### 9.5 SNS共有カードを軽視しない
共有カードは装飾ではなく、**流入導線**です。  
Phase 12 で独立して扱い、表示品質を妥協しないようにします。

### 9.6 管理画面は別レイヤーで扱う
運用者向け機能はモバイルアプリに混ぜず、  
**Streamlit + Firebase Admin SDK** で別実装とします。

### 9.7 最初から全部作らない
最初の勝ち筋は、以下の縦スライスです。

- ログイン
- 写真選択
- アップロード
- ノート作成
- 詳細閲覧

この核が成立してから、AI・共有・SNSカードを拡張してください。