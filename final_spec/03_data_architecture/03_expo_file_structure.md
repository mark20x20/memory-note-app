# Expo File Structure v2

## 1. 目的

本ドキュメントは、**Memory Note App / 思い出ノートアプリ** を  
**React Native + Expo + TypeScript + Expo Router** で実装するための、実装者向けファイル構成仕様です。

前提は以下です。

- バックエンドは **既存 Firebase** を継続利用する
- **Supabase には移行しない**
- 認証は **Firebase Authentication**
- DB は **Cloud Firestore**
- 画像保存は **Firebase Storage**
- サーバ処理は **Cloud Functions**
- 権限管理は **Firestore Security Rules / Storage Rules**
- AI は **Cloud Functions 経由で OpenAI API を利用**
- 管理画面は **Streamlit + Firebase Admin SDK**
- 本番モバイルは **React Native + Expo + TypeScript**
- ルーティングは **Expo Router**
- ビルドは **EAS Build**
- **OpenAI APIキーをモバイルアプリに直接入れない**
- UI から Firebase を直接呼ばず、**Repository / Service 経由**でアクセスする

この構成は、以下を満たすためにあります。

- 写真を起点に思い出ノートを自動生成する
- 共有ノートと共同編集を成立させる
- Owner / Editor / Viewer を安全に扱う
- SNS共有カードを生成・保存・共有する
- 位置情報・写真・AIデータを最小限に扱い、事故を防ぐ
- 画面数が増えても保守しやすい構造にする

---

## 2. 設計方針

### 2.1 基本原則

| 原則 | 内容 |
|---|---|
| UIとデータ層を分離 | 画面から Firebase SDK を直接触らない |
| 機能単位で分割 | `features` を中心に責務を閉じる |
| 共有ロジックは共通化 | 認証・権限・API呼び出しは `src/core` に寄せる |
| Expo Router を正とする | 画面遷移は `app/` 配下で定義する |
| Firebase は Repository 経由 | Firestore / Storage / Auth の直接操作を隠蔽する |
| AI は Functions 経由 | モバイルアプリにAPIキーを置かない |
| 生成UIと本実装を分離 | `generated_ui/figma_make` は参照用に留める |
| テスト可能性を優先 | UseCase / Service / Repository を分ける |
| 権限チェックを二重化 | UI表示制御 + Rules 前提の失敗処理 |
| 既存Firebaseを活かす | 新規バックエンドへ移行しない |

### 2.2 レイヤー責務

| レイヤー | 責務 |
|---|---|
| `app/` | Expo Router のルート定義、画面単位の入口 |
| `src/features/` | 機能ごとの UI / hooks / usecases / repository 接続 |
| `src/core/` | Firebase初期化、共通型、共通サービス、エラー処理 |
| `src/shared/` | デザインシステム、共通コンポーネント、ユーティリティ |
| `generated_ui/` | Figma Make 由来の草案、実装の参照素材 |
| `firebase/` | Cloud Functions、Rules、設定ファイル |
| `admin/` | Streamlit 管理画面 |
| `tests/` | 単体・統合・E2E テスト |

### 2.3 実装上のルール

- 画面コンポーネントは薄く保つ
- Firestore の read/write は `Repository` に閉じる
- AI生成は `aiGeneration` feature から `Cloud Functions` を呼ぶ
- 共有カード生成は `shareCard` feature で扱う
- 権限判定は `permissions` feature と `core/auth` に分ける
- 画像アップロードは `photoUpload` feature に閉じる
- 地図表示は `map` feature に閉じる
- 設定・説明・プライバシーは `settings` feature に閉じる

---

## 3. ルート構成

以下を推奨します。

```text
memory-note-app/
├─ app/
├─ src/
├─ assets/
├─ generated_ui/
├─ firebase/
├─ admin/
├─ tests/
├─ docs/
├─ package.json
├─ app.json
├─ eas.json
├─ tsconfig.json
├─ babel.config.js
├─ metro.config.js
└─ .env
```

### 3.1 ルートの役割

| ディレクトリ | 役割 |
|---|---|
| `app/` | Expo Router の画面ルート |
| `src/` | アプリ本体の実装 |
| `assets/` | 画像、フォント、アイコン |
| `generated_ui/` | Figma Make 草案・スクショ・参照デザイン |
| `firebase/` | Functions / Rules / extensions / emulator 設定 |
| `admin/` | Streamlit 管理画面 |
| `tests/` | Jest / Testing Library / E2E |
| `docs/` | 設計・仕様・運用メモ |

