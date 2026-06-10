# Firestore Security Rules Spec v2  
Release v1 / Memory Note App / 思い出ノートアプリ

---

## 1. 目的

本仕様は、Release v1 の **Firestore Security Rules / Firebase Storage Rules** を実装前に確定するための設計書です。  
目的は以下です。

- 認証済みユーザーのみが必要なデータにアクセスできるようにする
- **Owner / Editor / Viewer** の権限を Firestore / Storage で一貫して適用する
- 共有ノート・共同編集・招待・削除を安全に成立させる
- UI 側の表示制御だけに依存せず、サーバ側で強制する
- Cloud Functions でしか実行できない操作を明確に分離する
- 位置情報・写真・AI結果・共有カードを適切に保護する
- 外部公開は **SNS共有カード画像のみ** に限定する
- アカウント削除、ノート削除、写真削除の事故を防ぐ

---

## 2. セキュリティ基本方針

### 2.1 基本原則

| 原則 | 内容 |
|---|---|
| 認証必須 | すべての実データアクセスは `request.auth != null` を前提にする |
| membership based access | ノート単位の membership を基準に read/write を判定する |
| 最小権限 | Viewer は閲覧のみ、Editor は編集可、Owner は管理可 |
| UI非依存 | 画面で非表示でも Rules で必ず拒否する |
| Cloud Functions優先 | 招待受諾、削除連鎖、AI生成、Owner移譲などは Functions 経由を前提にする |
| 位置情報慎重 | 精密座標は内部に限定し、外部共有はカード画像のみ |
| Storageも同等管理 | Firestore と同じ membership ポリシーで Storage を制御する |
| 公開ノートなし | ノート本文・写真の公開URLは作らない |
| 監査可能 | 重要操作は `audit_logs` に記録するが、Rules では書き込みを絞る |
| 削除厳格 | ノート削除は Owner のみ、派生データ削除は Functions で実施する |

### 2.2 Cloud Functionsでのみ許可すべき処理

以下は **クライアント直書き禁止**、または **クライアントからは原則不可** とする。

- AI生成結果の作成・更新
- 共有カード画像生成
- 招待受諾の確定
- ノート削除の連鎖処理
- 写真削除の Storage / Firestore 同期削除
- Owner移譲
- usage limits の加算・更新
- audit log の確定記録
- 一時ファイル削除の確定処理

---

## 3. ロール定義

### 3.1 ロール一覧

| ロール | 定義 | 代表権限 |
|---|---|---|
| Owner | ノート所有者 | メンバー管理、権限変更、ノート削除、Owner移譲 |
| Editor | 共同編集者 | 写真追加、本文編集、場所名編集、AI再生成 |
| Viewer | 閲覧専用 | 閲覧のみ、共有カード生成は可 |

### 3.2 判定ルール

- ロールは `memory_notes/{noteId}/members/{userId}` に保存する
- `status=active` の membership のみ有効
- `status=invited` は未参加扱い
- `status=left` / `removed` は無効扱い
- Owner 判定は `role == "owner"` または `isOwner == true` のどちらか一方に統一する
  - 本仕様では **`role` を正** とすることを推奨

### 3.3 権限の結論

| 操作 | Owner | Editor | Viewer |
|---|---:|---:|---:|
| ノート閲覧 | 可 | 可 | 可 |
| ノート編集 | 可 | 可 | 不可 |
| ノート削除 | 可 | 不可 | 不可 |
| 写真追加 | 可 | 可 | 不可 |
| 写真削除 | 可 | 可 | 不可 |
| 場所名編集 | 可 | 可 | 不可 |
| 本文編集 | 可 | 可 | 不可 |
| AI生成依頼 | 可 | 可 | 不可 |
| メンバー招待 | 可 | 不可 | 不可 |
| メンバー削除 | 可 | 不可 | 不可 |
| 権限変更 | 可 | 不可 | 不可 |
| Owner移譲 | 可 | 不可 | 不可 |
| 共有カード生成 | 可 | 可 | 可 |
| 自己離脱 | 可 | 可 | 可 |

