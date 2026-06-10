# Data Model v2

## 1. 目的

本設計は、**Memory Note App / 思い出ノートアプリ** を Firebase / Firestore / Firebase Storage / Cloud Functions 前提で実装するための、実装者向けデータモデルです。

設計の主目的は以下です。

- 写真を起点に、地図付き思い出ノートを自動生成する
- 共有ノート、共同編集、SNS共有カードを成立させる
- Owner / Editor / Viewer の権限を Firestore Security Rules で扱えるようにする
- 位置情報・写真・AI生成結果の取り扱いを安全にする
- 将来の拡張に耐えつつ、MVP の複雑さを抑える

---

## 2. データ設計の前提

以下を前提にする。

- 認証: **Firebase Authentication**
- DB: **Cloud Firestore**
- 画像保存: **Firebase Storage**
- 非同期処理: **Cloud Functions**
- 分析: **Firebase Analytics / Crashlytics**
- AI生成: **Cloud Functions 経由で OpenAI API を利用**
- 画像保存方針: **圧縮画像 + サムネイル中心**
- 原本画像: **原則保存しない、または条件付き**
- 権限モデル: **Owner / Editor / Viewer**
- 公開共有: **なし**
- 外部公開: **SNS共有カードのみ**

### 設計原則
| 原則 | 内容 |
|---|---|
| 最小保存 | 必要なデータだけをFirestoreに保存する |
| 分離保存 | メタデータ、画像、共有カードを分ける |
| 共有単位明確化 | ノート単位で権限を閉じる |
| 削除完全性 | DB と Storage の両方を消す |
| 位置情報慎重 | 精密座標を外部公開しない |
| ルール実装可能 | Security Rules で判定しやすい構造にする |

---

## 3. Firestore Collection構成

### 3.1 コレクション一覧

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
- `app_settings`
- `audit_logs`
- `usage_limits`

### 3.2 推奨パス構造

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

---

## 4. Entity詳細

---

## 5. users

### 5.1 役割
ユーザー基本情報、プロフィール、利用状態を保持する。

### 5.2 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| userId | string | Yes | Firebase Auth UID | docId と同一 |
| displayName | string | Yes | 表示名 | 共有ノートで表示 |
| photoUrl | string | No | アイコンURL | Storage または外部URL |
| email | string | No | メールアドレス | Auth 側と冗長可 |
| authProviders | array<string> | Yes | `password`, `google.com`, `apple.com` 等 | 参照用 |
| locale | string | Yes | `ja-JP` など | 日本優先 |
| timezone | string | No | タイムゾーン | `Asia/Tokyo` など |
| createdAt | timestamp | Yes | 作成日時 | serverTimestamp |
| updatedAt | timestamp | Yes | 更新日時 | serverTimestamp |
| lastLoginAt | timestamp | No | 最終ログイン | 分析用 |
| status | string | Yes | `active`, `deleted`, `disabled` | 論理状態 |
| deletedAt | timestamp | No | 削除日時 | 退会時 |
| analyticsOptIn | boolean | Yes | 分析利用同意 | 初期値は要検討 |
| privacyAcceptedAt | timestamp | No | プライバシー同意日時 | 法務用 |
| termsAcceptedAt | timestamp | No | 利用規約同意日時 | 法務用 |

### 5.3 補足
- Auth の UID を主キーにする
- 退会時は `status=deleted` を基本
- 表示名は必須、アイコンは任意
- 外部公開プロフィールは作らない

---

## 6. memory_notes

### 6.1 役割
思い出ノートの本体。ノートの代表情報、公開状態、集約情報を持つ。

