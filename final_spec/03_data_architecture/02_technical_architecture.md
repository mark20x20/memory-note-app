# React Native Expo Firebase Architecture v2

## 1. 目的

本書は、**Memory Note App / 思い出ノートアプリ** を、  
**React Native + Expo + TypeScript + Expo Router** で実装し、既存の **Firebase バックエンド** を維持したまま、Release v1 を本番運用可能にするための技術アーキテクチャを定義する。

### 本アーキテクチャの目的
- 写真を起点に、思い出を地図付きノートとして自動生成する
- 既存の Firebase 基盤を維持しつつ、モバイルフロントを React Native + Expo に移行する
- 共有ノート、共同編集、Owner / Editor / Viewer 権限を安全に扱う
- OpenAI API は **Cloud Functions 経由のみ** で利用する
- SNS共有カードを生成し、端末の共有シートで外部共有する
- 位置情報・写真・AIデータの取り扱いを最小化し、プライバシー事故を防ぐ
- Streamlit + Firebase Admin SDK による運用管理を継続する

### このアーキテクチャで決めること
- React Native + Expo アプリの構成
- Firebase 各サービスの役割分担
- 画像アップロードとAI処理の実行経路
- Firestore / Storage / Security Rules の設計方針
- 共有・削除・権限の責務分離
- 開発・本番環境の分離方針

### まだ決めないこと
- 課金体系の最終仕様
- 地図SDKの最終採用
- 共有カードのデザイン最終稿
- 詳細な通知仕様

---

## 2. 全体アーキテクチャ

### 推奨構成
Release v1 は **React Native + Expo + Firebase 중심** で構成する。

```text
[React Native App / Expo]
   ├─ Presentation / UI
   ├─ Application / UseCase
   ├─ Domain / Entity
   └─ Infrastructure / Firebase連携
        ↓
[Firebase Authentication]
[Cloud Firestore]
[Firebase Storage]
[Cloud Functions]
[Firebase Analytics]
[Firebase Crashlytics]
        ↓
[OpenAI API]  ← Cloud Functions 経由のみ
[Map SDK / Geocoding API]
[OS Share Sheet]
```

### 主要責務
| コンポーネント | 責務 |
|---|---|
| React Native App | 画面表示、入力、状態管理、ローカル処理 |
| Expo Router | 画面遷移、認証ガード、ネスト構成 |
| Firebase Authentication | ログイン、認証状態管理 |
| Cloud Firestore | ノート、メンバー、写真メタデータ、AI結果、招待、設定の保存 |
| Firebase Storage | 圧縮画像、サムネイル、共有カード画像の保存 |
| Cloud Functions | AI呼び出し、画像生成、招待処理、削除処理、使用量制御 |
| Firebase Analytics | 行動分析、ファネル把握 |
| Firebase Crashlytics | クラッシュ監視、エラー解析 |
| OpenAI API | タイトル・日記・要約の生成 |
| Map / Geocoding API | 地図表示、場所名推定 |
| OS Share Sheet | 端末標準の外部共有 |
| Streamlit Admin | 運用管理、監査、設定変更 |

### アーキテクチャ方針
- **モバイルアプリに秘密情報を入れない**
- **AIは必ず Cloud Functions 経由**
- **画像処理は端末側で一次処理し、クラウドでは確定処理**
- **Firestore Security Rules で権限を担保**
- **外部公開は SNS共有カードのみ**
- **共有ノートの直接公開URLは作らない**
- **Supabase は使わない**
- **既存 Firebase バックエンドを維持する**

---

## 3. React Native + Expoアプリ構成

### 3.1 採用方針
本番モバイルフロントは以下を採用する。

| 項目 | 採用 |
|---|---|
| フレームワーク | React Native + Expo |
| 言語 | TypeScript |
| ルーティング | Expo Router |
| ビルド | EAS Build |
| 状態管理 | Zustand を基本推奨 |
| サーバ状態管理 | TanStack Query を併用推奨 |
| フォーム管理 | React Hook Form を推奨 |
| バリデーション | Zod を推奨 |

### 3.2 推奨フォルダ構成
```text
app/
  _layout.tsx
  index.tsx
  (auth)/
    login.tsx
    register.tsx
    onboarding.tsx
    profile-setup.tsx
  (tabs)/
    home.tsx
    create.tsx
    search.tsx
    settings.tsx
  note/
    [noteId].tsx
    [noteId]/edit.tsx
    [noteId]/members.tsx
    [noteId]/share-card.tsx
  invite/
    [invitationId].tsx
  card/
    preview.tsx
    saved.tsx

src/
  features/
    auth/
    notes/
    photos/
    ai/
    share/
    settings/
    admin-link/
  components/
  hooks/
  lib/
  services/
  store/
  types/
  utils/
```