---

## 4. `frontend/mobile` 構成

モノレポを採用する場合は、モバイルアプリを `frontend/mobile` に分離する構成を推奨します。

```text
frontend/
└─ mobile/
   ├─ app/
   ├─ src/
   ├─ assets/
   ├─ generated_ui/
   ├─ package.json
   ├─ app.json
   ├─ eas.json
   ├─ tsconfig.json
   └─ babel.config.js
```

### 推奨判断
- **単一アプリなら** ルート直下運用でもよい
- **将来 Web / Admin / Mobile を分けるなら** `frontend/mobile` を切る
- 仕様上は **どちらでも成立** するが、以後の説明では `frontend/mobile` 前提でも読めるようにする

---

## 5. Expo Router `app/` 構成

### 5.1 ルート方針

- `app/` は **画面ルート専用**
- ロジックを置かない
- 画面ごとの path は Expo Router のファイル名で管理する
- 認証ガード、初回起動判定、タブ構成をここで表現する

### 5.2 推奨構成

```text
app/
├─ _layout.tsx
├─ index.tsx
├─ (auth)/
│  ├─ _layout.tsx
│  ├─ onboarding.tsx
│  ├─ sign-in.tsx
│  ├─ sign-up.tsx
│  └─ profile-setup.tsx
├─ (main)/
│  ├─ _layout.tsx
│  ├─ home.tsx
│  ├─ create/
│  │  ├─ index.tsx
│  │  ├─ select-photos.tsx
│  │  └─ preview.tsx
│  ├─ notes/
│  │  ├─ [noteId].tsx
│  │  ├─ [noteId]/edit.tsx
│  │  ├─ [noteId]/photos.tsx
│  │  ├─ [noteId]/map.tsx
│  │  ├─ [noteId]/members.tsx
│  │  └─ [noteId]/share-card.tsx
│  ├─ search.tsx
│  ├─ calendar.tsx
│  ├─ settings.tsx
│  └─ notifications.tsx
├─ invite/
│  └─ [invitationId].tsx
└─ modal/
   ├─ confirm-delete.tsx
   ├─ confirm-leave.tsx
   └─ permission-info.tsx
```

### 5.3 ルートの役割

| パス | 役割 |
|---|---|
| `/` | 起動判定。認証状態で振り分け |
| `/(auth)/onboarding` | 初回説明 |
| `/(auth)/sign-in` | ログイン |
| `/(auth)/sign-up` | 新規登録 |
| `/(auth)/profile-setup` | プロフィール作成 |
| `/(main)/home` | ホーム・ノート一覧 |
| `/(main)/create/*` | ノート作成フロー |
| `/(main)/notes/[noteId]` | ノート詳細 |
| `/(main)/notes/[noteId]/edit` | ノート編集 |
| `/(main)/notes/[noteId]/photos` | 写真一覧 |
| `/(main)/notes/[noteId]/map` | 地図表示 |
| `/(main)/notes/[noteId]/members` | メンバー管理 |
| `/(main)/notes/[noteId]/share-card` | SNS共有カード |
| `/(main)/search` | 検索 |
| `/(main)/calendar` | カレンダー |
| `/(main)/settings` | 設定 |
| `/invite/[invitationId]` | 招待リンク遷移 |
| `modal/*` | 確認ダイアログ、権限説明 |

---

## 6. `src/` 構成

### 6.1 全体構成

```text
src/
├─ core/
├─ features/
├─ shared/
├─ navigation/
├─ types/
├─ config/
└─ utils/
```

### 6.2 `src/core/`

```text
src/core/
├─ firebase/
│  ├─ client.ts
│  ├─ auth.ts
│  ├─ firestore.ts
│  ├─ storage.ts
│  ├─ functions.ts
│  └─ analytics.ts
├─ repositories/
│  ├─ authRepository.ts
│  ├─ userRepository.ts
│  ├─ noteRepository.ts
│  ├─ photoRepository.ts
│  ├─ memberRepository.ts
│  ├─ shareCardRepository.ts
│  └─ notificationRepository.ts
├─ services/
│  ├─ apiClient.ts
│  ├─ errorMapper.ts
│  ├─ logger.ts
│  ├─ permissionService.ts
│  ├─ requestIdService.ts
│  └─ uploadService.ts
├─ usecases/
├─ state/
├─ constants/
└─ env/
```