---

## 4. Firestore collection別アクセス方針

> 前提: すべて **Firestore Rules 上で最終判定** する。  
> クライアントのUI上で表示されても、Rulesで拒否できる設計にする。

| Path | Read | Create | Update | Delete | 備考 |
|---|---|---|---|---|---|
| `users/{userId}` | 自分のみ、または必要最小限の他人参照 | 自分のみ | 自分のみ | 自分のみ（論理削除中心） | 外部公開プロフィールなし |
| `memory_notes/{noteId}` | active memberのみ | 認証済みかつ作成者のみ | Owner/Editorのみ | Ownerのみ | 共有ノート本体 |
| `memory_notes/{noteId}/members/{userId}` | active memberのみ | Ownerのみ | Ownerのみ | Ownerのみ | 自己離脱は別処理可 |
| `memory_notes/{noteId}/photos/{photoId}` | active memberのみ | Owner/Editorのみ | Owner/Editorのみ | Owner/Editorのみ | 実削除はFunctions推奨 |
| `memory_notes/{noteId}/place_groups/{groupId}` | active memberのみ | FunctionsまたはOwner/Editorのみ | Owner/Editorのみ | Owner/Editorのみ | 自動生成と手動修正を想定 |
| `memory_notes/{noteId}/ai_results/{aiResultId}` | active memberのみ | Functionsのみ | Functionsのみ | Functionsのみ | クライアント直書き禁止 |
| `memory_notes/{noteId}/share_cards/{shareCardId}` | active memberのみ | FunctionsまたはOwner/Editor/Viewerの要求→Functions確定 | Functionsのみ推奨 | Owner/EditorまたはFunctions | 外部公開画像の管理 |
| `invitations/{invitationId}` | 発行者・招待先・Functionsのみ | Ownerのみ | Ownerのみ | Ownerのみ | 招待トークンを秘匿 |
| `user_note_index/{userId_noteId}` | 当該userId本人のみ | Functionsのみ | Functionsのみ | Functionsのみ | 一覧高速化用 |
| `notifications/{notificationId}` | 宛先本人のみ | Functionsのみ | 宛先本人の既読更新のみ | 宛先本人のみ | 受信者ごとに閉じる |
| `app_settings/{docId}` | 原則公開読み取りのみ、機微なし | 管理者のみ | 管理者のみ | 管理者のみ | 公開ポリシーのみ |
| `audit_logs/{logId}` | 管理者のみ | Functionsのみ | 不可 | 不可 | 追記専用 |
| `usage_limits/{userId}` | 本人のみ | Functionsのみ | Functionsのみ | 不可 | クライアント更新禁止 |

---

## 5. Helper関数設計

以下は Firestore Rules / Storage Rules で共通利用する前提のヘルパーです。

### 5.1 必須ヘルパー

| 関数 | 目的 |
|---|---|
| `isSignedIn()` | 認証済みか判定 |
| `isSelf(userId)` | 対象が自分か判定 |
| `isNoteMember(noteId)` | active member か判定 |
| `getRole(noteId)` | membership role を取得 |
| `isOwner(noteId)` | owner か判定 |
| `isEditor(noteId)` | editor 以上か判定 |
| `isViewer(noteId)` | viewer 以上か判定 |
| `canReadNote(noteId)` | ノート読取可否 |
| `canEditNote(noteId)` | ノート編集可否 |
| `canDeleteNote(noteId)` | ノート削除可否 |
| `canManageMembers(noteId)` | メンバー管理可否 |

### 5.2 実装上の注意

- Firestore Rules では `get()` の多用でコストと複雑性が上がるため、membership を主キーで取りに行く
- `members/{userId}` は `docId == userId` を原則とする
- `active` 以外は必ず拒否
- `invited` は読取不可ではなく、**参加前として扱う**
- `role` と `status` の両方を確認する