### 6.2 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| noteId | string | Yes | ノートID | docId と同一 |
| ownerUserId | string | Yes | Owner の userId | 権限判断の基準 |
| title | string | Yes | ノートタイトル | AI生成後に編集可 |
| subtitle | string | No | 補助タイトル | 任意 |
| summary | string | No | 短い要約 | SNSカードに利用可 |
| coverPhotoId | string | No | 表紙写真ID | photos 参照 |
| coverImageUrl | string | No | 表紙画像URL | 圧縮画像推奨 |
| noteDate | date | No | 代表日付 | 1日ノート中心 |
| startAt | timestamp | No | 開始時刻 | 旅行や日帰り用 |
| endAt | timestamp | No | 終了時刻 |  |
| totalPhotoCount | number | Yes | 写真総数 | 冗長集計 |
| totalSpotCount | number | Yes | スポット数 | 冗長集計 |
| totalMemberCount | number | Yes | 参加者数 | 冗長集計 |
| tags | array<string> | Yes | タグ配列 | 例: `travel`, `cafe` |
| status | string | Yes | `active`, `deleted`, `archived` |  |
| visibility | string | Yes | `private`, `shared` | 外部公開は無し |
| createdAt | timestamp | Yes | 作成日時 |  |
| updatedAt | timestamp | Yes | 更新日時 |  |
| lastEditedAt | timestamp | No | 最終編集日時 |  |
| lastEditedBy | string | No | 最終編集者 userId |  |
| aiTitleGenerated | boolean | Yes | AIタイトル利用有無 |  |
| aiDiaryGenerated | boolean | Yes | AI日記利用有無 |  |
| deletedAt | timestamp | No | 削除日時 | ソフト削除 |
| deletedBy | string | No | 削除者 userId |  |
| deleteJobStatus | string | No | `pending`, `processing`, `done`, `failed` | 削除処理管理 |

### 6.3 補足
- ノート一覧はこのコレクションで引く
- 集約値は検索・一覧高速化のため冗長保持する
- `visibility` は外部公開のためではなく、共有ノートか否かの区別に使う
- `deleted` は即時物理削除ではなくソフト削除前提

---

## 7. members

### 7.1 役割
共有ノート内のメンバー権限を保持する。

### 7.2 パス
`memory_notes/{noteId}/members/{userId}`

### 7.3 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| userId | string | Yes | メンバーの userId | docId と同一推奨 |
| noteId | string | Yes | 対象ノートID | 冗長保持 |
| role | string | Yes | `owner`, `editor`, `viewer` | 権限の中核 |
| status | string | Yes | `active`, `invited`, `left`, `removed` | 参加状態 |
| joinedAt | timestamp | No | 参加日時 | 受諾後 |
| invitedAt | timestamp | No | 招待日時 |  |
| invitedBy | string | No | 招待者 userId | owner だけ |
| leftAt | timestamp | No | 離脱日時 |  |
| removedAt | timestamp | No | 強制解除日時 |  |
| permissionUpdatedAt | timestamp | No | 権限変更日時 |  |
| displayNameSnapshot | string | No | 参加時の表示名スナップショット | 履歴表示用 |
| photoUrlSnapshot | string | No | 参加時のアイコンURL | 任意 |
| isOwner | boolean | Yes | Owner かどうか | ルール簡略化用 |

### 7.4 補足
- `role` と `isOwner` を併用してもよいが、どちらかに統一してもよい
- Firestore Rules ではこの membership を見て認可する
- 招待中は `status=invited`
- Viewer は閲覧のみ、Editor は編集可、Owner は管理可

---

## 8. photos

### 8.1 役割
ノートに紐づく写真のメタデータと Storage 参照を保持する。

### 8.2 パス
`memory_notes/{noteId}/photos/{photoId}`

### 8.3 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| photoId | string | Yes | 写真ID | docId と同一 |
| noteId | string | Yes | 対象ノートID |  |
| uploadedBy | string | Yes | アップロード者 userId |  |
| sourceType | string | Yes | `camera_roll`, `shared`, `imported` |  |
| originalFileName | string | No | 元ファイル名 | 原則不要 |
| storagePath | string | Yes | 圧縮画像の Storage パス | 必須 |
| thumbnailPath | string | Yes | サムネイルの Storage パス | 必須 |
| originalStoragePath | string | No | 原本の Storage パス | 条件付き |
| mimeType | string | Yes | 画像種別 |  |
| fileSize | number | Yes | 圧縮後サイズ |  |
| width | number | No | 画像幅 |  |
| height | number | No | 画像高さ |  |
| takenAt | timestamp | No | 撮影日時 | EXIF由来 |
| uploadedAt | timestamp | Yes | アップロード日時 |  |
| gpsLat | number | No | 緯度 | 内部限定 |
| gpsLng | number | No | 経度 | 内部限定 |
| gpsAccuracy | number | No | 精度 | 任意 |
| locationVisibility | string | Yes | `hidden`, `city`, `area`, `exact` | 外部表示制御用 |
| placeName | string | No | 推定場所名 | 施設名や地名 |
| placeId | string | No | 場所ID | 自前または外部参照 |
| exifOrientation | number | No | 向き | 表示補正用 |
| exifCapturedAt | timestamp | No | EXIF取得時刻 | 任意 |
| hasExif | boolean | Yes | EXIF有無 |  |
| hasGps | boolean | Yes | GPS有無 |  |
| sortOrder | number | Yes | 表示順 | 時系列順の補助 |
| groupId | string | No | 所属 place_group ID |  |
| isCover | boolean | Yes | 表紙かどうか |  |
| aiLabels | array<string> | No | AIラベル | 画像認識将来用 |
| status | string | Yes | `active`, `deleted`, `orphaned` |  |
| deletedAt | timestamp | No | 削除日時 |  |
| deletedBy | string | No | 削除者 |  |
| createdAt | timestamp | Yes | 作成日時 |  |
| updatedAt | timestamp | Yes | 更新日時 |  |