### 3.3 レイヤー責務
| レイヤー | 責務 | 例 |
|---|---|---|
| app | Expo Router の画面定義 | 画面ルート、遷移制御 |
| src/features | 機能単位の実装 | auth, notes, share |
| src/components | 共通UI | ボタン、カード、モーダル |
| src/hooks | 共通フック | 認証、権限、画面状態 |
| src/lib | SDK初期化、共通設定 | Firebase初期化、Logger |
| src/services | API / Firebase呼び出し | Firestore, Functions |
| src/store | Zustand ストア | UI状態、編集状態 |
| src/types | 型定義 | Note, Member, Photo |
| src/utils | 細かなユーティリティ | 日付整形、画像処理補助 |

### 3.4 画面単位実装方針
- 1画面 = 1ルート単位で管理する
- 認証済み領域と未認証領域を Expo Router の group で分離する
- ノート詳細配下は nested route で管理する
- モーダル遷移は URL に反映できるものだけを使う

---

## 4. Firebase構成

### 4.1 維持する基盤
既存 Firebase バックエンドはそのまま利用する。

| 項目 | 利用方針 |
|---|---|
| Firebase Authentication | 継続利用 |
| Cloud Firestore | 継続利用 |
| Firebase Storage | 継続利用 |
| Cloud Functions | 継続利用 |
| Firestore Security Rules | 継続利用 |
| Storage Rules | 継続利用 |
| Analytics / Crashlytics | 継続利用 |

### 4.2 環境分離
本番事故を防ぐため、以下の環境分離を推奨する。

| 環境 | 用途 |
|---|---|
| development | ローカル開発、エミュレータ確認 |
| staging | QA、ストア提出前確認 |
| production | 本番公開 |

### 4.3 接続方針
- Expo アプリは環境変数で Firebase 設定を切り替える
- 開発時は Firebase Emulator Suite を優先する
- 本番 API キーはクライアントに入れてよいものだけを使う
- 秘密情報は Cloud Functions / Admin SDK 側に限定する

### 4.4 Firebaseで扱う主データ
- users
- memory_notes
- members
- photos
- place_groups
- ai_results
- share_cards
- invitations
- notifications
- app_settings
- audit_logs
- usage_limits

---

## 5. Firebase Auth

### 5.1 認証方針
Release v1 は **アカウント必須** を前提とする。

### 5.2 対応ログイン
| ログイン方式 | 対応 |
|---|---|
| Email / Password | 対応 |
| Google Sign-In | 対応 |
| Apple Sign-In | 対応 |
| 匿名ログイン | 不採用 |

### 5.3 実装方針
- 認証状態は Firebase Auth で管理する
- Expo 側はログイン状態の復元を前提にする
- セッション維持はアプリ起動時に自動確認する
- アカウント削除導線を必ず用意する

### 5.4 注意点
- iOS では Apple Sign-In を用意する
- Expo 環境での Auth 実装は、必要に応じて Firebase JS SDK とネイティブ連携のどちらを採るか検証する
- モバイル側に秘密鍵は置かない
- 認証失敗時はユーザーに理由を明示する

---

## 6. Cloud Firestore

### 6.1 Firestoreの役割
Firestore はアプリの中核データストアとして使う。

### 6.2 主な保存対象
- ユーザープロフィール
- ノート本体
- ノートメンバーと権限
- 写真メタデータ
- AI生成結果
- 招待情報
- 通知
- 使用量制御
- 監査ログ

### 6.3 推奨構造
```text
users/{userId}
memory_notes/{noteId}
memory_notes/{noteId}/members/{userId}
memory_notes/{noteId}/photos/{photoId}
memory_notes/{noteId}/place_groups/{groupId}
memory_notes/{noteId}/ai_results/{aiResultId}
memory_notes/{noteId}/share_cards/{shareCardId}
invitations/{invitationId}
user_note_index/{userId_noteId}
notifications/{notificationId}
app_settings/{docId}
audit_logs/{logId}
usage_limits/{userId}
```

### 6.4 アクセス方針
- 共有ノートは membership ベースで読取制御する
- `Owner / Editor / Viewer` を Security Rules で判定する
- クライアント直書き不可のコレクションを明確にする
- AI結果や監査ログは Functions 経由を原則とする

### 6.5 実装上の注意
- 一覧用の集計値は冗長保持する
- 削除は基本ソフト削除
- 参照整合性は Cloud Functions で補う
- Firestore 単独での整合保証に依存しすぎない