### 5.3 擬似コードの意図

```js
isSignedIn() := request.auth != null
isSelf(userId) := isSignedIn() && request.auth.uid == userId
isNoteMember(noteId) := exists active membership for request.auth.uid in noteId
getRole(noteId) := membership.role
isOwner(noteId) := isNoteMember(noteId) && getRole(noteId) == "owner"
isEditor(noteId) := isNoteMember(noteId) && (getRole(noteId) == "owner" || getRole(noteId) == "editor")
isViewer(noteId) := isNoteMember(noteId) && (getRole(noteId) in ["owner","editor","viewer"])
canReadNote(noteId) := isNoteMember(noteId)
canEditNote(noteId) := isEditor(noteId)
canDeleteNote(noteId) := isOwner(noteId)
canManageMembers(noteId) := isOwner(noteId)
```

---

## 6. users rules

### 6.1 方針

- 自分のプロフィールのみ編集可
- 他人のプロフィールは原則読まない
- 外部公開プロフィールは作らない
- `status=deleted` への変更は本人または Functions 経由のみ許可

### 6.2 ルール

| 操作 | 方針 |
|---|---|
| Read | 自分のみ |
| Create | 自分のみ |
| Update | 自分のみ |
| Delete | 直接削除せず論理削除推奨、自分のみ |
| 他人参照 | 原則禁止 |

### 6.3 注意

- 共有ノート内で表示する名前は membership のスナップショットや note 内の表示名を使う
- `users` を広く読ませないことで、プロフィールの横展開を防ぐ

---

## 7. memory_notes rules

### 7.1 方針

`memory_notes` はノート本体なので、**active member のみ read** にする。  
作成は認証済みユーザーが自分のノートとして作成できるが、作成直後に `members/{uid}` で owner membership を作る前提にする。

### 7.2 許可条件

- Read: active member のみ
- Create: 認証済みユーザーのみ、`ownerUserId == request.auth.uid`
- Update: Owner / Editor のみ
- Delete: Owner のみ

### 7.3 更新可能フィールドの分離

#### Owner / Editor が更新してよいもの
- `title`
- `subtitle`
- `summary`
- `coverPhotoId`
- `coverImageUrl`
- `noteDate`
- `startAt`
- `endAt`
- `tags`
- `status` の一部
- `updatedAt`
- `lastEditedAt`
- `lastEditedBy`
- `aiTitleGenerated`
- `aiDiaryGenerated`

#### Owner のみ更新してよいもの
- `ownerUserId`
- `deletedAt`
- `deletedBy`
- `deleteJobStatus`
- `visibility`
- `status=deleted`
- ノート全体の削除フラグ

### 7.4 注意

- `memory_notes` への直接更新でメンバーを増減させない
- メンバー情報は `members` サブコレクションで管理する
- `coverImageUrl` は Storage の実体と整合する前提

---

## 8. members rules

### 8.1 方針

`members` は権限の本体なので、最も厳格に扱う。  
参加前の `invited` 状態と参加後の `active` 状態を分ける。

### 8.2 許可条件

| 操作 | 許可主体 |
|---|---|
| Read | active member のみ |
| Create | Owner のみ |
| Update | Owner のみ |
| Delete | Owner のみ |

### 8.3 自己離脱

自己離脱は通常の delete ではなく、**専用の Cloud Functions** により `status=left` または `removed` へ変更する運用を推奨する。  
Rules 上は以下を許可しないことを推奨する。

- member ドキュメントの勝手な delete
- `role` の自己変更
- `status` の自己変更

### 8.4 注意

- Owner は `members/{ownerUid}` を必ず保持する
- owner membership を削除しない
- Owner移譲は Functions 経由で `role` を安全に入れ替える

---

## 9. photos rules

### 9.1 方針

写真は共有ノートの核心データ。  
**active member のみ read**、**Editor 以上のみ write** とする。

### 9.2 許可条件