### 8.4 補足
- 圧縮画像とサムネイルは必須
- 原本画像は `originalStoragePath` がある場合のみ保存
- 外部公開では `gpsLat/gpsLng` を直接出さない
- `placeName` は逆ジオコーディング結果または手動修正値

---

## 9. place_groups

### 9.1 役割
近い時間・位置の写真をスポット単位でまとめる。

### 9.2 パス
`memory_notes/{noteId}/place_groups/{groupId}`

### 9.3 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| groupId | string | Yes | グループID | docId と同一 |
| noteId | string | Yes | 対象ノートID |  |
| groupOrder | number | Yes | 表示順 |  |
| title | string | No | スポット名 | 手動編集可 |
| placeName | string | No | 推定場所名 |  |
| centerLat | number | No | 中心緯度 | 内部用 |
| centerLng | number | No | 中心経度 | 内部用 |
| locationVisibility | string | Yes | `hidden`, `city`, `area`, `exact` |  |
| photoCount | number | Yes | 写真枚数 |  |
| startAt | timestamp | No | 開始時刻 |  |
| endAt | timestamp | No | 終了時刻 |  |
| representativePhotoId | string | No | 代表写真ID |  |
| memo | string | No | スポットメモ |  |
| createdAt | timestamp | Yes | 作成日時 |  |
| updatedAt | timestamp | Yes | 更新日時 |  |
| createdBy | string | No | 作成者 |  |
| updatedBy | string | No | 更新者 |  |

### 9.4 補足
- ノート詳細の「訪問スポット一覧」に使う
- サマリーやカードにも利用可能
- 地図上の表示粒度は `locationVisibility` で制御する

---

## 10. ai_results

### 10.1 役割
AI生成結果とその入力・出力を保持する。

### 10.2 パス
`memory_notes/{noteId}/ai_results/{aiResultId}`

### 10.3 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| aiResultId | string | Yes | AI結果ID | docId と同一 |
| noteId | string | Yes | 対象ノートID |  |
| createdBy | string | Yes | 実行者 userId |  |
| model | string | No | 使用モデル名 | 監査用 |
| requestType | string | Yes | `title`, `diary`, `summary` |  |
| inputSnapshot | map | Yes | 送信した入力のスナップショット | 最小化 |
| outputText | string | Yes | AI出力文 |  |
| outputCandidates | array<string> | No | 複数候補 | 任意 |
| status | string | Yes | `success`, `failed`, `queued` |  |
| errorMessage | string | No | エラー内容 |  |
| promptVersion | string | No | プロンプト版 |  |
| createdAt | timestamp | Yes | 作成日時 |  |
| updatedAt | timestamp | Yes | 更新日時 |  |
| appliedToField | string | No | どのフィールドへ反映したか | `title`, `summary` 等 |
| userEdited | boolean | Yes | ユーザー修正有無 |  |
| editedText | string | No | 修正版 | 任意 |

### 10.4 補足
- AI 送信データはここで追跡可能にする
- ただし機微情報をそのまま大量保存しない
- OpenAI へ送った実データは最小範囲にする

---

## 11. share_cards

### 11.1 役割
SNS共有用の出力設定と生成物管理を行う。

### 11.2 パス
`memory_notes/{noteId}/share_cards/{shareCardId}`

