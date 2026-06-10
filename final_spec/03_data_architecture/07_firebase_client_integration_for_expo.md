# Firebase Client Integration for Expo v2

## 1. 目的

本ドキュメントは、**Memory Note App / 思い出ノートアプリ** を  
**React Native + Expo + TypeScript** で実装する際の、Firebase クライアント統合仕様を定義します。

対象は以下です。

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

本仕様の目的は、以下を実装可能な粒度で整理することです。

- Expo アプリから Firebase を安全に接続する
- 認証・閲覧・編集・削除を権限モデルに沿って制御する
- 写真アップロード、ノート保存、共有ノート、SNS共有カードを成立させる
- OpenAI API キーをモバイルアプリに絶対に入れない
- development / staging / production を分離する
- Emulator を使ってローカル検証できるようにする

---

## 2. 前提

### 2.1 技術前提

| 項目 | 前提 |
|---|---|
| フロントエンド | React Native + Expo + TypeScript |
| 画面遷移 | Expo Router |
| 状態管理 | 必要に応じて React Context / Zustand / TanStack Query 等 |
| バックエンド | 既存 Firebase を継続利用 |
| 認証 | Firebase Authentication |
| DB | Cloud Firestore |
| 画像保存 | Firebase Storage |
| サーバ処理 | Cloud Functions |
| 権限制御 | Firestore Security Rules / Storage Rules |
| AI | Cloud Functions 経由で OpenAI API 利用 |
| 管理画面 | Streamlit + Firebase Admin SDK |
| ビルド | EAS Build |

### 2.2 非前提

以下は本ドキュメントでは前提にしません。

- Supabase への移行
- Firebase の新規作成前提
- モバイルアプリへの Firebase Admin SDK 組み込み
- モバイルアプリへの OpenAI API キー埋め込み
- Flutter 前提の構成

### 2.3 守るべき制約

- **Firebase Admin SDK はモバイルアプリに入れない**
- **OpenAI API キーはモバイルアプリに入れない**
- **AI 呼び出しは Cloud Functions 経由のみ**
- **権限判定は UI ではなく Rules を正とする**
- **共有ノートは Owner / Editor / Viewer を前提とする**
- **外部公開は SNS共有カードのみ**
- **本番フロントエンドは Expo + EAS Build で配布する**

---

## 3. Firebase SDK構成

### 3.1 必須 SDK

Expo アプリ側で利用する Firebase SDK は以下を基本とします。

| SDK | 用途 |
|---|---|
| `firebase/app` | Firebase 初期化 |
| `firebase/auth` | 認証 |
| `firebase/firestore` | ノート・ユーザー・権限・メタデータ管理 |
| `firebase/storage` | 写真アップロード、共有カード保存 |
| `firebase/functions` | Cloud Functions 呼び出し |

### 3.2 推奨補助ライブラリ

| ライブラリ | 用途 |
|---|---|
| `expo-router` | ルーティング |
| `expo-image-picker` | 写真選択 |
| `expo-file-system` | 端末ファイル操作 |
| `expo-image-manipulator` | 画像圧縮・リサイズ |
| `expo-secure-store` | トークンや一時情報の安全保存 |
| `@react-native-async-storage/async-storage` | ローカルキャッシュ |
| `@tanstack/react-query` | サーバ状態管理 |
| `zustand` または `Context` | 軽量状態管理 |

### 3.3 SDK採用方針

| 項目 | 方針 |
|---|---|
| Firebase SDK | Web SDK ベースを優先 |
| 画像選択 | Expo 標準の ImagePicker を優先 |
| 画像圧縮 | アップロード前に端末側で実施 |
| Functions 呼び出し | callable functions を基本 |
| 認証状態 | Firebase Auth の永続化を利用 |
| ローカル保存 | 必要最小限のみ |

### 3.4 ディレクトリ例

```text
src/
  app/                    # Expo Router
  components/
  features/
    auth/
    notes/
    photos/
    share/
    settings/
  lib/
    firebase/
    api/
    storage/
    logger/
  repositories/
  hooks/
  types/
  utils/
```