| 操作 | 許可主体 |
|---|---|
| Read | active member |
| Create | Owner / Editor |
| Update | Owner / Editor |
| Delete | Owner / Editor |

### 9.3 更新可否の目安

許可する:
- `caption`
- `sortOrder`
- `groupId`
- `placeName`
- `locationVisibility`
- `isCover`
- `status`
- `updatedAt`

制限する:
- `uploadedBy`
- `noteId`
- `storagePath`
- `thumbnailPath`
- `originalStoragePath`
- `hasExif`
- `hasGps`
- `gpsLat`
- `gpsLng`

### 9.4 注意

- `storagePath` は後から差し替えさせない
- 位置情報の精密値は内部用途に留める
- 実削除は Storage と同期させるため Functions 経由が望ましい

---

## 10. place_groups rules

### 10.1 方針

place_groups は自動整理と手動修正の中間データ。  
active member のみ read、Owner / Editor 以上のみ write。

### 10.2 許可条件

| 操作 | 許可主体 |
|---|---|
| Read | active member |
| Create | Owner / Editor または Functions |
| Update | Owner / Editor または Functions |
| Delete | Owner / Editor または Functions |

### 10.3 注意

- `centerLat`, `centerLng` は内部利用
- 外部共有用には `locationVisibility` を反映する
- `title` のみの編集を許容してもよい

---

## 11. ai_results rules

### 11.1 方針

AI結果は **クライアント直書き禁止**。  
Functions が生成・保存する。

### 11.2 許可条件

| 操作 | 許可主体 |
|---|---|
| Read | active member |
| Create | Functionsのみ |
| Update | Functionsのみ |
| Delete | Functionsのみ |

### 11.3 注意

- クライアントが `prompt` を直接保存しない
- `inputSnapshot` に個人情報を残しすぎない
- 再生成制御は `usage_limits` と連動する

---

## 12. share_cards rules

### 12.1 方針

共有カードは外部公開のための成果物だが、**ノート本体の公開ではない**。  
active member は read 可。生成はビュー権限でも可能だが、実保存は Functions 経由を推奨する。

### 12.2 許可条件

| 操作 | 許可主体 |
|---|---|
| Read | active member |
| Create | Owner / Editor / Viewer の依頼を Functions が承認した場合 |
| Update | Functionsのみ推奨 |
| Delete | Owner / Editor または Functions |

### 12.3 外部公開の扱い

- 共有カード画像そのものは外部へ渡す前提
- ただし Storage 上の直接URLを一般公開しない
- `locationVisibility` が `exact` にならないようデフォルト制御する

---

## 13. invitations rules

### 13.1 方針

招待は漏えいリスクが高いため厳格に管理する。  
**Owner のみ作成・取り消し可能**。

### 13.2 許可条件

| 操作 | 許可主体 |
|---|---|
| Read | 発行者、招待先、Functions |
| Create | Ownerのみ |
| Update | Ownerのみ |
| Delete | Ownerのみ |

### 13.3 注意

- 招待トークンは推測困難なランダム値
- 期限必須
- 参加済みになると `acceptedAt` を記録
- `invited` 状態のままではノート本体 read を許可しない

---

## 14. user_note_index rules

### 14.1 方針

一覧高速化用の補助インデックス。クライアント直書き禁止。

### 14.2 許可条件

| 操作 | 許可主体 |
|---|---|
| Read | 対象本人のみ |
| Create | Functionsのみ |
| Update | Functionsのみ |
| Delete | Functionsのみ |

### 14.3 注意

- `userId` と `noteId` の組に固定
- 参加・離脱・削除時に Functions が整合性を担保する

---

## 15. notifications rules

### 15.1 方針

通知は宛先本人のみ見える。  
メンバー招待、参加、権限変更、削除通知などに使う。

### 15.2 許可条件

| 操作 | 許可主体 |
|---|---|
| Read | 宛先本人のみ |
| Create | Functionsのみ |
| Update | 宛先本人による既読状態変更のみ |
| Delete | 宛先本人のみ、または Functions |