### 11.3 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| shareCardId | string | Yes | 共有カードID | docId と同一 |
| noteId | string | Yes | 対象ノートID |  |
| createdBy | string | Yes | 生成者 userId |  |
| format | string | Yes | `square`, `feed`, `story` | 1:1, 4:5, 9:16 |
| templateId | string | No | テンプレートID |  |
| title | string | No | 表示タイトル | ノートからコピー可 |
| subtitle | string | No | 補助文 | 任意 |
| placeName | string | No | 表示する地名 | 位置ぼかし後 |
| locationVisibility | string | Yes | `hidden`, `city`, `area`, `exact` | 外部表示制御 |
| photoCount | number | Yes | 写真枚数 |  |
| spotCount | number | Yes | スポット数 |  |
| includeMap | boolean | Yes | 地図を含むか |  |
| includeRoute | boolean | Yes | ルート感を含むか |  |
| includeBranding | boolean | Yes | ブランド表記あり |  |
| madeWithText | string | No | `Made with Memory Note` 等 |  |
| coverPhotoPath | string | No | 使用した画像パス | Storage |
| outputImagePath | string | Yes | 生成されたカード画像パス | Storage |
| previewImagePath | string | No | プレビュー用画像 | 任意 |
| status | string | Yes | `draft`, `ready`, `shared`, `archived` |  |
| createdAt | timestamp | Yes | 作成日時 |  |
| updatedAt | timestamp | Yes | 更新日時 |  |
| sharedAt | timestamp | No | 共有実行日時 |  |
| sharedVia | array<string> | No | `ios_share_sheet`, `android_share_sheet` 等 | 任意 |

### 11.4 補足
- SNS共有カードは Firestore にメタ情報、Storage に画像本体を保存する
- 外部公開前提のため、位置情報は弱める
- `outputImagePath` は必須
- `previewImagePath` は必要なら別保存

---

## 12. invitations

### 12.1 役割
共有ノートへの招待を管理する。

### 12.2 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| invitationId | string | Yes | 招待ID | docId と同一 |
| noteId | string | Yes | 対象ノートID |  |
| invitedBy | string | Yes | 招待者 userId | Owner のみ |
| invitedEmail | string | No | 招待先メール | メール招待時 |
| invitedUserId | string | No | 招待先 userId | 既存ユーザーなら |
| role | string | Yes | `editor`, `viewer` | 招待時に固定 |
| tokenHash | string | Yes | 招待トークンのハッシュ | 生トークンは保存しない |
| status | string | Yes | `pending`, `accepted`, `revoked`, `expired` |  |
| expiresAt | timestamp | Yes | 失効日時 | 必須 |
| acceptedAt | timestamp | No | 受諾日時 |  |
| revokedAt | timestamp | No | 取り消し日時 |  |
| createdAt | timestamp | Yes | 作成日時 |  |
| updatedAt | timestamp | Yes | 更新日時 |  |

### 12.3 補足
- 招待リンク漏洩に備えて期限付き
- `role` は招待時に固定
- Owner のみ作成・取り消し可能

---

## 13. user_note_index

### 13.1 役割
ユーザー別ノート一覧を高速に取得するための逆引きインデックス。

### 13.2 パス
`user_note_index/{userId_noteId}`

### 13.3 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| id | string | Yes | 複合ID | `userId_noteId` |
| userId | string | Yes | ユーザーID |  |
| noteId | string | Yes | ノートID |  |
| role | string | Yes | `owner`, `editor`, `viewer` | 検索用 |
| noteTitle | string | Yes | ノートタイトル | 検索用冗長 |
| coverImageUrl | string | No | 表紙画像URL | 一覧用 |
| latestAt | timestamp | Yes | 最終更新日時 | 並び替え用 |
| noteDate | date | No | ノート日付 | カレンダー用 |
| tags | array<string> | Yes | タグ配列 | 検索用 |
| placeNames | array<string> | No | 場所名候補 | 検索用 |
| status | string | Yes | `active`, `deleted`, `left` | 参加状態 |
| isFavorite | boolean | Yes | お気に入り |  |
| lastViewedAt | timestamp | No | 最終閲覧日時 |  |
| createdAt | timestamp | Yes | 作成日時 |  |
| updatedAt | timestamp | Yes | 更新日時 |  |

### 13.4 補足
- Firestore の複雑な join を避けるための読み取り最適化
- ノート一覧、検索、カレンダー表示の主ソースになる
- `userId` 単位のクエリを中心に設計する

---

## 14. notifications

### 14.1 役割
招待や権限変更、削除通知などを保持する。

### 14.2 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| notificationId | string | Yes | 通知ID | docId と同一 |
| userId | string | Yes | 宛先 userId |  |
| type | string | Yes | `invitation`, `role_changed`, `removed`, `note_deleted` |  |
| title | string | Yes | 通知タイトル |  |
| body | string | Yes | 通知本文 |  |
| noteId | string | No | 関連ノートID |  |
| invitationId | string | No | 関連招待ID |  |
| readAt | timestamp | No | 既読日時 |  |
| status | string | Yes | `unread`, `read`, `archived` |  |
| createdAt | timestamp | Yes | 作成日時 |  |