---

## 4. ExpoでのFirebase初期化

### 4.1 初期化方針

Firebase 初期化は 1 箇所に集約します。

- `firebase/app` で `initializeApp`
- `firebase/auth`, `firebase/firestore`, `firebase/storage`, `firebase/functions` を同一アプリインスタンスから生成
- 環境ごとに設定を切り替える
- 初期化前に二重生成しない

### 4.2 初期化ファイル例

```ts
// src/lib/firebase/index.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export { app };
```

### 4.3 注意点

- Expo の `process.env` は **app.config.ts / 環境変数** と連携させる
- `EXPO_PUBLIC_` 付き変数はクライアントへ公開されるため、**秘密情報を入れない**
- Firebase の API キーは公開設定値であり、**秘密鍵ではない**
- ただし、**OpenAI の秘密鍵は絶対に入れない**

---

## 5. 環境分離

### 5.1 環境区分

Release v1 では以下を分離します。

| 環境 | 用途 |
|---|---|
| development | ローカル開発・検証 |
| staging | QA・ストア提出前確認 |
| production | 本番公開 |

### 5.2 推奨構成

Firebase プロジェクトも環境ごとに分けます。

| 環境 | Firebase Project |
|---|---|
| development | `memory-note-app-dev` |
| staging | `memory-note-app-stg` |
| production | `memory-note-app-prod` |

### 5.3 .env 設計

例:

```text
.env.development
.env.staging
.env.production
```

サンプル:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_FIREBASE_API_KEY=xxxxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=memory-note-app-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=memory-note-app-dev.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxxxx
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION=asia-northeast1
```

### 5.4 app.config.ts

`app.config.ts` で環境変数を読み込みます。

```ts
// app.config.ts
export default ({ config }) => ({
  ...config,
  name: 'Memory Note App',
  slug: 'memory-note-app',
  extra: {
    appEnv: process.env.EXPO_PUBLIC_APP_ENV,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  },
});
```

### 5.5 運用ルール

- development と production の Firebase 設定を混在させない
- staging は本番同等の Rules / Functions を検証する場にする
- 誤接続防止のため、起動時に環境名を表示してもよい
- `app.config.ts` と `.env` の整合を CI で確認する

---

## 6. Auth接続

### 6.1 対象認証方式

Release v1 では以下を接続します。

| 認証方式 | 対応 |
|---|---|
| Email / Password | 対応 |
| Google | 対応 |
| Apple | 対応 |
| 匿名ログイン | 非対応 |

### 6.2 実装方針

- Firebase Auth を唯一の認証基盤とする
- ログイン状態は Auth が保持する
- 画面制御は `onAuthStateChanged` で行う
- 認証済みでない場合はオンボーディングまたはログインへ遷移する

### 6.3 認証フロー

1. アプリ起動
2. Firebase 初期化
3. Auth 状態監視開始
4. 未ログインならログイン画面
5. ログイン成功後、ユーザープロフィール取得
6. ホームへ遷移

### 6.4 実装注意

- パスワードやトークンをログに出さない
- 認証失敗時はユーザーに分かる文言を返す
- 再ログイン時は既存プロフィールを Firestore から復元する
- アカウント削除済みユーザーは `status=deleted` を確認して扱う

### 6.5 認証状態監視の例

```ts
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