#### 役割
- Firebase 初期化
- 共通 API クライアント
- エラー変換
- 権限補助
- アップロード共通処理
- リクエストID生成

---

## 7. `features` 構成

要件として必要な feature は必ず以下を含めます。

- `auth`
- `profile`
- `memoryNotes`
- `photoUpload`
- `map`
- `aiGeneration`
- `collaboration`
- `permissions`
- `shareCard`
- `settings`

### 7.1 推奨構成

```text
src/features/
├─ auth/
│  ├─ components/
│  ├─ hooks/
│  ├─ screens/
│  ├─ usecases/
│  ├─ repositories/
│  └─ types/
├─ profile/
│  ├─ components/
│  ├─ hooks/
│  ├─ screens/
│  ├─ usecases/
│  ├─ repositories/
│  └─ types/
├─ memoryNotes/
│  ├─ components/
│  ├─ hooks/
│  ├─ screens/
│  ├─ usecases/
│  ├─ repositories/
│  ├─ selectors/
│  └─ types/
├─ photoUpload/
│  ├─ components/
│  ├─ hooks/
│  ├─ usecases/
│  ├─ repositories/
│  └─ types/
├─ map/
│  ├─ components/
│  ├─ hooks/
│  ├─ screens/
│  ├─ usecases/
│  ├─ repositories/
│  └─ types/
├─ aiGeneration/
│  ├─ components/
│  ├─ hooks/
│  ├─ usecases/
│  ├─ repositories/
│  └─ types/
├─ collaboration/
│  ├─ components/
│  ├─ hooks/
│  ├─ screens/
│  ├─ usecases/
│  ├─ repositories/
│  └─ types/
├─ permissions/
│  ├─ hooks/
│  ├─ usecases/
│  ├─ services/
│  └─ types/
├─ shareCard/
│  ├─ components/
│  ├─ hooks/
│  ├─ screens/
│  ├─ usecases/
│  ├─ repositories/
│  └─ types/
└─ settings/
   ├─ components/
   ├─ hooks/
   ├─ screens/
   ├─ usecases/
   ├─ repositories/
   └─ types/
```

### 7.2 featureごとの責務

| feature | 責務 |
|---|---|
| `auth` | ログイン、サインアップ、セッション管理 |
| `profile` | 表示名、アイコン、プロフィール編集 |
| `memoryNotes` | ノート一覧、詳細、作成、編集、削除 |
| `photoUpload` | 写真選択、圧縮、アップロード、進捗管理 |
| `map` | 地図表示、場所名、ピン表示 |
| `aiGeneration` | タイトル・本文・要約のAI生成呼び出し |
| `collaboration` | 招待、参加、離脱、メンバー管理 |
| `permissions` | Owner / Editor / Viewer 判定とUI制御 |
| `shareCard` | SNS共有カード生成、保存、共有 |
| `settings` | 権限説明、プライバシー、ヘルプ、アカウント設定 |

---

## 8. 画面ファイル一覧

### 8.1 Expo Router path と画面ID対応表

