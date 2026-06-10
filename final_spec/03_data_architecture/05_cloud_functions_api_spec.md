# Cloud Functions API Spec v1

## 1. 目的

本仕様は、**Memory Note App / 思い出ノートアプリ** の Release v1 を支える Cloud Functions API を定義するものです。  
目的は以下です。

- 写真を起点に思い出ノートを自動生成する
- 共有ノート、共同編集、SNS共有カードを本番運用できるようにする
- OpenAI API を **Cloud Functions 経由のみ** で利用する
- Firestore / Storage / 権限 / Usage Limit をサーバ側で確実に制御する
- 機微情報をログやAI送信に残さない
- React Native / Expo アプリから直接危険な処理を行わせない

---

## 2. 基本方針

### 2.1 API設計方針

- **callable functions中心**
  - Expo / React Native から呼びやすく、認証情報を標準で扱いやすいため
- **Firebase Auth 必須**
  - `request.auth.uid` を前提に認可判定する
- **OpenAI APIキーは Functions 側のみ**
  - モバイルアプリに埋め込まない
- **Firestore 権限確認を必須化**
  - 画面側制御だけに依存しない
- **Usage Limit 確認を必須化**
  - AI生成・共有カード生成などのコストを制御
- **機微情報をログに残さない**
  - 写真本体、精密GPS、認証トークン、招待秘密情報はログ禁止
- **Firestore / Storage の整合性を意識**
  - ノート削除、写真削除は両方の削除を考慮
- **AIへ写真本体と精密GPSは原則送らない**
  - 送るのは日時、場所名、写真枚数、スポット数、要約メモ中心
- **generateShareCard は Cloud Functions 生成推奨**
  - 端末差分を減らし、品質と監査性を上げる

### 2.2 実行前チェック

各 Function では原則として以下を確認する。

1. 認証済みか
2. 対象ノートに対する権限があるか
3. 入力が妥当か
4. Usage Limit を超えていないか
5. 対象データが存在するか
6. 削除済み・無効状態ではないか

---

## 3. Functions一覧

| Function | 種別 | 認証 | 主な用途 | 呼び出し元 |
|---|---|---|---|---|
| `generateTitle` | callable | 必須 | AIでタイトル案を生成 | Expo App |
| `generateDiary` | callable | 必須 | AIで短文日記案を生成 | Expo App |
| `generateSummary` | callable | 必須 | AIでノート要約を生成 | Expo App |
| `generateFallback` | callable | 必須 | AI失敗時の代替文生成 | Expo App / 内部 |
| `uploadPhotoFinalize` | callable | 必須 | アップロード完了後の登録確定 | Expo App |
| `generateThumbnail` | callable / internal | 必須 | サムネイル生成 | Expo App / Storage Trigger 代替 |
| `generateShareCard` | callable | 必須 | SNS共有カード生成 | Expo App |
| `createInvitation` | callable | 必須 | 招待作成 | Expo App |
| `acceptInvitation` | callable | 必須 | 招待受諾 | Expo App |
| `revokeInvitation` | callable | 必須 | 招待取り消し | Expo App |
| `deleteNote` | callable | 必須 | ノート削除（ソフト削除） | Expo App |
| `deletePhoto` | callable | 必須 | 写真削除 | Expo App |
| `transferOwner` | callable | 必須 | Owner移譲 | Expo App |
| `leaveNote` | callable | 必須 | 共有ノート離脱 | Expo App |
| `enforceUsageLimit` | callable / internal | 必須 | 回数制限チェック | 他Function内 |

### 補足
- `generateThumbnail` は実装上、**クライアント側で生成→Functionsで確定登録** でもよい
- `enforceUsageLimit` は単独で呼ぶより、各 Function 内で共通利用する想定
- 将来は一部を Firestore Trigger に寄せてもよいが、Release v1 では callable 中心で統一する

---

## 4. 共通Request/Response形式