### 14.3 補足
- v1 はシンプル通知で十分
- Push 通知は Cloud Messaging 連携を将来追加可
- Firestore には表示用最低限のみ

---

## 15. app_settings

### 15.1 役割
アプリ全体の設定を保持する。

### 15.2 推奨パス
`app_settings/global`

### 15.3 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| appVersion | string | Yes | 設定対象バージョン |  |
| maintenanceMode | boolean | Yes | メンテナンスフラグ |  |
| signupEnabled | boolean | Yes | 新規登録可否 |  |
| aiEnabled | boolean | Yes | AI利用可否 |  |
| shareCardEnabled | boolean | Yes | 共有カード可否 |  |
| maxPhotosPerNote | number | Yes | 1ノート写真上限 | コスト制御 |
| maxShareCardsPerNote | number | Yes | 1ノートあたりカード数上限 |  |
| maxAiRequestsPerDay | number | Yes | 1日AI上限 |  |
| updatedAt | timestamp | Yes | 更新日時 |  |
| updatedBy | string | No | 更新者 |  |

### 15.4 補足
- 管理者のみ編集可
- 機能ON/OFFの切り替えに使う

---

## 16. audit_logs

### 16.1 役割
重要操作の監査ログを保持する。

### 16.2 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| logId | string | Yes | ログID | docId と同一 |
| actorUserId | string | No | 実行者 userId | システム処理は空可 |
| action | string | Yes | `create_note`, `delete_note`, `change_role` 等 |  |
| targetType | string | Yes | `user`, `note`, `photo`, `invitation` |  |
| targetId | string | Yes | 対象ID |  |
| noteId | string | No | 関連ノートID |  |
| result | string | Yes | `success`, `failed` |  |
| reason | string | No | 失敗理由 |  |
| metadata | map | No | 追加情報 | 最小限 |
| createdAt | timestamp | Yes | 作成日時 |  |

### 16.3 補足
- 監査ログは削除操作、権限変更、招待などに有効
- 個人情報は入れすぎない

---

## 17. usage_limits

### 17.1 役割
ユーザーごとの利用上限とカウントを管理する。

### 17.2 フィールド定義

| フィールド | 型 | 必須 | 説明 | 備考 |
|---|---|---:|---|---|
| userId | string | Yes | ユーザーID | docId と同一可 |
| aiRequestsToday | number | Yes | 本日のAIリクエスト数 |  |
| aiRequestsMonth | number | Yes | 今月のAIリクエスト数 |  |
| uploadedPhotosToday | number | Yes | 本日のアップロード数 |  |
| uploadedStorageBytesMonth | number | Yes | 月間ストレージ使用量 |  |
| lastResetAt | timestamp | Yes | リセット日時 |  |
| updatedAt | timestamp | Yes | 更新日時 |  |

### 17.3 補足
- 乱用防止、コスト制御に使う
- カウンタ更新は Cloud Functions 側で管理するのが安全

---

## 18. Firebase Storage Path設計

### 18.1 基本方針
Storage は用途ごとに分ける。

- 圧縮画像
- サムネイル
- 共有カード
- 一時アップロード
- オプション原本

### 18.2 推奨パス

```text
users/{userId}/profile/{fileName}
memory_notes/{noteId}/photos/compressed/{photoId}.jpg
memory_notes/{noteId}/photos/thumbnails/{photoId}.jpg
memory_notes/{noteId}/photos/originals/{photoId}.jpg
memory_notes/{noteId}/share_cards/{shareCardId}/{format}.png
memory_notes/{noteId}/temp/{uploadId}.tmp
users/{userId}/exports/{exportId}.png
```

### 18.3 用途別ルール

| パス | 用途 | 備考 |
|---|---|---|
| `users/{userId}/profile/` | プロフィール画像 | 任意 |
| `memory_notes/{noteId}/photos/compressed/` | 表示用の本体画像 | 必須 |
| `memory_notes/{noteId}/photos/thumbnails/` | 一覧用画像 | 必須 |
| `memory_notes/{noteId}/photos/originals/` | 原本 | 条件付き |
| `memory_notes/{noteId}/share_cards/` | 共有カード出力 | 必須 |
| `memory_notes/{noteId}/temp/` | 途中アップロード | 破棄前提 |
| `users/{userId}/exports/` | ユーザー個人出力 | 将来拡張 |