| 画面ID | Expo Router path | 画面名 | 所属 feature |
|---|---|---|---|
| SCR-ONB-001 | `/` | 起動判定 | auth |
| SCR-ONB-002 | `/(auth)/onboarding` | 初回オンボーディング | auth |
| SCR-AUTH-001 | `/(auth)/sign-in` | ログイン | auth |
| SCR-AUTH-002 | `/(auth)/sign-up` | アカウント作成 | auth |
| SCR-AUTH-003 | `/(auth)/profile-setup` | プロフィール作成 | profile |
| SCR-HOME-001 | `/(main)/home` | ホーム / ノート一覧 | memoryNotes |
| SCR-HOME-002 | `/(main)/home` | ホーム空状態 | memoryNotes |
| SCR-CREATE-001 | `/(main)/create` | 作成開始 | memoryNotes |
| SCR-CREATE-002 | `/(main)/create/select-photos` | 写真選択 | photoUpload |
| SCR-UPLOAD-001 | `/(main)/create/select-photos` | アップロード進捗 | photoUpload |
| SCR-UPLOAD-002 | `/(main)/create/preview` | 処理中 | photoUpload |
| SCR-AI-001 | `/(main)/create/preview` | 生成プレビュー | aiGeneration |
| SCR-AI-002 | `/(main)/notes/[noteId]/edit` | AIタイトル編集 | aiGeneration |
| SCR-AI-003 | `/(main)/notes/[noteId]/edit` | AI日記編集 | aiGeneration |
| SCR-AI-004 | `/(main)/notes/[noteId]/edit` | 場所名編集 | map |
| SCR-NOTE-001 | `/(main)/notes/[noteId]` | ノート詳細 | memoryNotes |
| SCR-NOTE-002 | `/(main)/notes/[noteId]/edit` | ノート編集 | memoryNotes |
| SCR-NOTE-003 | `/(main)/notes/[noteId]/photos` | 写真一覧 / スポット一覧 | memoryNotes |
| SCR-NOTE-004 | `/(main)/notes/[noteId]/photos/[photoId]` 相当 | 写真詳細 | memoryNotes |
| SCR-MAP-001 | `/(main)/notes/[noteId]/map` | ノート地図 | map |
| SCR-MAP-002 | `/(main)/calendar` | カレンダー | memoryNotes |
| SCR-MAP-003 | `/(main)/search` | 検索 | memoryNotes |
| SCR-MAP-004 | `/(main)/calendar` または `/(main)/home` | On This Day | memoryNotes |
| SCR-SHARE-001 | `/(main)/notes/[noteId]/members` | 共有メンバー管理 | collaboration |
| SCR-SHARE-002 | `/(main)/notes/[noteId]/members/invite` | メンバー招待 | collaboration |
| SCR-SHARE-003 | `/(main)/notes/[noteId]/members/[userId]/role` | 権限変更 | collaboration / permissions |
| SCR-SHARE-004 | `/(main)/settings/leave-note` | 共有ノート離脱 | collaboration |
| SCR-SHARE-005 | `modal/confirm-delete` | 削除確認 | collaboration / memoryNotes |
| SCR-CARD-001 | `/(main)/notes/[noteId]/share-card` | 共有カード設定 | shareCard |
| SCR-CARD-002 | `/(main)/notes/[noteId]/share-card/preview` | カードプレビュー | shareCard |
| SCR-CARD-003 | `/(main)/notes/[noteId]/share-card/saved` | カード保存完了 | shareCard |
| SCR-CARD-004 | `/(main)/notes/[noteId]/share-card/share` | 共有シート起動案内 | shareCard |
| SCR-SET-001 | `/(main)/settings` | 設定トップ | settings |
| SCR-SET-002 | `/(main)/settings/permission-info` | 権限説明 | settings |
| SCR-SET-003 | `/(main)/settings/privacy` | プライバシー | settings |
| SCR-SET-004 | `/(main)/settings/terms` | 利用規約 | settings |
| SCR-SET-005 | `/(main)/settings/support` | 問い合わせ | settings |

### 8.2 実装上の注意
- 画面IDは既存仕様と揃える
- path は Expo Router のネスト構造に合わせる
- 1画面1責務を基本にする
- 共通モーダルは `modal/` または `app/(main)/_modals/` に置く

---

## 9. Firebase関連ファイル

### 9.1 推奨配置

```text
firebase/
├─ functions/
│  ├─ src/
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ .env.example
├─ firestore.rules
├─ storage.rules
├─ firestore.indexes.json
├─ firebase.json
└─ .firebaserc
```

### 9.2 役割

| ファイル | 役割 |
|---|---|
| `firestore.rules` | Firestore の認可 |
| `storage.rules` | Storage の認可 |
| `firestore.indexes.json` | 複合インデックス定義 |
| `firebase.json` | Emulator / Hosting / Functions 設定 |
| `.firebaserc` | Firebase プロジェクト切替 |
| `functions/src/*` | AI生成、招待、削除、カード生成のサーバ処理 |

### 9.3 functions の配置例

```text
firebase/functions/src/
├─ index.ts
├─ config/
├─ controllers/
├─ services/
├─ repositories/
├─ usecases/
├─ validators/
└─ utils/
```

---

## 10. Repository / Service構成

### 10.1 役割分担