## 4.1 共通Request

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios | android",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {}
}
```

### 共通フィールド
- `requestId`
  - リトライ判定や監査用
- `clientVersion`
  - 不正バージョン制御や互換性判定に利用
- `platform`
  - 分析・不具合切り分け用
- `locale`
  - 日本語前提だが将来拡張に備える
- `timezone`
  - 日付生成・表示の基準
- `payload`
  - Function 個別の入力

## 4.2 共通Response

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z",
    "usage": {
      "remaining": 12,
      "limit": 20
    }
  }
}
```

### エラーResponse例

```json
{
  "success": false,
  "error": {
    "code": "permission-denied",
    "message": "この操作を実行する権限がありません。",
    "details": {}
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

---

## 5. 共通エラーコード

| code | 意味 | 典型原因 |
|---|---|---|
| `unauthenticated` | 未認証 | ログイン前呼び出し |
| `permission-denied` | 権限不足 | Viewer が編集操作、他人ノート操作 |
| `invalid-argument` | 入力不正 | 必須値欠落、形式不正 |
| `not-found` | 対象なし | noteId / photoId 不在 |
| `rate-limited` | 制限超過 | AI回数、招待発行回数など |
| `storage-failed` | Storage失敗 | アップロード、削除、生成失敗 |
| `ai-timeout` | AIタイムアウト | OpenAI応答遅延 |
| `ai-failed` | AI失敗 | OpenAIエラー、整形失敗 |
| `map-failed` | 地図処理失敗 | ジオコーディング失敗 |
| `internal` | 内部エラー | 想定外例外 |

---

## 6. `generateTitle` API

### 6.1 purpose
ノートのメタデータから、**短く自然なタイトル案** を生成する。

### 6.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "titleStyle": "natural | casual | cute | simple",
    "date": "2026-06-07",
    "timeOfDay": "昼",
    "placeName": "鎌倉",
    "areaName": "神奈川県",
    "photoCount": 14,
    "spotCount": 4,
    "tags": ["travel", "cafe"],
    "userMemoSummary": "海沿いを散歩してカフェに寄った",
    "existingTitle": null
  }
}
```

### 6.3 response schema

```json
{
  "success": true,
  "data": {
    "title": "鎌倉の海とカフェ巡り",
    "alternatives": [
      "鎌倉おでかけ日和",
      "海沿いを歩いた一日"
    ],
    "style": "natural",
    "confidence": 0.82
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z",
    "usage": {
      "remaining": 11,
      "limit": 20
    }
  }
}
```

### 6.4 validation
- `noteId` 必須
- `date` 必須
- `placeName` か `areaName` のどちらかは必要
- `photoCount` は 0 以上
- `spotCount` は 0 以上
- タイトルに個人情報や住所が入らないよう整形
- `existingTitle` がある場合は再生成用途として扱う

### 6.5 permission check
- 認証必須
- 対象ノートの `Owner` または `Editor` のみ実行可
- `Viewer` は不可

### 6.6 usage limit
- `generateTitle` は日次制限対象
- 例: ユーザー単位、ノート単位で上限管理
- `enforceUsageLimit("ai_generate")` を事前実行

### 6.7 Firestore read/write
#### read
- `memory_notes/{noteId}`
- `memory_notes/{noteId}/members/{uid}`
- 必要なら `photos` 集約値

#### write
- `memory_notes/{noteId}`
  - `title`
  - `aiTitleGenerated`
  - `updatedAt`
- `memory_notes/{noteId}/ai_results/{aiResultId}`

### 6.8 error handling
- `permission-denied`
- `not-found`
- `rate-limited`
- `ai-timeout`
- `ai-failed`
- `internal`

---

## 7. `generateDiary` API

### 7.1 purpose
写真とメタデータから、**短文の日記ドラフト** を生成する。