### 15.3 注意

- 送信者が他人の通知を操作できないようにする
- `readAt` のみ更新可能にしてよい

---

## 16. app_settings / audit_logs / usage_limits rules

### 16.1 app_settings

| 操作 | 許可主体 |
|---|---|
| Read | 認証不要でも可だが、機微情報なしに限る |
| Create/Update/Delete | 管理者のみ |

用途:
- 利用規約リンク
- プライバシー説明
- アプリの公開設定
- Feature flag

### 16.2 audit_logs

| 操作 | 許可主体 |
|---|---|
| Read | 管理者のみ |
| Create | Functionsのみ |
| Update | 不可 |
| Delete | 不可 |

用途:
- 削除
- 招待
- AI生成
- 共有カード生成
- 権限変更

### 16.3 usage_limits

| 操作 | 許可主体 |
|---|---|
| Read | 本人のみ |
| Create | Functionsのみ |
| Update | Functionsのみ |
| Delete | 不可 |

用途:
- AI生成回数
- 共有カード生成回数
- 招待発行回数
- 1日あたり制限

---

## 17. Storage Rules方針

Storage は Firestore と同じ membership 設計に合わせる。  
**ノート参加メンバー以外は読めない** を基本にし、外部公開は share_cards のみとする。

### 17.1 Storage Path 別方針

| Storage Path | Read | Write | Delete | 備考 |
|---|---|---|---|---|
| `users/{userId}/profile` | 本人のみ | 本人のみ | 本人のみ | プロフィール画像 |
| `memory_notes/{noteId}/compressed` | active member | Owner/Editor | Owner/Editor or Functions | 表示用本体画像 |
| `memory_notes/{noteId}/thumbnails` | active member | Owner/Editor | Owner/Editor or Functions | 一覧用軽量画像 |
| `memory_notes/{noteId}/share_cards` | active member / 端末保存後共有 | Functions推奨 | Owner/Editor or Functions | 外部共有用画像 |
| `memory_notes/{noteId}/previews` | active member | FunctionsまたはOwner/Editor | Functions or owner/editor | 短期プレビュー |
| `memory_notes/{noteId}/temp_uploads` | アップロード実行者のみ | アップロード実行者のみ | Functionsまたは実行者 | 一時ファイル |
| `memory_notes/{noteId}/originals` | 原則不可、条件付き | 原則不可、条件付き | FunctionsまたはOwner | v1では基本非保存 |

### 17.2 補足

- `share_cards` は外部共有可能だが、**ノート本体画像の公開URLにはしない**
- `previews` は短期保存前提で、期限切れ削除を前提にする
- `temp_uploads` は失敗時・成功時に必ず掃除する
- `originals` は将来用。v1 では Rules で厳しく制限する

---

## 18. Cloud Functions専用操作

以下の操作は **Cloud Functions 専用** とする。

### 18.1 AI生成
- `generateTitle`
- `generateDiary`
- `generateSummary`
- `generateFallback`

### 18.2 共有カード生成
- `generateShareCard`

### 18.3 招待受諾
- `acceptInvitation`

### 18.4 ノート削除
- `deleteNote`

### 18.5 写真削除
- `deletePhoto`

### 18.6 Owner移譲
- `transferOwner`

### 18.7 Usage Limit更新
- `enforceUsageLimit`
- 各種生成回数の加算

### 18.8 理由

- 原子性が必要
- 連鎖削除が必要
- 権限確認が複雑
- コスト制御が必要
- ログと監査が必要

---

## 19. Rules草案