| 種別 | 役割 |
|---|---|
| Repository | Firebase / API / Storage とのデータ入出力 |
| Service | 複数 Repository をまたぐ処理、共通ロジック |
| UseCase | 画面アクションに対応する業務処理 |
| Controller | UI からのイベント受け取り、state反映 |

### 10.2 推奨配置

```text
src/core/repositories/
src/core/services/
src/features/*/repositories/
src/features/*/usecases/
```

### 10.3 例

- `AuthRepository`
  - Firebase Authentication をラップ
- `UserRepository`
  - Firestore の `users` を操作
- `MemoryNoteRepository`
  - ノート CRUD
- `PhotoRepository`
  - Storage へのアップロード、削除
- `MemberRepository`
  - 招待、権限、参加状態管理
- `ShareCardRepository`
  - 共有カード画像の保存と取得
- `AiGenerationRepository`
  - Cloud Functions callable へのアクセス

### 10.4 禁止事項

- UI から直接 `firebase_auth` / `cloud_firestore` / `firebase_storage` を呼ぶ
- 画面コンポーネント内で Firestore クエリを書く
- APIキーや秘密情報をクライアントにハードコードする
- 画面側で権限判定だけに依存する

---

## 11. Hooks構成

### 11.1 方針

- `useXxx` は画面専用ロジックをまとめる
- 画面に置く state を減らす
- Repository 呼び出しや権限分岐を吸収する
- Expo Router の params と接続しやすくする

### 11.2 推奨配置

```text
src/features/auth/hooks/
src/features/profile/hooks/
src/features/memoryNotes/hooks/
src/features/photoUpload/hooks/
src/features/map/hooks/
src/features/aiGeneration/hooks/
src/features/collaboration/hooks/
src/features/permissions/hooks/
src/features/shareCard/hooks/
src/features/settings/hooks/
```

### 11.3 代表例

| Hook名 | 役割 |
|---|---|
| `useAuthSession` | 認証状態の監視 |
| `useCurrentUserProfile` | 現在のプロフィール取得 |
| `useMemoryNotesList` | ノート一覧取得 |
| `useMemoryNoteDetail` | ノート詳細取得 |
| `usePhotoUpload` | 写真選択・アップロード進捗 |
| `useNoteAiDraft` | AI生成結果の管理 |
| `useMemberManagement` | 招待・権限変更・離脱 |
| `useShareCardGeneration` | 共有カード生成 |
| `usePermissionGate` | 権限チェック |
| `useSettingsData` | 設定値・説明文取得 |

---

## 12. Type定義

### 12.1 配置

```text
src/types/
src/features/*/types/
```

### 12.2 必須型

| 型名 | 用途 |
|---|---|
| `User` | ユーザー情報 |
| `MemoryNote` | 思い出ノート本体 |
| `MemoryNoteMember` | ノートメンバー |
| `MemoryNotePhoto` | 写真情報 |
| `PlaceGroup` | スポット単位のグルーピング |
| `AiResult` | AI生成結果 |
| `ShareCard` | SNS共有カード |
| `Invitation` | 招待情報 |
| `Notification` | 通知 |
| `PermissionRole` | `owner | editor | viewer` |
| `PermissionStatus` | `active | invited | left | removed` |

### 12.3 型の方針

- Firestore のドキュメント型とアプリ内部型を分ける
- `Timestamp` はアプリ内部で `Date` に変換する
- `null` と `undefined` を混同しない
- 画像URL、Storage path、表示用URL を区別する
- 権限ロールは string literal union にする

---

## 13. テスト構成

### 13.1 推奨構成

```text
tests/
├─ unit/
├─ integration/
├─ e2e/
├─ fixtures/
└─ mocks/
```

### 13.2 テスト対象

| 種別 | 対象 |
|---|---|
| Unit | Repository, Service, UseCase, 権限判定 |
| Integration | Firebase SDK ラッパー、Functions 呼び出し |
| E2E | ログイン、作成、共有、カード生成、削除 |
| Snapshot | 主要画面、共有カードプレビュー |
| Rules | Firestore / Storage Rules の許可・拒否 |

### 13.3 最低限のテスト優先度
1. 認証
2. ノート作成
3. 権限判定
4. 共有ノート参加
5. 共有カード生成
6. ノート削除
7. 写真アップロード失敗時の再試行

---

## 14. `generated_ui/figma_make` の扱い

### 14.1 位置づけ

`generated_ui/figma_make` は、**Figma Make で作成したUI草案の保管場所**です。  
本番実装のソースではありません。