---

## 19. 削除設計

### 19.1 基本方針
削除は **Firestore と Storage の両方** に対して行う。  
さらに、関連する派生データも消す。

### 19.2 ノート削除

#### 対象
- `memory_notes/{noteId}`
- `memory_notes/{noteId}/members/*`
- `memory_notes/{noteId}/photos/*`
- `memory_notes/{noteId}/place_groups/*`
- `memory_notes/{noteId}/ai_results/*`
- `memory_notes/{noteId}/share_cards/*`
- 関連 Storage の圧縮画像、サムネイル、共有カード、原本

#### 推奨フロー
1. `memory_notes/{noteId}.status = deleted`
2. `deleteJobStatus = pending`
3. Cloud Functions が関連サブコレクションを巡回削除
4. Storage 削除
5. 完了後に `deleteJobStatus = done`

---

### 19.3 写真削除

#### 対象
- `memory_notes/{noteId}/photos/{photoId}`
- 圧縮画像
- サムネイル
- 原本がある場合は原本

#### ルール
- Editor でも削除可能だが、実体削除は Functions 経由が安全
- まずノートから外し、その後 Storage を削除する
- 参照されている cover photo だった場合は別画像に差し替える

---

### 19.4 メンバー離脱

#### 対象
- `memory_notes/{noteId}/members/{userId}`
- `user_note_index/{userId_noteId}`

#### ルール
- 自己離脱のみ可能
- 離脱後もノート本体は消えない
- 自分の `status = left`
- `role` は保持してもよいが利用不可にする

---

### 19.5 アカウント削除

#### 対象
- `users/{userId}`
- `user_note_index` の自分分
- 自分が作成した `notifications`
- 自分が Owner のノートは移譲必須
- 自分のプロフィール画像
- 必要なら自分の個人エクスポートデータ

#### ルール
- Owner は削除前に移譲
- 参加中ノートは自己離脱
- 他人のデータは消さない

---

### 19.6 AI生成結果削除

#### 対象
- `memory_notes/{noteId}/ai_results/{aiResultId}`

#### ルール
- ノート削除時にまとめて削除
- ユーザーが再生成した古い案を個別削除できるかは Phase 2 でもよい

---

### 19.7 派生画像削除

#### 対象
- サムネイル
- 共有カード
- 途中生成ファイル
- キャッシュ性の一時ファイル

#### ルール
- 本体画像削除時に合わせて削除
- 削除漏れ防止のため Function で一括処理

---

## 20. インデックス設計

Firestore は検索が弱いため、読み取り最適化を前提にする。

### 20.1 ユーザー別ノート一覧
`user_note_index` を利用

**主なクエリ**
- `where("userId", "==", uid)`
- `orderBy("latestAt", "desc")`

### 20.2 共有ノート一覧
`user_note_index` で `role` と `status` を使って取得

### 20.3 日付順
- `latestAt desc`
- `noteDate desc`

### 20.4 タグ検索
- `tags array-contains "travel"`
- `tags array-contains "cafe"`

### 20.5 場所検索
- `placeNames` を冗長保持
- 必要なら `searchKeywords` を追加可能

### 20.6 カレンダー表示
- `noteDate`
- `latestAt`
- 月単位の一覧は `user_note_index` が便利

### 20.7 On This Day
- `noteDate` の月日比較は Firestore 単体では弱いので、
  - `onThisDayKey: "12-25"` のような補助フィールドを `user_note_index` に持たせる案が有効

#### 推奨追加フィールド
| フィールド | 型 | 説明 |
|---|---|---|
| onThisDayKey | string | `MM-DD` のキー |
| year | number | 参照年 |
| month | number | 月 |
| day | number | 日 |

---

## 21. Security Rules設計方針

### 21.1 基本方針
- 認可はクライアント任せにしない
- `memory_notes/{noteId}/members/{userId}` を認可判定の中心にする
- `owner`, `editor`, `viewer` を明示的に扱う
- 招待中ユーザーはアクセスを限定する
- 公開共有はしない

### 21.2 判定モデル

| ロール | 読み取り | 編集 | 削除 | 招待管理 |
|---|---|---|---|---|
| Owner | 可 | 可 | 可 | 可 |
| Editor | 可 | 可 | 一部可 | 不可 |
| Viewer | 可 | 不可 | 不可 | 不可 |
| 招待中 | 招待対象ノートの必要最小限のみ | 不可 | 不可 | 不可 |

### 21.3 Firestore Rulesの考え方
- `