---

## 7. Firebase Storage

### 7.1 Storageの役割
Storage は画像系アセットの保管先として使う。

### 7.2 保存対象
- 圧縮画像
- サムネイル
- 共有カード画像
- 必要時の一時ファイル

### 7.3 保存方針
- 原本画像は原則保存しない
- 保存するのは表示用の圧縮画像とサムネイルを中心とする
- 共有カードはカード単位で保存する
- 一時ファイルは処理完了後に削除する

### 7.4 ディレクトリ例
```text
users/{userId}/avatars/
memory_notes/{noteId}/photos/
memory_notes/{noteId}/thumbnails/
memory_notes/{noteId}/share_cards/
temp/
```

### 7.5 Storage運用
- アップロード対象はユーザーが明示選択した写真のみ
- 写真削除時は Firestore と Storage の両方を整合させる
- Storage Rules でも membership を確認する
- 外部公開用URLは必要最小限に限定する

---

## 8. Cloud Functions

### 8.1 役割
Cloud Functions は、危険な処理・非同期処理・外部API連携の中核を担う。

### 8.2 主な責務
- OpenAI API 呼び出し
- 画像生成・共有カード生成
- 招待処理
- 削除処理
- 使用量制御
- 監査ログ確定
- 権限変更の補助
- 整合性チェック

### 8.3 実行方針
- モバイルアプリからは callable functions を中心に呼ぶ
- 直接 Firestore に書けるものと Functions 必須のものを分ける
- 重要な更新は Functions で確定する
- Secret は Functions 側の環境変数に置く

### 8.4 代表Function
| Function | 用途 |
|---|---|
| generateTitle | タイトル生成 |
| generateDiary | 短文日記生成 |
| generateSummary | 要約生成 |
| generateShareCard | SNS共有カード生成 |
| createInvitation | 招待作成 |
| acceptInvitation | 招待受諾 |
| revokeInvitation | 招待取消 |
| deleteNote | ノート削除 |
| deletePhoto | 写真削除 |
| transferOwner | Owner移譲 |
| leaveNote | ノート離脱 |
| enforceUsageLimit | 使用量制御 |

### 8.5 実装注意
- 未認証アクセスを拒否する
- 権限チェックを必須にする
- エラーコードをクライアントで扱いやすくする
- ログに写真本体や精密GPSを残さない
- リトライ可能な冪等設計を意識する

---

## 9. OpenAI API連携

### 9.1 基本方針
OpenAI API は **Cloud Functions 経由のみ** で利用する。  
**モバイルアプリに OpenAI APIキーを入れない。**

### 9.2 送信する情報
AIに送る情報は、必要最小限に絞る。

- ノートタイトル候補
- 日時
- 場所名
- エリア名
- 写真枚数
- スポット数
- ユーザーメモの要約
- タグ

### 9.3 送信しない情報
- 原本写真
- 精密GPS座標
- 認証トークン
- 招待秘密情報
- 不要な個人識別情報

### 9.4 AI利用の流れ
1. React Native アプリが Cloud Functions を呼ぶ
2. Functions が権限と使用量を確認する
3. 必要なメタ情報だけを整形する
4. OpenAI API を呼び出す
5. 結果を Firestore に保存する
6. クライアントへ返却する

### 9.5 失敗時の方針
- AI失敗時はフォールバック文を返す
- 完全停止ではなく代替案で継続できるようにする
- 再生成は回数制限を設ける

---

## 10. 画像アップロード構成

### 10.1 基本方針
写真はアプリの中心入力だが、**必要な写真だけを選択してアップロード**する。

### 10.2 処理フロー
```text
写真選択
→ EXIF取得
→ 画像圧縮
→ サムネイル生成
→ Firebase Storage へアップロード
→ Firestore にメタデータ保存
→ Cloud Functions でノート整形
```

### 10.3 Expoでの実装方針
| 処理 | 方針 |
|---|---|
| 写真選択 | Expo ImagePicker 系を利用 |
| 圧縮 | 端末側で軽量化してから送信 |
| EXIF取得 | 端末側で取得し、必要項目だけ保存 |
| アップロード進捗 | UIで表示する |
| 再試行 | ネットワーク失敗時に再送可能にする |

### 10.4 保存ポリシー
- 原本画像は原則保存しない
- 保存するのは圧縮画像とサムネイル
- 位置情報付き写真は外部共有時に弱める
- 写真削除は Firestore / Storage を同期させる

---

## 11. 共有ノート / 権限構成

### 11.1 権限モデル
権限は以下の3ロールに固定する。