以下は Firestore Security Rules の擬似コードです。  
実際の実装では `get()` の回数、パス参照、型チェックを調整してください。

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isSelf(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function memberPath(noteId) {
      return /databases/$(database)/documents/memory_notes/$(noteId)/members/$(request.auth.uid);
    }

    function hasMemberDoc(noteId) {
      return isSignedIn() &&
        exists(memberPath(noteId));
    }

    function memberDoc(noteId) {
      return get(memberPath(noteId));
    }

    function isActiveMember(noteId) {
      return hasMemberDoc(noteId) &&
        memberDoc(noteId).data.status == "active";
    }

    function getRole(noteId) {
      return isActiveMember(noteId) ? memberDoc(noteId).data.role : null;
    }

    function isOwner(noteId) {
      return isActiveMember(noteId) && getRole(noteId) == "owner";
    }

    function isEditor(noteId) {
      return isActiveMember(noteId) &&
        (getRole(noteId) == "owner" || getRole(noteId) == "editor");
    }

    function isViewer(noteId) {
      return isActiveMember(noteId) &&
        (getRole(noteId) == "owner" || getRole(noteId) == "editor" || getRole(noteId) == "viewer");
    }

    function canReadNote(noteId) {
      return isActiveMember(noteId);
    }

    function canEditNote(noteId) {
      return isEditor(noteId);
    }

    function canDeleteNote(noteId) {
      return isOwner(noteId);
    }

    function canManageMembers(noteId) {
      return isOwner(noteId);
    }

    function isFunctions() {
      // Firestore Rules では直接判定できないため、
      // 実装ではクライアントから書けないように collection 単位で拒否する。
      return false;
    }

    match /users/{userId} {
      allow read, create, update, delete: if isSelf(userId);
    }

    match /memory_notes/{noteId} {
      allow read: if canReadNote(noteId);

      allow create: if isSignedIn()
        && request.resource.data.ownerUserId == request.auth.uid
        && request.resource.data.status in ["active", "shared"]
        && request.resource.data.deletedAt == null;

      allow update: if canEditNote(noteId)
        && request.resource.data.ownerUserId == resource.data.ownerUserId
        && request.resource.data.deletedBy == resource.data.deletedBy;

      allow delete: if canDeleteNote(noteId);
    }

    match /memory_notes/{noteId}/members/{userId} {
      allow read: if isActiveMember(noteId);
      allow create, update, delete: if canManageMembers(noteId);
    }

    match /memory_notes/{noteId}/photos/{photoId} {
      allow read: if canReadNote(noteId);
      allow create, update, delete: if isEditor(noteId);
    }

    match /memory_notes/{noteId}/place_groups/{groupId} {
      allow read: if canReadNote(noteId);
      allow create, update, delete: if isEditor(noteId);
    }

    match /memory_notes/{noteId}/ai_results/{aiResultId} {
      allow read: if canReadNote(noteId);
      allow create, update, delete: if false; // Functions only
    }

    match /memory_notes/{noteId}/share_cards/{shareCardId} {
      allow read: if canReadNote(noteId);
      allow create, update, delete: if false; // Functions only
    }

    match /invitations/{invitationId} {
      allow read: if isSignedIn()
        && (resource.data.ownerUserId == request.auth.uid
            || resource.data.invitedUserId == request.auth.uid);

      allow create, update, delete: if isSignedIn()
        && request.resource.data.ownerUserId == request.auth.uid;
    }

    match /user_note_index/{docId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create, update, delete: if false; // Functions only
    }

    match /notifications/{notificationId} {
      allow read, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow update: if isSignedIn()
        && resource.data.userId == request.auth.uid
        && request.resource.data.diff(resource.data).changedKeys().hasOnly(["readAt"]);
      allow create: if false; // Functions only
    }

    match /app_settings/{docId} {
      allow read: if true;
      allow create, update, delete: if false;
    }

    match /audit_logs/{logId} {
      allow read, create, update, delete: if false;
    }

    match /usage_limits/{userId} {
      allow read: if isSelf(userId);
      allow create, update: if false; // Functions only
      allow delete: if false;
    }
  }
}
```

---

## 20. Storage Rules草案

以下は Firebase Storage Rules の擬似コードです。  
Firestore membership に依存するため、ノート単位で `members/{uid}` を参照する設計です。

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    function memberPath(noteId) {
      return /databases/(default)/documents/memory_notes/$(noteId)/members/$(request.auth.uid);
    }

    function hasMemberDoc(noteId) {
      return isSignedIn() &&
        firestore.exists(memberPath(noteId));
    }

    function memberDoc(noteId) {
      return firestore.get(memberPath(noteId));
    }

    function isActiveMember(noteId) {
      return hasMemberDoc(noteId) &&
        memberDoc(noteId).data.status == "active";
    }

    function isOwner(noteId) {
      return isActiveMember(noteId) && memberDoc(noteId).data.role == "owner";
    }

    function isEditor(noteId) {
      return isActiveMember(noteId) &&
        (memberDoc(noteId).data.role == "owner" || memberDoc(noteId).data.role == "editor");
    }

    function canReadNoteAsset(noteId) {
      return isActiveMember(noteId);
    }

    // users/{userId}/profile
    match /users/{userId}/profile/{allPaths=**} {
      allow read, write, delete: if isSignedIn() && request.auth.uid == userId;
    }

    // memory_notes/{noteId}/compressed
    match /memory_notes/{noteId}/compressed/{photoId} {
      allow read: if canReadNoteAsset(noteId);
      allow write: if isEditor(noteId);
      allow delete: if isEditor(noteId);
    }

    // memory_notes/{noteId}/thumbnails
    match /memory_notes/{noteId}/thumbnails/{photoId} {
      allow read: if canReadNoteAsset(noteId);
      allow write: if isEditor(noteId);
      allow delete: if isEditor(noteId);
    }

    // memory_notes/{noteId}/share_cards
    match /memory_notes/{noteId}/share_cards/{shareCardId}/{fileName=**} {
      allow read: if canReadNoteAsset(noteId);
      allow write: if false; // Functions only or pre-signed-like flowは不可
      allow delete: if false; // Functions or owner/editor initiated deletion
    }

    // memory_notes/{noteId}/previews
    match /memory_notes/{noteId}/previews/{previewId}/{fileName=**} {
      allow read: if canReadNoteAsset(noteId);
      allow write: if isEditor(noteId) || isOwner(noteId);
      allow delete: if isEditor(noteId) || isOwner(noteId);
    }

    // memory_notes/{noteId}/temp_uploads
    match /memory_notes/{noteId}/temp_uploads/{uploadId}/{fileName=**} {
      allow read, write, delete: if isSignedIn();
      // ただし実運用では uploadId を request.auth.uid 連動にし、関数側で即時削除する
    }

    // memory_notes/{noteId}/originals
    match /memory_notes/{noteId}/originals/{photoId} {
      allow read, write, delete: if false; // v1では原則不可
      // 将来の条件付き保存のみ別ルール
    }
  }
}
```