onAuthStateChanged(auth, (user) => {
  if (user) {
    // signed in
  } else {
    // signed out
  }
});
```

---

## 7. Firestore接続

### 7.1 接続対象

Firestore は以下を扱います。

- `users`
- `memory_notes`
- `members`
- `photos`
- `place_groups`
- `ai_results`
- `share_cards`
- `invitations`
- `notifications`
- `user_note_index`
- `app_settings`
- `usage_limits`
- `audit_logs`

### 7.2 接続方針

- ノート一覧は `memory_notes` から取得
- 参加メンバーは `memory_notes/{noteId}/members` から取得
- 写真は `memory_notes/{noteId}/photos` に紐づける
- AI結果はクライアントが直接書かず、Functions 経由で保存する
- `audit_logs` はクライアントから書かない

### 7.3 Firestore利用原則

| 項目 | 方針 |
|---|---|
| 読み取り | membership ベース |
| 書き込み | role ベース |
| 一覧 | index 用冗長フィールドを利用 |
| 検索 | 必要に応じて簡易検索 or index 併用 |
| 削除 | 論理削除 + Functions 連鎖処理 |

### 7.4 典型コード例

```ts
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const fetchMyNotes = async (userId: string) => {
  const q = query(
    collection(db, 'memory_notes'),
    where('memberUserIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
```

### 7.5 注意

- `array-contains` に依存しすぎず、Security Rules との整合を取る
- 実際のアクセス制御は Rules で担保する
- 画面上で見えても Rules で拒否される可能性を前提にする
- 大きなノート一覧は `user_note_index` を使って最適化する

---

## 8. Storage接続

### 8.1 対象ファイル

Firebase Storage では以下を扱います。

- 写真の圧縮画像
- サムネイル
- SNS共有カード画像
- 必要に応じた一時生成ファイル

### 8.2 保存方針

| 種類 | 保存可否 |
|---|---|
| 原本画像 | 原則保存しない |
| 圧縮画像 | 保存する |
| サムネイル | 保存する |
| 共有カード | 保存する |
| 一時ファイル | Functions またはクリーンアップで削除 |

### 8.3 アップロード方針

- アップロード前に端末側で圧縮する
- ユーザーが選択した写真のみ送信する
- GPS などの機微情報は必要最小限のみ扱う
- アップロード進捗を UI に表示する
- 失敗時は再試行可能にする

### 8.4 パス例

```text
notes/{noteId}/photos/{photoId}/compressed.jpg
notes/{noteId}/photos/{photoId}/thumbnail.jpg
notes/{noteId}/share_cards/{shareCardId}/card_1x1.png
notes/{noteId}/share_cards/{shareCardId}/card_4x5.png
notes/{noteId}/share_cards/{shareCardId}/card_9x16.png
```

### 8.5 実装注意

- Storage URL を UI に直接ベタ書きしない
- アクセスは Rules 前提
- 削除時は Firestore と Storage の両方を整合させる
- 外部共有用画像はプレビュー確認後に生成する

---

## 9. Cloud Functions接続

### 9.1 接続方針

Cloud Functions は以下の役割を担当します。

- AI生成
- 招待作成 / 受諾
- ノート削除
- 写真削除
- 共有カード生成
- Owner移譲
- Usage limit 管理

### 9.2 呼び出し方式

- 基本は callable functions
- 認証情報を自動で扱いやすいため
- 入力検証と権限チェックは Functions 側で行う

### 9.3 クライアントから呼ぶ想定の例

- `generateTitle`
- `generateDiary`
- `generateSummary`
- `generateShareCard`
- `createInvitation`
- `acceptInvitation`
- `deleteNote`
- `deletePhoto`
- `transferOwner`
- `leaveNote`

### 9.4 呼び出し例

```ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export const generateTitle = httpsCallable(functions, 'generateTitle');
```

### 9.5 注意

- Functions の戻り値は必ず型を揃える
- 失敗時のエラーコードを UI で解釈できるようにする
- 破壊的操作はクライアント直書きにしない
- 監査ログは Functions 側で残す

---

## 10. OpenAI APIの扱い

### 10.1 絶対ルール

- **OpenAI API キーをモバイルアプリに入れない**
- **OpenAI 呼び出しは Cloud Functions のみ**
- **写真本体や精密GPSを AI に直接送らない**
- **クライアントから OpenAI を直接叩かない**

### 10.2 送るべき情報

AI へ送るのは原則以下です。

- タイトル案生成に必要なメタ情報
- 日付
- 場所名
- スポット数
- 写真枚数
- 短いユーザーメモ
- 画像から抽出した軽量メタデータ

### 10.3 送らない情報

- APIキー
- 生画像の無制限送信
- 精密GPS
- 認証トークン
- 招待秘密情報
- 必要のない個人情報

### 10.4 実装位置

```text
Expo App
  → Firebase callable function
    → Cloud Functions
      → OpenAI API
```

### 10.5 例外禁止

- モバイルから OpenAI SDK を直接呼ぶ実装は禁止
- ローカルにシークレットを置く実装は禁止
- デバッグ時でも本番キーを置くべきではない

---

## 11. Repository設計

### 11.1 方針

Firebase 直接呼び出しは UI から散らさず、Repository に集約します。

### 11.2 推奨構成

```text
repositories/
  auth_repository.ts
  user_repository.ts
  note_repository.ts
  photo_repository.ts
  share_repository.ts
  card_repository.ts
  settings_repository.ts
  function_repository.ts
```

### 11.3 責務

| Repository | 責務 |
|---|---|
| auth_repository | ログイン、ログアウト、認証状態監視 |
| user_repository | プロフィール取得・更新 |
| note_repository | ノート取得・保存・編集 |
| photo_repository | 写真アップロード、削除、メタデータ管理 |
| share_repository | 招待、メンバー管理、離脱 |
| card_repository | SNS共有カード生成、保存、取得 |
| settings_repository | 設定、権限説明、利用規約参照 |
| function_repository | callable functions の共通ラッパー |

### 11.4 実装方針

- UI から `firebase_*` を直接叩かない
- Repository で DTO と Domain を変換する
- エラー整形も Repository で吸収する
- テストしやすいように interface を切る

### 11.5 例

```ts
export interface NoteRepository {
  fetchMyNotes(userId: string): Promise<Note[]>;
  saveNote(input: SaveNoteInput): Promise<Note>;
  deleteNote(noteId: string): Promise<void>;
}
```

---

## 12. Error Handling

### 12.1 エラー方針

ユーザーに出すエラーは、技術エラーではなく **行動可能な文言** に変換します。

### 12.2 主なエラー分類

| 種類 | 例 |
|---|---|
| 認証エラー | ログイン期限切れ |
| 権限エラー | Viewer が編集しようとした |
| 入力エラー | 必須項目未入力 |
| 通信エラー | オフライン、タイムアウト |
| 生成エラー | AI 失敗 |
| 保存エラー | Firestore / Storage 失敗 |
| 削除エラー | 削除権限なし、連鎖失敗 |

### 12.3 UIメッセージ方針

- 短く、何が起きたか分かる
- 次に何をすればよいかを示す
- 同じ文言で復旧できるなら再試行ボタンを出す

### 12.4 エラーコード例

| code | 表示例 |
|---|---|
| `permission-denied` | この操作を行う権限がありません。 |
| `unauthenticated` | 再度ログインしてください。 |
| `network-request-failed` | 通信に失敗しました。接続を確認してください。 |
| `storage-failed` | 写真の保存に失敗しました。再試行してください。 |
| `ai-failed` | 文章の自動生成に失敗しました。 |
| `not-found` | 対象データが見つかりません。 |

---

## 13. Loading / Empty states

### 13.1 Loading

以下のタイミングでは必ず loading を設計します。

- 認証状態確認中
- ノート一覧取得中
- ノート詳細取得中
- 写真アップロード中
- AI生成中
- 共有カード生成中
- 招待受諾中

### 13.2 Empty state

空状態は画面ごとに意味を持たせます。

| 状態 | 例 |
|---|---|
| ノートなし | 最初の思い出を作ろう |
| 写真なし | 写真を追加するとノートになります |
| 共有メンバーなし | まだ招待されていません |
| 検索結果なし | 条件を変えて探してください |
| オフライン | 通信がありません。再接続してください |

### 13.3 実装注意

- 読み込み中に空状態を誤表示しない
- ボタン連打を防ぐ
- 成功したら loading を必ず解除する
- 失敗時のリトライ導線を用意する

---

## 14. Offline / Cache方針

### 14.1 方針

Release v1 では **完全オフライン対応を必須にしない** ですが、最低限のキャッシュは入れます。

### 14.2 キャッシュ対象

- ログイン済みユーザー情報
- 最近見たノート一覧
- ノート詳細の表示キャッシュ
- 直近のアップロード状態
- 共有カードの生成結果メタデータ

### 14.3 キャッシュ手段

| 用途 | 手段 |
|---|---|
| 一時状態 | React state / Zustand |
| 軽量永続化 | AsyncStorage |
| 機微情報 | SecureStore |
| サーバ状態キャッシュ | React Query |

### 14.4 方針

- キャッシュは補助であり、正は Firestore
- オフライン編集の競合解決は v1 では簡略化する
- 再接続時に最新状態へ同期する
- 写真アップロードはオフライン時は待機または失敗表示にする

---

## 15. セキュリティ注意

### 15.1 絶対禁止

- OpenAI API キーをアプリに入れる
- Firebase Admin SDK をアプリに入れる
- 権限判定を UI のみで行う
- ノート本文を公開URLで配る
- 精密位置情報を無制限に外部公開する
- 招待トークンをログに出す
- 個人情報を Analytics にそのまま送る

### 15.2 実装上の注意

- 認証済みでも権限なしは拒否する
- `App Check` は導入検討対象としてよい
- エラーオブジェクトに秘密情報を含めない
- 画像 URL の取り扱いは限定する
- クラッシュログに個人情報を載せない

### 15.3 Firebase Rulesとの整合

- クライアントができることは Rules で本当に許可されていることだけ
- 画面上の表示制御は補助
- 書き込み系は必ず role 判定を通す

---

## 16. Emulator接続

### 16.1 目的

ローカル環境で以下を検証できるようにします。

- Auth
- Firestore
- Storage
- Functions
- Rules
- 招待、削除、共同編集の動作

### 16.2 接続方針

development 環境では、条件に応じて Emulator を使います。

### 16.3 推奨構成

- Auth Emulator
- Firestore Emulator
- Storage Emulator
- Functions Emulator

### 16.4 Expo 側の接続例

```ts
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { connectFunctionsEmulator } from 'firebase/functions';

if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

### 16.5 注意

- 実機・Expo Go・開発ビルドで localhost の扱いが異なる
- 必要に応じて PC の LAN IP を使う
- 本番設定と混線しないよう環境を明示する

---

## 17. テスト観点

### 17.1 認証

- メール登録が成功する
- Google ログインが成功する
- Apple ログインが成功する
- ログアウト後に保護画面へ入れない

### 17.2 Firestore

- 自分のノートだけ読める
- 他人のノートを読めない
- Viewer は編集できない
- Editor はノート編集できる
- Owner のみ削除できる

### 17.3 Storage

- 選択した写真だけアップロードされる
- 圧縮画像が保存される
- サムネイルが保存される
- 権限外の画像にアクセスできない

### 17.4 Functions

- AI生成が Cloud Functions 経由で動く
- 招待作成が成功する
- 招待受諾が成功する
- 削除連鎖が壊れない
- 共有カードが生成される

### 17.5 環境分離

- development が staging / production を汚染しない
- staging から production に誤接続しない
- app.config.ts が正しい projectId を返す

### 17.6 セキュリティ

- OpenAI キーがアプリに存在しない
- Admin SDK がアプリに存在しない
- Rules で拒否されるケースが UI でも崩れない
- エラーメッセージに秘密情報が出ない

---

## 18. 未決定事項

以下は実装時に別途決めるべき事項です。

| 項目 | 状態 |
|---|---|
| Firebase の App Check 導入範囲 | 未決定 |
| React Query の採用範囲 | 未決定 |
| オフライン編集の正式サポート範囲 | 未決定 |
| SNS共有カードの画像生成を端末側に寄せるか | 未決定 |
| Functions region の最終固定 | 未決定 |
| 端末保存先のUX | 未決定 |
| deep link / invitation link の形式 | 未決定 |
| push notification の採用 | 未決定 |
| EAS Build の開発・本番分岐詳細 | 未決定 |

必要であれば次に、これをもとに **`app.config.ts` の実装例**、**Firebase 初期化コード一式**、**Expo Router の画面遷移設計**、または **Repository インターフェース定義** まで続けて作成できます。