| ロール | できること |
|---|---|
| Owner | 全権限、招待、削除、権限変更、Owner移譲 |
| Editor | 写真追加、本文編集、場所名編集、AI生成 |
| Viewer | 閲覧のみ、共有カード生成は可 |

### 11.2 実装方針
- membership を Firestore のサブコレクションで管理する
- 権限判定は Firestore Rules / Storage Rules に反映する
- Viewer は破壊的操作不可
- ノート削除は Owner のみ
- 招待・権限変更は Owner のみ

### 11.3 共有ノート体験
- 友人、家族、恋人と同じノートを育てる
- 1人の記録ではなく共同体験の記録として扱う
- メンバーごとの写真を1つの流れにまとめる

---

## 12. SNS共有カード構成

### 12.1 目的
SNS共有カードは、アプリの成長導線であり、外部共有時の見栄えを担保する。

### 12.2 生成物
- 1:1
- 4:5
- 9:16

### 12.3 表示要素
- メイン写真
- タイトル
- 日付
- 場所名
- 短文日記
- ミニマップまたはルート感
- 写真枚数
- スポット数
- アプリ名 / ロゴ
- "Made with Memory Note"

### 12.4 生成方針
- 共有カード生成は Cloud Functions で確定する
- プレビューを必須にする
- 外部共有前に位置情報ぼかしを確認する
- 端末保存後に OS 共有シートへ渡す

### 12.5 共有先
- Instagram
- LINE
- X
- Facebook
- 端末内保存

---

## 13. Streamlit Admin Dashboard構成

### 13.1 方針
管理画面は **Streamlit + Firebase Admin SDK** を維持する。

### 13.2 主な用途
- ユーザー管理
- ノート管理
- 監査確認
- Usage Limit の確認
- 問い合わせ確認
- 手動対応支援
- フラグ確認
- 障害時の調査補助

### 13.3 構成
```text
Streamlit Admin
  ├─ Firebase Admin SDK
  ├─ Firestore 読み取り
  ├─ Storage メタ確認
  ├─ audit_logs 参照
  ├─ usage_limits 参照
  └─ 緊急対応用操作（制限付き）
```

### 13.4 運用上の注意
- 本番データの直接更新は最小限にする
- 削除や制裁など重要操作は承認フローを必須化する
- 監査ログを必ず残す

---

## 14. 状態管理方針

### 14.1 推奨構成
本アプリでは以下の組み合わせを推奨する。

| 役割 | 推奨 |
|---|---|
| グローバル状態 | Zustand |
| サーバ状態 | TanStack Query |
| 画面内の一時状態 | React state / useReducer |
| フォーム状態 | React Hook Form |
| バリデーション | Zod |

### 14.2 比較

| 手法 | 強み | 弱み | 採用方針 |
|---|---|---|---|
| Zustand | 軽量、学習コスト低、Expo と相性良い | サーバ状態は別管理が必要 | **推奨** |
| React Context | 標準機能、依存追加不要 | 再レンダリング設計が難しい、大規模化で辛い | 小規模限定 |
| TanStack Query | Firestore/Functions 相当のサーバ状態管理に強い、キャッシュ・再取得が得意 | UI状態には不向き | **強く推奨** |
| Redux Toolkit | 大規模状態管理に強い、標準化しやすい | 記述量が増えやすい、MVPには重め | 必要時のみ |

### 14.3 推奨結論
- **状態管理の主軸は Zustand**
- **Firestore / Functions の取得キャッシュは TanStack Query**
- **React Context はテーマや認証最小共有に限定**
- **Redux Toolkit は初期MVPでは必須にしない**

### 14.4 実装指針
- 認証状態は専用ストアに持つ
- 編集中ノートの仮状態はローカルストアで管理する
- Firestore の再取得は Query 経由に寄せる
- UI の多段受け渡しは Context より Zustand を優先する

---

## 15. ルーティング方針

### 15.1 採用
- **Expo Router を正式採用する**
- URL ベースで画面を管理する
- 深い遷移や共有リンクに対応しやすくする

### 15.2 ルーティング設計
```text
app/
  _layout.tsx
  index.tsx
  (auth)/
  (tabs)/
  note/
  invite/
  card/
```

### 15.3 画面分離
| グループ | 役割 |
|---|---|
| (auth) | 未認証、ログイン、登録 |
| (tabs) | ホーム、作成、検索、設定 |
| note | ノート詳細、編集、メンバー管理 |
| invite | 招待受諾 |
| card | 共有カード作成、保存、共有 |

### 15.4 ガード方針
- 未認証時は `(auth)` に強制遷移
- 認証済み時は `(tabs)` を起点にする
- 権限不足時は専用エラー画面へ誘導する
- 招待リンクは deep link で受ける