### 14.2 推奨構成

```text
generated_ui/
└─ figma_make/
   ├─ onboarding/
   ├─ auth/
   ├─ home/
   ├─ create/
   ├─ note_detail/
   ├─ share_card/
   ├─ settings/
   ├─ screenshots/
   └─ notes.md
```

### 14.3 運用ルール

- Figma Make の出力はそのまま本番コードにしない
- デザイン確認は Figma Design を正とする
- Codex で React Native + Expo 実装へ落とし込む
- 草案は `notes.md` に差分メモを残す
- 生成UIの構造を `src/` に直接混ぜない

---

## 15. 最初に作るべきファイル

### 15.1 最小初期セット

```text
app/_layout.tsx
app/index.tsx
app/(auth)/onboarding.tsx
app/(auth)/sign-in.tsx
app/(auth)/sign-up.tsx
app/(auth)/profile-setup.tsx
app/(main)/_layout.tsx
app/(main)/home.tsx
src/core/firebase/client.ts
src/core/firebase/auth.ts
src/core/repositories/authRepository.ts
src/core/repositories/userRepository.ts
src/core/services/permissionService.ts
src/features/auth/hooks/useAuthSession.ts
src/features/profile/hooks/useCurrentUserProfile.ts
src/features/memoryNotes/hooks/useMemoryNotesList.ts
src/features/photoUpload/hooks/usePhotoUpload.ts
src/features/aiGeneration/hooks/useNoteAiDraft.ts
src/features/shareCard/hooks/useShareCardGeneration.ts
src/features/settings/hooks/useSettingsData.ts
src/types/index.ts
firebase/firestore.rules
firebase/storage.rules
firebase/functions/src/index.ts
```

### 15.2 初期実装順序

| 順位 | 対象 |
|---|---|
| 1 | Firebase 初期化 |
| 2 | Auth セッション |
| 3 | Profile 作成 |
| 4 | Home 一覧 |
| 5 | Note 詳細 |
| 6 | Photo Upload |
| 7 | AI生成 |
| 8 | Share Card |
| 9 | Collaboration |
| 10 | Settings / Privacy |

---

## 16. 命名規則

### 16.1 ファイル命名

| 対象 | ルール | 例 |
|---|---|---|
| 画面 | kebab-case or Expo Router ルール | `sign-in.tsx`, `[noteId].tsx` |
| コンポーネント | PascalCase | `MemoryNoteCard.tsx` |
| Hook | camelCase + `use` | `useAuthSession.ts` |
| Repository | PascalCase + `Repository` | `MemoryNoteRepository.ts` |
| UseCase | PascalCase + `UseCase` | `CreateMemoryNoteUseCase.ts` |
| Type | PascalCase | `MemoryNote.ts` |
| 定数 | UPPER_SNAKE_CASE | `MAX_PHOTO_COUNT` |

### 16.2 ディレクトリ命名

- feature 名は `camelCase` 推奨
- ルートは Expo Router の命名に従う
- Firebase Functions 側は `snake_case` ではなく TypeScript の標準に合わせる

### 16.3 ID・Path命名

- 画面IDは既存仕様と一致させる
- Firestore path は既存データモデルに一致させる
- 変数名は役割が分かるものにする

---

## 17. 未決定事項

以下は本構成では**未決定**として扱います。

| 項目 | 状態 | 補足 |
|---|---|---|
| Web版の正式対応 | 未決定 | 現時点ではモバイル優先 |
| 地図SDKの最終選定 | 未決定 | Google Maps / MapKit / other を比較 |
| 共有カードのレンダリング方式 | 未決定 | クライアント描画 or Functions描画を比較 |
| 画像原本の条件付き保存 | 未決定 | 原則保存しない方針は維持 |
| 通知基盤 | 未決定 | v1は必須でない可能性あり |
| 課金機能 | 未決定 | 監視・制限との整合が必要 |
| オフライン編集 | 未決定 | v1では優先度低 |
| PWA対応 | 未決定 | Expo Web 方針次第 |
| 位置情報ぼかし詳細UX | 未決定 | プライバシー優先で後続設計 |

必要であれば次に、**この構成をもとに `app/` と `src/` の実ファイルツリーをさらに具体化した「初期実装用ディレクトリ一覧」** まで落とし込みます。