### Storage Rules 補足

- `share_cards` は閲覧メンバーに開放してよいが、**ノート本体の公開URLにはしない**
- `temp_uploads` は現実装上、アップロード中の一時置き場として扱うため、厳密には実行者限定にしたい
- `originals` は v1 では原則禁止に寄せる
- 共有カードをアプリ外で配布する場合でも、Storage 上のパス推測で他データに触れないようにする

---

## 21. Rulesテスト観点

以下は最低限のテスト観点です。

### 21.1 権限テスト

- Owner can delete
- Editor cannot delete note
- Viewer cannot edit
- non-member cannot read
- invited but not accepted cannot read note

### 21.2 Storage テスト

- share card access
- temp upload access
- compressed image read/write
- thumbnails read/write
- originals denied

### 21.3 削除・離脱テスト

- Owner delete cascades properly
- Editor photo delete only
- Viewer cannot remove photos
- account delete edge cases
- Owner user deletion requires transfer first

### 21.4 招待テスト

- Owner can create invitation
- non-owner cannot create invitation
- expired invitation cannot be accepted
- revoked invitation cannot be accepted

### 21.5 AI / Functions テスト

- client cannot write ai_results
- client cannot update usage_limits
- client cannot forge share_cards
- client cannot write audit_logs

### 21.6 位置情報テスト