---

## 16. セキュリティ方針

### 16.1 基本原則
- 認証必須
- membership based access
- 最小権限
- UI 非依存
- Firestore / Storage 両方で制御
- AI 送信前に情報を最小化
- 外部公開はカード画像のみ

### 16.2 禁止事項
- OpenAI APIキーをアプリに埋め込む
- 原本写真を不用意に保存する
- 精密位置情報を外部公開する
- 権限確認を UI のみに依存する
- 直接公開URLでノートを配る
- 重大操作をクライアントだけで完結させる

### 16.3 Rules連携
- Firestore Rules で note membership を判定する
- Storage Rules でも同等の判定を行う
- 削除系は Functions を挟む
- 招待はトークン管理を厳格にする

---

## 17. 開発環境

### 17.1 推奨構成
| 項目 | 推奨 |
|---|---|
| エディタ | VS Code |
| 言語 | TypeScript |
| 実行環境 | Expo Dev Client / Expo Go 検証 + EAS Build |
| バックエンド検証 | Firebase Emulator Suite |
| UI草案 | Figma Make |
| UI確認 | Figma Design |
| 実装 | Codex を含むAI補助 + 人間レビュー |

### 17.2 開発フロー
1. Figma Make で草案作成
2. Figma Design で確認
3. React Native + Expo へ実装
4. Firebase Emulator でローカル検証
5. staging に反映して確認
6. production へリリース

### 17.3 ローカル検証対象
- Auth
- Firestore
- Storage
- Functions
- 招待フロー
- 共有カード生成
- 権限差分

---

## 18. リリース環境

### 18.1 リリース構成
| 環境 | 役割 |
|---|---|
| development | 実装・デバッグ |
| staging | QA・検証 |
| production | 本番公開 |

### 18.2 ビルド方針
- EAS Build を利用する
- iOS / Android を分けて管理する
- 本番ビルド前に staging で動作確認する
- 秘密情報は EAS Secrets や Functions 側で管理する

### 18.3 配布方針
- 開発配布は内部テスト
- ストア審査前は staging で確認
- 本番反映は承認制

---

## 19. Flutter版仕様からの差分

本プロジェクトは、**Flutter 前提から React Native + Expo 前提へ移行**している。  
ただし、**Firebase バックエンド、権限モデル、データモデル、Cloud Functions 方針は維持**する。

### 19.1 変更点
| 項目 | 変更前 | 変更後 |
|---|---|---|
| モバイルフレームワーク | Flutter | React Native + Expo |
| 言語 | Dart | TypeScript |
| ルーティング | go_router / Flutter Router | Expo Router |
| 状態管理 | Riverpod / Bloc想定 | Zustand + TanStack Query |
| UI実装 | Flutter Widget | React Native Components |
| ビルド | Flutter build | EAS Build |
| 実装補助 | Flutter向け生成 | React Native向け生成 |

### 19.2 維持するもの
| 項目 | 維持 |
|---|---|
| Firebase Auth | 維持 |
| Cloud Firestore | 維持 |
| Firebase Storage | 維持 |
| Cloud Functions | 維持 |
| OpenAI API 経路 | 維持 |
| 権限モデル | 維持 |
| SNS共有カード | 維持 |
| Streamlit Admin | 維持 |

### 19.3 影響範囲
- UI コンポーネントは React Native に再実装する
- 状態管理は Redux を必須にはしない
- Expo Router に合わせて画面構成を再設計する
- Firebase Security Rules / Data Model は基本的に流用可能

---

## 20. 未決定事項

以下は実装前に最終決定が必要である。

### 20.1 UI / 体験
- 共有カードの最終テンプレート
- 位置情報ぼかしの具体UI
- オンボーディングの文言
- 共有ノート招待の見せ方

### 20.2 技術
- 地図SDKの最終選定
- Expo Managed で完結するか、必要に応じて Prebuild するか
- Firebase Auth の実装詳細（Expo環境での最適構成）
- 共有カード画像の生成をクライアント主導にするか Functions 主導にするかの最終判断

### 20.3 運用
- AI再生成の回数上限
- ストレージ上限
- 本番公開前の審査手順
- 管理画面の権限粒度

必要であれば次に、以下のどれかをそのまま続けて作成できます。

1. **React Native + Expo 用のディレクトリ構成詳細**
2. **Firebase 接続設定手順書（Expo / EAS 前提）**
3. **Zustand + TanStack Query の具体設計**
4. **Expo Router の画面遷移設計**
5. **React Native 版の画面一覧・ユーザーフロー**