### 7.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "android",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "date": "2026-06-07",
    "timeOfDay": "昼〜夕方",
    "placeName": "鎌倉",
    "areaName": "神奈川県",
    "photoCount": 14,
    "spotCount": 4,
    "spotOrder": ["駅前", "海岸", "カフェ", "神社"],
    "tags": ["travel", "friend"],
    "userMemoSummary": "海がきれいで、最後のカフェが落ち着いた",
    "tone": "やさしく自然",
    "lengthPreference": "2〜4文"
  }
}
```

### 7.3 response schema

```json
{
  "success": true,
  "data": {
    "diary": "鎌倉をのんびり散歩した一日。海沿いを歩いて、カフェでひと休みして、最後は神社にも立ち寄りました。写真を見返すだけで、ゆったりした時間が思い出されます。",
    "alternatives": [
      "鎌倉をゆっくり巡った日。海とカフェと神社で、心地よい時間が流れました。"
    ],
    "tone": "やさしく自然"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 7.4 validation
- `noteId` 必須
- `spotOrder` は空でも可だが、ある場合は順序を尊重
- 住所や精密座標は受け取らない
- 文章が長くなりすぎないよう制御
- 事実断定しすぎないドラフト表現にする

### 7.5 permission check
- 認証必須
- `Owner` / `Editor` のみ実行可

### 7.6 usage limit
- AI共通制限を使用
- ノート単位での連続再生成を抑制

### 7.7 Firestore read/write
#### read
- `memory_notes/{noteId}`
- `memory_notes/{noteId}/members/{uid}`
- `memory_notes/{noteId}/place_groups`

#### write
- `memory_notes/{noteId}/ai_results/{aiResultId}`
- 必要に応じて `memory_notes/{noteId}.summary`

### 7.8 error handling
- `ai-timeout`
- `ai-failed`
- `permission-denied`
- `rate-limited`

---

## 8. `generateSummary` API

### 8.1 purpose
ノートの一覧表示や共有補助に使う、**短い要約** を生成する。

### 8.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "title": "鎌倉の海とカフェ巡り",
    "date": "2026-06-07",
    "placeName": "鎌倉",
    "photoCount": 14,
    "spotCount": 4,
    "userMemoSummary": "海沿いを歩いて、カフェに寄った",
    "tags": ["travel", "cafe"]
  }
}
```

### 8.3 response schema

```json
{
  "success": true,
  "data": {
    "summary": "鎌倉で海沿いを散歩し、カフェや神社を巡った一日。",
    "keywords": ["鎌倉", "海", "カフェ", "散歩"],
    "shortCaption": "海とカフェの、ゆったり鎌倉さんぽ"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 8.4 validation
- 主要フィールドは最小限で可
- タイトルなしでも生成可能
- 外部共有を前提にしない文面とする

### 8.5 permission check
- 認証必須
- `Owner` / `Editor` のみ実行可

### 8.6 Firestore read/write
- read: `memory_notes/{noteId}`
- write: `memory_notes/{noteId}/ai_results/{aiResultId}`

---

## 9. `generateFallback` API

### 9.1 purpose
AI失敗時に、**最低限成立する代替文** を返す。

### 9.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "type": "title | diary | summary",
    "date": "2026-06-07",
    "placeName": "鎌倉",
    "photoCount": 14,
    "spotCount": 4
  }
}
```

### 9.3 response schema

```json
{
  "success": true,
  "data": {
    "title": "2026.06.07 鎌倉の思い出",
    "diary": "鎌倉で過ごした一日を記録しました。",
    "summary": "鎌倉での思い出をまとめたノートです。"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 9.4 validation
- `type` 必須
- `noteId` 必須

### 9.5 permission check
- 認証必須
- 呼び出し元が対象ノートにアクセスできること

### 9.6 usage limit
- フォールバックは低コストだが、不正連打防止のため簡易制限あり

### 9.7 Firestore read/write
- write: `ai_results` に fallback 記録してもよい

---

## 10. `uploadPhotoFinalize` API

### 10.1 purpose
写真アップロード後に、**Firestore 登録を確定** し、ノートへの紐付けを完了する。

### 10.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "android",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "photoId": "photo_001",
    "storagePath": "memory_notes/note_123/compressed/photo_001.jpg",
    "thumbnailPath": "memory_notes/note_123/thumbnails/photo_001.jpg",
    "takenAt": "2026-06-07T03:30:00Z",
    "hasExif": true,
    "hasGps": true,
    "gpsLat": 35.658,
    "gpsLng": 139.745,
    "placeName": "渋谷",
    "locationVisibility": "city",
    "fileSize": 123456
  }
}
```

### 10.3 response schema

```json
{
  "success": true,
  "data": {
    "photoId": "photo_001",
    "status": "active",
    "sortOrder": 1
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 10.4 validation
- `noteId`, `photoId`, `storagePath`, `thumbnailPath` 必須
- `storagePath` は対象 note 配下のみ許可
- `gpsLat/gpsLng` は内部利用だが、原則精密座標をAI送信しない
- 既に存在する `photoId` は冪等処理にする

### 10.5 permission check
- `Owner` / `Editor` のみ
- Viewer は不可

### 10.6 usage limit
- 写真数の異常増加を抑制するため、1ノートあたりの上限チェックを推奨

### 10.7 Firestore read/write
#### read
- `memory_notes/{noteId}`
- `memory_notes/{noteId}/members/{uid}`
- 既存 `photos/{photoId}` の有無

#### write
- `memory_notes/{noteId}/photos/{photoId}`
- `memory_notes/{noteId}`
  - `totalPhotoCount`
  - `updatedAt`
  - `lastEditedBy`

---

## 11. `generateThumbnail` API

### 11.1 purpose
アップロード済み写真から、**一覧表示用のサムネイル** を生成する。

### 11.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "photoId": "photo_001",
    "sourceStoragePath": "memory_notes/note_123/compressed/photo_001.jpg",
    "targetStoragePath": "memory_notes/note_123/thumbnails/photo_001.jpg",
    "size": 512
  }
}
```

### 11.3 response schema

```json
{
  "success": true,
  "data": {
    "thumbnailPath": "memory_notes/note_123/thumbnails/photo_001.jpg",
    "width": 512,
    "height": 512
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 11.4 validation
- `noteId`, `photoId`, `sourceStoragePath`, `targetStoragePath` 必須
- 対象ノート配下のみ許可
- すでに存在する場合は再生成の可否を冪等に扱う

### 11.5 permission check
- `Owner` / `Editor` のみ
- 内部呼び出しの場合は `uploadPhotoFinalize` から連携可能

### 11.6 usage limit
- 画像処理回数の制限対象に含める

### 11.7 Firestore read/write
- 直接更新は最小限
- `photos/{photoId}` の `thumbnailPath` を更新してもよい

### 11.8 error handling
- `storage-failed`
- `not-found`
- `permission-denied`
- `internal`

---

## 12. `generateShareCard` API

### 12.1 purpose
ノートを外部共有向けの画像に変換し、**SNS共有カード** を生成する。

### 12.2 重要方針
- **Cloud Functions 側で生成推奨**
- **プレビュー必須**
- **位置情報はぼかす、または地名のみ表示**
- **ノートの直接公開URLは作らない**
- **生成物は share_cards ドキュメントに記録する**

### 12.3 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "format": "square | feed | story",
    "template": "photo-first | map-first | diary-first",
    "locationVisibility": "hidden | city | area | exact",
    "includeBranding": true,
    "previewOnly": true,
    "coverPhotoId": "photo_001",
    "title": "鎌倉の海とカフェ巡り",
    "diary": "鎌倉をのんびり散歩した一日。",
    "date": "2026-06-07",
    "placeName": "鎌倉",
    "photoCount": 14,
    "spotCount": 4
  }
}
```

### 12.4 response schema

```json
{
  "success": true,
  "data": {
    "shareCardId": "sharecard_001",
    "previewUrl": "gs://.../previews/sharecard_001.jpg",
    "imageUrls": {
      "square": "gs://.../share_cards/sharecard_001/square.jpg",
      "feed": "gs://.../share_cards/sharecard_001/feed.jpg",
      "story": "gs://.../share_cards/sharecard_001/story.jpg"
    },
    "status": "previewed | generated",
    "template": "photo-first",
    "locationVisibility": "city"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 12.5 validation
- `noteId` 必須
- `format` は `square | feed | story`
- `template` は `photo-first | map-first | diary-first`
- `previewOnly=true` の場合はプレビュー用生成のみ
- 生成前に必ず `preview required` を満たす
- `locationVisibility` はデフォルトで `city` または `area`
- 精密座標はカード上に表示しない

### 12.6 permission check
- `Owner` / `Editor` / `Viewer` いずれも可
- ただし、対象ノートのメンバーであることが前提
- 外部共有向け保存はプレビュー確認後のみ確定

### 12.7 usage limit
- 画像生成コストが高いため、厳格に制限
- フォーマットごと、テンプレートごとに再生成回数制御推奨

### 12.8 Firestore read/write
#### read
- `memory_notes/{noteId}`
- `memory_notes/{noteId}/members/{uid}`
- `memory_notes/{noteId}/photos`
- `memory_notes/{noteId}/place_groups`
- `memory_notes/{noteId}/ai_results`

#### write
- `memory_notes/{noteId}/share_cards/{shareCardId}`
- 必要なら `memory_notes/{noteId}`
  - `lastSharedAt`
  - `updatedAt`

### 12.9 Storage path
```text
memory_notes/{noteId}/share_cards/{shareCardId}/square.jpg
memory_notes/{noteId}/share_cards/{shareCardId}/feed.jpg
memory_notes/{noteId}/share_cards/{shareCardId}/story.jpg
memory_notes/{noteId}/previews/{shareCardId}.jpg
```

### 12.10 share_cards document
```json
{
  "shareCardId": "sharecard_001",
  "noteId": "note_123",
  "createdBy": "user_001",
  "format": "square",
  "template": "photo-first",
  "locationVisibility": "city",
  "previewStatus": "required | completed",
  "storagePaths": {
    "square": "memory_notes/note_123/share_cards/sharecard_001/square.jpg",
    "feed": "memory_notes/note_123/share_cards/sharecard_001/feed.jpg",
    "story": "memory_notes/note_123/share_cards/sharecard_001/story.jpg"
  },
  "createdAt": "2026-06-07T10:00:00Z",
  "updatedAt": "2026-06-07T10:05:00Z",
  "status": "active | deleted"
}
```

### 12.11 テンプレート詳細
#### photo-first
- 写真を主役にする
- Instagram / 汎用共有向け
- 文字量は少なめ

#### map-first
- 地図・ルート感を強める
- 複数スポットの可視化に向く
- 見た目より文脈を優先

#### diary-first
- 短文日記を中心にする
- 記念日、デート、気持ち重視に向く

### 12.12 位置情報ぼかし
- `hidden`: 地図非表示
- `city`: 市区町村レベル
- `area`: エリア名レベル
- `exact`: 原則非推奨。明示操作時のみ検討

### 12.13 error handling
- `map-failed`
- `storage-failed`
- `permission-denied`
- `rate-limited`
- `internal`

---

## 13. `createInvitation` API

### 13.1 purpose
共有ノートへ参加するための**招待** を作成する。

### 13.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "inviteeEmail": "friend@example.com",
    "role": "editor | viewer",
    "expiresInHours": 72
  }
}
```

### 13.3 response schema

```json
{
  "success": true,
  "data": {
    "invitationId": "invite_001",
    "inviteToken": "opaque_random_token",
    "expiresAt": "2026-06-10T10:00:00Z",
    "status": "pending"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 13.4 validation
- `noteId` 必須
- `role` は `editor | viewer`
- `expiresInHours` は上限を設ける
- メール招待の場合、形式チェック必須
- 招待トークンは推測困難な乱数

### 13.5 permission check
- **Owner のみ**
- Editor / Viewer は不可

### 13.6 usage limit
- 招待作成回数に制限を設定
- 不正発行防止

### 13.7 Firestore read/write
#### read
- `memory_notes/{noteId}`
- `memory_notes/{noteId}/members/{uid}`

#### write
- `invitations/{invitationId}`
- `notifications/{notificationId}`（任意）
- `audit_logs/{logId}`

---

## 14. `acceptInvitation` API

### 14.1 purpose
招待されたユーザーが、招待を受諾して共有ノートに参加する。

### 14.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "android",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "inviteToken": "opaque_random_token"
  }
}
```

### 14.3 response schema

```json
{
  "success": true,
  "data": {
    "noteId": "note_123",
    "memberRole": "viewer",
    "memberStatus": "active"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 14.4 validation
- トークン必須
- 期限切れ不可
- 1回限り使用可推奨
- 招待対象ノートが存在すること

### 14.5 permission check
- 招待先ユーザー本人の認証必須
- 受諾後は `members/{uid}` に追加

### 14.6 Firestore read/write
#### read
- `invitations/{invitationId}`
- `memory_notes/{noteId}`

#### write
- `memory_notes/{noteId}/members/{uid}`
- `invitations/{invitationId}` `status=accepted`
- `user_note_index/{uid_noteId}`

---

## 15. `revokeInvitation` API

### 15.1 purpose
未参加の招待を取り消す。

### 15.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "invitationId": "invite_001"
  }
}
```

### 15.3 response schema

```json
{
  "success": true,
  "data": {
    "invitationId": "invite_001",
    "status": "revoked"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 15.4 permission check
- **Owner のみ**

### 15.5 Firestore read/write
- `invitations/{invitationId}` を `revoked` に更新
- 必要に応じて通知ログ作成

---

## 16. `deleteNote` API

### 16.1 purpose
ノートを **Owner のみ** が削除できるようにする。  
Release v1 では **ソフト削除** を基本とし、Firestore と Storage の整合を意識する。

### 16.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "confirmDelete": true
  }
}
```

### 16.3 response schema

```json
{
  "success": true,
  "data": {
    "noteId": "note_123",
    "status": "deleted",
    "deleteJobStatus": "pending"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 16.4 validation
- `noteId` 必須
- `confirmDelete=true` 必須
- 二段階確認済み前提
- 既に削除済みなら冪等に成功扱いでもよい

### 16.5 permission check
- **Owner のみ**
- Editor / Viewer は不可

### 16.6 soft delete
推奨フロー:
1. `memory_notes/{noteId}` を `status=deleted` に更新
2. `deletedAt`, `deletedBy` を設定
3. `deleteJobStatus=pending` にする
4. Storage / subcollections の削除ジョブを非同期実行
5. 完了後 `deleteJobStatus=done`

### 16.7 Firestore subcollections
削除対象:
- `members`
- `photos`
- `place_groups`
- `ai_results`
- `share_cards`

### 16.8 Storage paths
削除対象:
- `memory_notes/{noteId}/compressed/`
- `memory_notes/{noteId}/thumbnails/`
- `memory_notes/{noteId}/share_cards/`
- `memory_notes/{noteId}/previews/`
- `memory_notes/{noteId}/temp_uploads/`
- `memory_notes/{noteId}/originals/`（存在する場合）

### 16.9 retryable job
- 失敗時に再実行できるよう、`deleteJobStatus` を管理
- 削除ジョブは冪等にする
- Firestore と Storage のどちらかが失敗しても再試行可能にする

### 16.10 error handling
- `permission-denied`
- `not-found`
- `internal`
- `storage-failed`

---

## 17. `deletePhoto` API

### 17.1 purpose
ノート内の写真を削除し、**Firestore と Storage の双方** から整合的に消す。

### 17.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "android",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "photoId": "photo_001",
    "deleteFromStorage": true
  }
}
```

### 17.3 response schema

```json
{
  "success": true,
  "data": {
    "photoId": "photo_001",
    "status": "deleted"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 17.4 permission check
- `Owner` / `Editor` は可
- `Viewer` は不可

### 17.5 Firestore read/write
- `memory_notes/{noteId}/photos/{photoId}` を `deleted` に
- 必要なら `groupId` の再集計
- `memory_notes/{noteId}` の `totalPhotoCount` を更新

### 17.6 Storage paths
- `compressed/{photoId}`
- `thumbnails/{photoId}`
- 条件付きで `originals/{photoId}`

### 17.7 note
- UI上は「ノートから外す」意味と「Storage削除」を分離してよい
- Release v1 では、削除範囲を明確に表示すること

---

## 18. `transferOwner` API

### 18.1 purpose
共有ノートの Owner を別メンバーへ移譲する。

### 18.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123",
    "newOwnerUserId": "user_999"
  }
}
```

### 18.3 response schema

```json
{
  "success": true,
  "data": {
    "noteId": "note_123",
    "oldOwnerUserId": "user_001",
    "newOwnerUserId": "user_999",
    "status": "transferred"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 18.4 permission check
- **現Ownerのみ**
- 新Owner候補は既存メンバーであること
- `Editor` 以上を推奨

### 18.5 Firestore read/write
- `memory_notes/{noteId}`
- `memory_notes/{noteId}/members/{uid}` を更新
  - `role=owner`
  - 旧Ownerは `editor` か `viewer` へ変更

### 18.6 note
- Owner不在状態を作らない
- 旧Ownerが即離脱する場合は、移譲完了後に実施する

---

## 19. `leaveNote` API

### 19.1 purpose
メンバーが自分自身を共有ノートから離脱させる。

### 19.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "android",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "noteId": "note_123"
  }
}
```

### 19.3 response schema

```json
{
  "success": true,
  "data": {
    "noteId": "note_123",
    "status": "left"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 19.4 permission check
- 自分自身のみ離脱可能
- Owner の場合は **transferOwner 後のみ** 実行可

### 19.5 Firestore read/write
- `members/{uid}` を `left` に更新
- `user_note_index/{uid_noteId}` の削除/無効化
- `leftAt` を記録

---

## 20. `enforceUsageLimit` API

### 20.1 purpose
AI生成や共有カード生成などの**コスト発生処理** を制御する。

### 20.2 request schema

```json
{
  "requestId": "uuid",
  "clientVersion": "1.0.0",
  "platform": "ios",
  "locale": "ja-JP",
  "timezone": "Asia/Tokyo",
  "payload": {
    "feature": "ai_generate | share_card | invitation",
    "noteId": "note_123",
    "amount": 1
  }
}
```

### 20.3 response schema

```json
{
  "success": true,
  "data": {
    "allowed": true,
    "remaining": 11,
    "limit": 20,
    "resetAt": "2026-06-08T00:00:00Z"
  },
  "meta": {
    "requestId": "uuid",
    "generatedAt": "2026-06-07T10:00:00Z"
  }
}
```

### 20.4 validation
- `feature` 必須
- `amount` は 1 以上
- 日次 / 月次 / ノート単位のいずれかで管理可能

### 20.5 permission check
- 認証必須
- 対象 feature ごとの利用者制限を適用

### 20.6 Firestore read/write
- `usage_limits/{userId}`
- 必要に応じて `usage_limits/{userId}_{feature}`

### 20.7 note
- 各 Function 内でこのチェックを共通利用する
- 監査用途のため、閾値超過時も記録する

---

## 21. Firestore更新対象一覧

| Function | 主な更新対象 |
|---|---|
| `generateTitle` | `memory_notes/{noteId}`, `ai_results` |
| `generateDiary` | `memory_notes/{noteId}`, `ai_results` |
| `generateSummary` | `memory_notes/{noteId}`, `ai_results` |
| `generateFallback` | `ai_results`（任意） |
| `uploadPhotoFinalize` | `memory_notes/{noteId}/photos/{photoId}`,