- exact GPS not exposed in share card
- note internal location can be read only by members
- external sharing uses blurred/area-level output only

---

## 22. 既知の制約

- Firestore Rules は複雑な「メンバー一覧全体の整合性」を完全には保証しにくい
- `get()` を多用すると Rules の可読性と保守性が落ちる
- Storage Rules で Firestore の membership 参照を前提にするため、データ不整合時の挙動に注意が必要
- `temp_uploads` の厳密な所有者検証は実装工夫が必要
- `share_cards` の外部公開を Storage Rules だけで完結させない方がよい
- `originals` の将来解放は別リリースで再設計が必要
- 招待のトークン管理は Firestore Rules だけでは不十分で、Cloud Functions 主導が望ましい

---

## 23. 未決定事項

以下は Release v1 実装前に最終判断が必要です。

| 論点 | 状態 |
|---|---|
| `status=invited` の member read 可否 | 未確定。v1は読取可でも本体読取不可が妥当 |
| `share_cards` をクライアント直生成するか | 未決定。Functions生成推奨 |
| `temp_uploads` の厳密な所有者制御方法 | 未決定 |
| `originals` の将来保存可否 | 未決定 |
| `users` の他人プロフィール read 範囲 | 未決定。原則自分のみ |
| `notifications` の既読更新粒度 | 未決定 |
| `app_settings` の匿名 read 範囲 | 未決定 |
| 管理者ロールの持ち方 | 未決定 |
| `audit_logs` の保存期間 | 未決定 |
| `usage_limits` の更新タイミング | 未決定 |

---

## 24. 次に作成すべきファイル

実装着手のため、次に用意すべきファイルは以下です。

### Firestore / Storage
- `firebase/firestore.rules`
- `firebase/storage.rules`
- `firebase/firestore.indexes.json`

### Functions
- `functions/src/shared/auth.ts`
- `functions/src/shared/permissions.ts`
- `functions/src/shared/limits.ts`
- `functions/src/ai/generateTitle.ts`
- `functions/src/ai/generateDiary.ts`
- `functions/src/share/generateShareCard.ts`
- `functions/src/collaboration/createInvitation.ts`
- `functions/src/collaboration/acceptInvitation.ts`
- `functions/src/collaboration/transferOwner.ts`
- `functions/src/mutation/deleteNote.ts`
- `functions/src/mutation/deletePhoto.ts`

### React Native + Expo（参考）
- `src/core/services/permissionService.ts`
- `src/core/constants/firestorePaths.ts`
- `src/core/constants/storagePaths.ts`
- `src/features/collaboration/repositories/invitationRepository.ts`
- `src/features/memoryNotes/repositories/memoryNoteRepository.ts`
- `src/features/shareCard/repositories/shareCardRepository.ts`

---

## 決定ログ

### 決定したこと
- Release v1 は **認証必須**
- 権限制御は **Owner / Editor / Viewer** を中心に設計
- Firestore と Storage の両方で membership-based access を採用
- AI・共有カード・削除・Owner移譲は **Cloud Functions 主導**
- 公開ノートは作らず、外部公開は **SNS共有カードのみ**

### 未決定のこと
- `invited` membership の read 範囲
- `temp_uploads` の厳密な所有者設計
- `originals` の将来解放
- 管理者ロールと `app_settings` の公開範囲

### 追加で必要な根拠
- Functions 実装方針に合わせた最終パス設計
- Storage 生成フローの実装詳細
- 招待受諾時の整合性処理方式

### 主要リスク
- Firestore Rules と Storage Rules の複雑化
- 招待・削除・Owner移譲の整合性不備
- 位置情報の外部漏えい
- `share_cards` の公開範囲の誤設定
- `temp_uploads` の残骸蓄積

必要であれば次に、**この仕様をそのまま貼れる Firestore Rules / Storage Rules の実コード雛形** まで書けます。