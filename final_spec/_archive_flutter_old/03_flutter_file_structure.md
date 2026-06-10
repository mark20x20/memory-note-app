# Flutter File Structure v2

## 1. 目的

Release v1 の **Memory Note App / 思い出ノートアプリ** を、  
**Flutter + Firebase + Riverpod + go_router** 前提で、実装者がそのまま着手できるファイル構成に落とし込みます。

この構成の目的は以下です。

- 写真起点の思い出ノート作成を中心に保つ
- 共有ノート、共同編集、SNS共有カード、AI生成を Release v1 に含める
- UI から Firebase を直接叩かず、Repository 経由にする
- テストしやすく、差し替えやすくする
- 将来の機能拡張に耐える

---

## 2. 設計方針

### 採用方針
- **feature-first 構成**
- 各 feature の中に
  - `presentation`
  - `application`
  - `domain`
  - `infrastructure`
  を持たせる
- 状態管理は **Riverpod**
- ルーティングは **go_router**
- Firebase 呼び出しは **Repository 実装層** に閉じ込める
- UI から Firestore / Storage / Functions を直接呼ばない
- テスト用に **fake repository** を差し替え可能にする

### 責務分離
| 層 | 責務 | 例 |
|---|---|---|
| presentation | 画面、Widget、UI state | Screen, Widget, Controller |
| application | ユースケース、状態調停 | UseCase, Notifier |
| domain | Entity、Repository interface、ValueObject | AppUser, MemoryNote |
| infrastructure | Firebase/HTTP/Device 実装 | Firestore repo, Storage datasource |

### 実装上の原則
- 画面単位ではなく **機能単位** で分ける
- 共通処理は `core` と `shared` に集約
- Firebase SDK の型を domain に漏らさない
- DTO と Entity を分ける
- 1画面1ファイルではなく、必要に応じて分割する

---

## 3. ルート構成

```text
memory_note_app/
  lib/
  test/
  integration_test/
  assets/
  functions/
  firebase/
  docs/
  scripts/
  pubspec.yaml
  analysis_options.yaml
  README.md
```

### 各ルートの役割
| ルート | 役割 |
|---|---|
| `lib/` | Flutter アプリ本体 |
| `test/` | unit / widget / repository test |
| `integration_test/` | E2E / 実機寄りテスト |
| `assets/` | 画像、アイコン、フォント、テンプレ |
| `functions/` | Cloud Functions / OpenAI 呼び出し / 共有カード生成 |
| `firebase/` | Firestore Rules、Storage Rules、設定補助 |
| `docs/` | 設計書、API仕様、画面仕様、運用メモ |
| `scripts/` | ローカル補助スクリプト、生成、検証 |

---

## 4. lib配下の全体構成

```text
lib/
  main.dart
  app.dart

  bootstrap/
    bootstrap.dart
    env.dart

  core/
    errors/
      app_exception.dart
      failure.dart
      error_mapper.dart
    result/
      result.dart
      async_value_ext.dart
    constants/
      app_constants.dart
      firestore_paths.dart
      storage_paths.dart
      route_paths.dart
    logging/
      app_logger.dart
      crashlytics_logger.dart
    permissions/
      permission_service.dart
      permission_policy.dart
    validators/
      email_validator.dart
      password_validator.dart
      note_validator.dart
      photo_validator.dart
    utils/
      date_utils.dart
      string_utils.dart
      file_utils.dart
      location_utils.dart
    di/
      providers.dart
      firebase_providers.dart
      service_providers.dart
    routing/
      app_router.dart
      route_names.dart
      route_guards.dart
      route_extensions.dart
    theme/
      app_theme.dart
      color_tokens.dart
      text_styles.dart
      spacing.dart
      component_styles.dart
    widgets/
      app_scaffold.dart
      app_app_bar.dart
      app_loading.dart
      app_error_view.dart
      empty_state_view.dart
      confirm_dialog.dart
      image_preview.dart
      section_header.dart

  shared/
    models/
    mappers/
    widgets/
    extensions/
    helpers/

  features/
    auth/
    profile/
    memory_notes/
    photo_upload/
    metadata_extraction/
    map/
    ai_generation/
    collaboration/
    permissions/
    share_card/
    search_calendar/
    settings/
```

---

## 5. shared / core 構成

### core の役割
アプリ全体で使う共通基盤を置きます。

#### `theme`
- `app_theme.dart`
- `color_tokens.dart`
- `text_styles.dart`
- `spacing.dart`
- `component_styles.dart`

#### `routing`
- `app_router.dart`
- `route_names.dart`
- `route_guards.dart`
- `route_extensions.dart`

#### `errors`
- `app_exception.dart`
- `failure.dart`
- `error_mapper.dart`

#### `result`
- `result.dart`
- `async_value_ext.dart`

#### `constants`
- `app_constants.dart`
- `firestore_paths.dart`
- `storage_paths.dart`
- `route_paths.dart`

#### `logging`
- `app_logger.dart`
- `crashlytics_logger.dart`

#### `permissions`
- `permission_service.dart`
- `permission_policy.dart`

#### `validators`
- `email_validator.dart`
- `password_validator.dart`
- `note_validator.dart`
- `photo_validator.dart`

#### `widgets`
- `app_scaffold.dart`
- `app_app_bar.dart`
- `app_loading.dart`
- `app_error_view.dart`
- `empty_state_view.dart`
- `confirm_dialog.dart`
- `image_preview.dart`
- `section_header.dart`

### shared の役割
feature をまたいで使う軽量共通要素を置きます。

```text
shared/
  models/
  mappers/
  widgets/
  extensions/
  helpers/
```

- `models/`: 共通 UI model
- `mappers/`: 共通変換
- `widgets/`: 再利用Widget
- `extensions/`: `BuildContext` 拡張など
- `helpers/`: 画面依存の薄い補助関数

---

## 6. feature module構成

以下の各 feature は、基本的に同じ4層を持ちます。

```text
feature_name/
  presentation/
  application/
  domain/
  infrastructure/
```

---

### 6.1 auth

```text
features/auth/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    auth_controller.dart
    auth_state.dart
    sign_in_use_case.dart
    sign_out_use_case.dart
    watch_auth_state_use_case.dart
    delete_account_use_case.dart
  domain/
    entities/
    repositories/
    value_objects/
  infrastructure/
    datasources/
    models/
    repositories/
    auth_facade.dart
```

**責務**
- メール / Apple / Google 認証
- ログイン状態監視
- ログアウト
- アカウント削除導線

---

### 6.2 profile

```text
features/profile/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    profile_controller.dart
    profile_state.dart
    update_profile_use_case.dart
    watch_profile_use_case.dart
  domain/
    entities/
    repositories/
  infrastructure/
    datasources/
    models/
    repositories/
```

**責務**
- 表示名
- アイコン
- 同期済みプロフィール

---

### 6.3 memory_notes

```text
features/memory_notes/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    note_list_controller.dart
    note_detail_controller.dart
    note_create_controller.dart
    note_edit_controller.dart
    note_delete_controller.dart
    create_note_use_case.dart
    update_note_use_case.dart
    delete_note_use_case.dart
    watch_notes_use_case.dart
    watch_note_detail_use_case.dart
  domain/
    entities/
    repositories/
    value_objects/
    services/
  infrastructure/
    datasources/
    models/
    repositories/
    mappers/
```

**責務**
- ノート一覧
- ノート詳細
- 作成 / 編集 / 削除
- 検索や一覧集約値の保持

---

### 6.4 photo_upload

```text
features/photo_upload/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    photo_upload_controller.dart
    photo_upload_state.dart
    pick_photos_use_case.dart
    compress_photos_use_case.dart
    upload_photos_use_case.dart
    delete_photo_use_case.dart
  domain/
    entities/
    repositories/
    services/
  infrastructure/
    datasources/
    models/
    repositories/
```

**責務**
- 写真選択
- 圧縮
- サムネイル生成
- Storage アップロード
- 再試行
- 削除

---

### 6.5 metadata_extraction

```text
features/metadata_extraction/
  application/
    extract_metadata_use_case.dart
    normalize_location_use_case.dart
  domain/
    entities/
    repositories/
    value_objects/
  infrastructure/
    services/
    exif_parser.dart
    location_parser.dart
```

**責務**
- EXIF 読み取り
- 撮影日時
- GPS
- 向き
- 欠損時フォールバック

---

### 6.6 map

```text
features/map/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    map_controller.dart
    map_state.dart
    build_place_groups_use_case.dart
    reverse_geocode_use_case.dart
  domain/
    entities/
    repositories/
    services/
  infrastructure/
    datasources/
    repositories/
    map_adapters/
```

**責務**
- 地図表示
- ピン
- 場所名推定
- スポットグルーピング

---

### 6.7 ai_generation

```text
features/ai_generation/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    ai_generation_controller.dart
    generate_title_use_case.dart
    generate_diary_use_case.dart
    generate_summary_use_case.dart
    regenerate_ai_use_case.dart
  domain/
    entities/
    repositories/
    value_objects/
  infrastructure/
    datasources/
    models/
    repositories/
    cloud_functions_client.dart
```

**責務**
- タイトル生成
- 日記生成
- 要約生成
- フォールバック
- Cloud Functions 呼び出し

---

### 6.8 collaboration

```text
features/collaboration/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    collaboration_controller.dart
    invite_member_use_case.dart
    accept_invite_use_case.dart
    remove_member_use_case.dart
    change_role_use_case.dart
    leave_note_use_case.dart
    transfer_owner_use_case.dart
  domain/
    entities/
    repositories/
    services/
  infrastructure/
    datasources/
    models/
    repositories/
```

**責務**
- 招待
- 参加
- 離脱
- Owner 移譲
- メンバー管理

---

### 6.9 permissions

```text
features/permissions/
  presentation/
    widgets/
    controllers/
  application/
    permission_controller.dart
    check_note_permission_use_case.dart
    check_card_permission_use_case.dart
  domain/
    services/
    repositories/
    entities/
  infrastructure/
    repositories/
```

**責務**
- Owner / Editor / Viewer 判定
- UI 制御
- ルール整合

---

### 6.10 share_card

```text
features/share_card/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    share_card_controller.dart
    generate_share_card_use_case.dart
    preview_share_card_use_case.dart
    save_share_card_use_case.dart
    share_share_card_use_case.dart
  domain/
    entities/
    repositories/
    services/
  infrastructure/
    datasources/
    models/
    repositories/
    renderers/
```

**責務**
- 1:1 / 4:5 / 9:16
- 共有カード生成
- プレビュー
- 端末保存
- 共有シート起動

---

### 6.11 search_calendar

```text
features/search_calendar/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    search_controller.dart
    calendar_controller.dart
    on_this_day_use_case.dart
    search_notes_use_case.dart
    filter_notes_use_case.dart
  domain/
    entities/
    repositories/
  infrastructure/
    datasources/
    repositories/
```

**責務**
- 検索
- カレンダー
- On This Day
- 月次・年次導線

---

### 6.12 settings

```text
features/settings/
  presentation/
    screens/
    widgets/
    controllers/
  application/
    settings_controller.dart
    load_app_settings_use_case.dart
    load_privacy_policy_use_case.dart
    delete_account_use_case.dart
  domain/
    entities/
    repositories/
  infrastructure/
    datasources/
    repositories/
```

**責務**
- 権限説明
- プライバシー
- 規約
- 問い合わせ
- アカウント削除

---

## 7. 画面ファイル一覧

| 画面ID | 画面名 | 推奨ファイル | feature | 備考 |
|---|---|---|---|---|
| SCR-ONB-001 | スプラッシュ / 起動判定 | `features/auth/presentation/screens/splash_screen.dart` | auth | ログイン状態判定 |
| SCR-ONB-002 | 初回オンボーディング | `features/auth/presentation/screens/onboarding_screen.dart` | auth | 価値説明・権限説明導入 |
| SCR-AUTH-001 | ログイン | `features/auth/presentation/screens/sign_in_screen.dart` | auth | Email / Apple / Google |
| SCR-AUTH-002 | アカウント作成 | `features/auth/presentation/screens/sign_up_screen.dart` | auth | 新規登録 |
| SCR-AUTH-003 | プロフィール作成 | `features/profile/presentation/screens/profile_setup_screen.dart` | profile | 初回表示名設定 |
| SCR-HOME-001 | ホーム / ノート一覧 | `features/memory_notes/presentation/screens/note_list_screen.dart` | memory_notes | メイン導線 |
| SCR-HOME-002 | ホーム空状態 | `features/memory_notes/presentation/widgets/note_empty_state.dart` | memory_notes | 空状態Widgetでも可 |
| SCR-CREATE-001 | 作成開始 | `features/memory_notes/presentation/screens/note_create_start_screen.dart` | memory_notes | 作成入口 |
| SCR-CREATE-002 | 写真選択 | `features/photo_upload/presentation/screens/photo_picker_screen.dart` | photo_upload | 複数選択 |
| SCR-UPLOAD-001 | アップロード進捗 | `features/photo_upload/presentation/screens/photo_upload_progress_screen.dart` | photo_upload | 進捗・再試行 |
| SCR-UPLOAD-002 | 処理中 | `features/photo_upload/presentation/screens/photo_processing_screen.dart` | photo_upload | EXIF / 整理待ち |
| SCR-AI-001 | 生成プレビュー | `features/ai_generation/presentation/screens/ai_generation_preview_screen.dart` | ai_generation | 保存前確認 |
| SCR-AI-002 | AIタイトル編集 | `features/ai_generation/presentation/screens/title_edit_screen.dart` | ai_generation | タイトル修正 |
| SCR-AI-003 | AI日記編集 | `features/ai_generation/presentation/screens/diary_edit_screen.dart` | ai_generation | 短文編集 |
| SCR-AI-004 | 場所名編集 | `features/map/presentation/screens/place_name_edit_screen.dart` | map | 推定場所修正 |
| SCR-NOTE-001 | ノート詳細 | `features/memory_notes/presentation/screens/note_detail_screen.dart` | memory_notes | 中核画面 |
| SCR-NOTE-002 | ノート編集 | `features/memory_notes/presentation/screens/note_edit_screen.dart` | memory_notes | 保存後編集 |
| SCR-NOTE-003 | 写真一覧 / スポット一覧 | `features/memory_notes/presentation/screens/note_spot_list_screen.dart` | memory_notes | 時系列・グループ |
| SCR-NOTE-004 | 写真詳細 | `features/memory_notes/presentation/screens/photo_detail_screen.dart` | photo_upload | 単体表示 |
| SCR-MAP-001 | ノート地図 | `features/map/presentation/screens/note_map_screen.dart` | map | ピン・ルート表示 |
| SCR-MAP-002 | カレンダー | `features/search_calendar/presentation/screens/calendar_screen.dart` | search_calendar | 日付で振り返る |
| SCR-MAP-003 | 検索 | `features/search_calendar/presentation/screens/note_search_screen.dart` | search_calendar | 検索 |
| SCR-MAP-004 | On This Day | `features/search_calendar/presentation/screens/on_this_day_screen.dart` | search_calendar | 将来の振り返り |
| SCR-SHARE-001 | 共有メンバー管理 | `features/collaboration/presentation/screens/member_management_screen.dart` | collaboration | Owner管理 |
| SCR-SHARE-002 | メンバー招待 | `features/collaboration/presentation/screens/invite_member_screen.dart` | collaboration | 招待リンク / メール |
| SCR-SHARE-003 | 権限変更 | `features/collaboration/presentation/screens/role_change_screen.dart` | collaboration | Ownerのみ |
| SCR-SHARE-004 | 共有ノート離脱 | `features/collaboration/presentation/screens/leave_note_screen.dart` | collaboration | 自己離脱 |
| SCR-SHARE-005 | 削除確認 | `features/memory_notes/presentation/screens/note_delete_confirm_screen.dart` | memory_notes | Ownerのみ |
| SCR-CARD-001 | 共有カード設定 | `features/share_card/presentation/screens/share_card_setup_screen.dart` | share_card | 比率・テンプレ |
| SCR-CARD-002 | カードプレビュー | `features/share_card/presentation/screens/share_card_preview_screen.dart` | share_card | 位置ぼかし確認 |
| SCR-CARD-003 | カード保存完了 | `features/share_card/presentation/screens/share_card_saved_screen.dart` | share_card | 保存後導線 |
| SCR-CARD-004 | 共有シート起動案内 | `features/share_card/presentation/screens/share_sheet_screen.dart` | share_card | OS共有へ |
| SCR-SET-001 | 設定トップ | `features/settings/presentation/screens/settings_screen.dart` | settings | 集約画面 |
| SCR-SET-002 | 権限説明 | `features/settings/presentation/screens/permission_explanation_screen.dart` | settings | 写真/位置/AI |
| SCR-SET-003 | プライバシー | `features/settings/presentation/screens/privacy_policy_screen.dart` | settings | 規約・削除説明 |
| SCR-SET-004 | 利用規約 | `features/settings/presentation/screens/terms_screen.dart` | settings | 規約 |
| SCR-SET-005 | 問い合わせ | `features/settings/presentation/screens/contact_screen.dart` | settings | サポート導線 |
| SCR-ERR-001 | 権限不足 | `core/widgets/permission_denied_view.dart` | core | 汎用化可 |
| SCR-ERR-002 | 空状態 | `core/widgets/empty_state_view.dart` | core | 汎用化可 |
| SCR-ERR-003 | アップロード失敗 | `features/photo_upload/presentation/screens/photo_upload_error_screen.dart` | photo_upload | 再試行 |
| SCR-ERR-004 | AI失敗 | `features/ai_generation/presentation/screens/ai_generation_error_screen.dart` | ai_generation | フォールバック |
| SCR-ERR-005 | 削除失敗 | `features/memory_notes/presentation/screens/note_delete_error_screen.dart` | memory_notes | 再試行 |

---

## 8. domain entity一覧

以下を `domain/entities/` に配置します。

### 8.1 AppUser
```text
features/profile/domain/entities/app_user.dart
```
- userId
- displayName
- photoUrl
- email
- authProviders
- locale
- timezone
- status
- createdAt
- updatedAt

### 8.2 MemoryNote
```text
features/memory_notes/domain/entities/memory_note.dart
```
- noteId
- ownerUserId
- title
- summary
- coverPhotoId
- noteDate
- totalPhotoCount
- totalSpotCount
- totalMemberCount
- tags
- status
- visibility
- createdAt
- updatedAt

### 8.3 NoteMember
```text
features/collaboration/domain/entities/note_member.dart
```
- userId
- noteId
- role
- status
- joinedAt
- invitedAt
- invitedBy
- isOwner

### 8.4 NotePhoto
```text
features/photo_upload/domain/entities/note_photo.dart
```
- photoId
- noteId
- uploadedBy
- storagePath
- thumbnailPath
- takenAt
- gpsLat
- gpsLng
- hasExif
- hasGps
- placeName
- sortOrder
- groupId
- status

### 8.5 PlaceGroup
```text
features/map/domain/entities/place_group.dart
```
- groupId
- noteId
- groupOrder
- title
- placeName
- centerLat
- centerLng
- photoCount
- startAt
- endAt
- representativePhotoId

### 8.6 AiResult
```text
features/ai_generation/domain/entities/ai_result.dart
```
- aiResultId
- noteId
- requestType
- promptVersion
- inputSummary
- outputText
- tone
- status
- createdAt
- updatedAt

### 8.7 ShareCard
```text
features/share_card/domain/entities/share_card.dart
```
- shareCardId
- noteId
- format
- templateType
- locationVisibility
- storagePath
- previewPath
- createdAt
- updatedAt

### 8.8 Invitation
```text
features/collaboration/domain/entities/invitation.dart
```
- invitationId
- noteId
- invitedEmail
- invitedUserId
- invitedRole
- token
- expiresAt
- status
- createdAt

### 8.9 UsageLimit
```text
features/ai_generation/domain/entities/usage_limit.dart
```
- userId
- aiRequestsToday
- aiRequestsThisMonth
- lastResetAt
- status

### 8.10 AuditLog
```text
features/settings/domain/entities/audit_log.dart
```
- logId
- actorUserId
- action
- targetType
- targetId
- metadata
- createdAt

---

## 9. Repository interface一覧

### auth
- `AuthRepository`
  - signInWithEmail
  - signInWithGoogle
  - signInWithApple
  - signOut
  - watchAuthState
  - deleteAccount

### profile
- `ProfileRepository`
  - watchProfile
  - updateProfile
  - createProfile

### memory_notes
- `MemoryNoteRepository`
  - watchNotes
  - watchNote
  - createNote
  - updateNote
  - deleteNote
  - searchNotes

### photo_upload
- `PhotoRepository`
  - pickPhotos
  - compressPhotos
  - uploadPhotos
  - deletePhoto
  - watchUploadProgress

### metadata_extraction
- `MetadataRepository`
  - extractExif
  - normalizeMetadata

### map
- `MapRepository`
  - reverseGeocode
  - getPlaceGroups
  - buildMapPins

### ai_generation
- `AiRepository`
  - generateTitle
  - generateDiary
  - generateSummary
  - regenerate
  - getUsageLimit

### collaboration
- `CollaborationRepository`
  - watchMembers
  - inviteMember
  - acceptInvitation
  - changeRole
  - removeMember
  - leaveNote
  - transferOwner

### permissions
- `PermissionRepository`
  - canReadNote
  - canEditNote
  - canDeleteNote
  - canGenerateShareCard

### share_card
- `ShareCardRepository`
  - generateShareCard
  - previewShareCard
  - saveShareCard
  - shareShareCard
  - deleteShareCard

### search_calendar
- `SearchRepository`
  - searchNotes
  - getNotesByMonth
  - getOnThisDayNotes

### settings
- `SettingsRepository`
  - loadAppSettings
  - loadPrivacyPolicy
  - loadTerms
  - sendContact
  - deleteAccountData

---

## 10. UseCase一覧

### auth
- `SignInWithEmailUseCase`
- `SignInWithGoogleUseCase`
- `SignInWithAppleUseCase`
- `SignOutUseCase`
- `WatchAuthStateUseCase`
- `DeleteAccountUseCase`

### profile
- `CreateProfileUseCase`
- `UpdateProfileUseCase`
- `WatchProfileUseCase`

### memory_notes
- `CreateNoteUseCase`
- `WatchNotesUseCase`
- `WatchNoteDetailUseCase`
- `UpdateNoteUseCase`
- `DeleteNoteUseCase`
- `SearchNotesUseCase`

### photo_upload
- `PickPhotosUseCase`
- `CompressPhotosUseCase`
- `UploadPhotosUseCase`
- `DeletePhotoUseCase`

### metadata_extraction
- `ExtractMetadataUseCase`
- `NormalizeMetadataUseCase`

### map
- `BuildPlaceGroupsUseCase`
- `ReverseGeocodeUseCase`
- `BuildMapPinsUseCase`

### ai_generation
- `GenerateTitleUseCase`
- `GenerateDiaryUseCase`
- `GenerateSummaryUseCase`
- `RegenerateAiUseCase`

### collaboration
- `InviteMemberUseCase`
- `AcceptInvitationUseCase`
- `ChangeRoleUseCase`
- `RemoveMemberUseCase`
- `LeaveNoteUseCase`
- `TransferOwnerUseCase`

### permissions
- `CheckNotePermissionUseCase`
- `CheckCardPermissionUseCase`

### share_card
- `GenerateShareCardUseCase`
- `PreviewShareCardUseCase`
- `SaveShareCardUseCase`
- `ShareShareCardUseCase`

### search_calendar
- `GetNotesByMonthUseCase`
- `SearchNotesUseCase`
- `GetOnThisDayNotesUseCase`

### settings
- `LoadAppSettingsUseCase`
- `LoadPrivacyPolicyUseCase`
- `LoadTermsUseCase`
- `SendContactUseCase`

---

## 11. Riverpod provider設計

### 11.1 基本方針
- Repository は `Provider`
- UseCase は `Provider`
- Controller / Notifier は `NotifierProvider` か `AsyncNotifierProvider`
- 画面は Provider を直接読まず、Controller 経由で状態を見る
- テストでは provider override 可能にする

### 11.2 代表的な provider
```text
lib/core/di/providers.dart
lib/core/di/firebase_providers.dart
```

### 11.3 feature別の例
- `authStateProvider`
- `authControllerProvider`
- `profileControllerProvider`
- `noteListControllerProvider`
- `noteDetailControllerProvider`
- `photoUploadControllerProvider`
- `aiGenerationControllerProvider`
- `collaborationControllerProvider`
- `shareCardControllerProvider`
- `searchControllerProvider`
- `settingsControllerProvider`

### 11.4 推奨形
- Repository: `Provider<AuthRepository>`
- UseCase: `Provider<SignInWithEmailUseCase>`
- Controller: `AsyncNotifierProvider<NoteListController, NoteListState>`

### 11.5 依存の流れ
```text
UI
  -> Controller / Notifier
  -> UseCase
  -> Repository Interface
  -> Infrastructure Implementation
  -> Firebase / API
```

---

## 12. go_router設計

### 12.1 ルート方針
- `go_router` を中心に画面遷移を管理
- 認証状態で遷移制御
- invite link を deep link として受ける
- note detail / share card / settings は固定ルートで扱う

### 12.2 ルート例
```text
/
/login
/onboarding
/signup
/profile-setup
/home
/notes/:noteId
/notes/:noteId/edit
/notes/:noteId/photos
/notes/:noteId/map
/notes/:noteId/share-card
/notes/:noteId/members
/settings
/settings/privacy
/settings/terms
/settings/permissions
/invite/:token
```

### 12.3 必須要素

#### auth guard
- 未ログイン時は `/login` または `/onboarding` へ
- ログイン済みなら `/home` へ
- 初回未完了のプロフィールは `/profile-setup`

#### invite link route
- `/invite/:token`
- 招待トークンを読み込み
- 参加確認後に `/notes/:noteId` へ遷移

#### note detail route
- `/notes/:noteId`
- 共有ノートでも個人ノートでも同一詳細画面

#### share card route
- `/notes/:noteId/share-card`
- フォーマット選択、プレビュー、保存、共有

#### settings route
- `/settings`
- `/settings/privacy`
- `/settings/terms`
- `/settings/permissions`

---

## 13. DTO / Mapper設計

### 13.1 ルール
- Firestore の生データは `model` として受ける
- domain entity に変換する mapper を作る
- 画面に Firebase 型を直接渡さない

### 13.2 位置
```text
features/*/infrastructure/models/
features/*/infrastructure/mappers/
```

### 13.3 代表例
- `app_user_model.dart` ↔ `AppUser`
- `memory_note_model.dart` ↔ `MemoryNote`
- `note_member_model.dart` ↔ `NoteMember`
- `note_photo_model.dart` ↔ `NotePhoto`
- `place_group_model.dart` ↔ `PlaceGroup`
- `ai_result_model.dart` ↔ `AiResult`
- `share_card_model.dart` ↔ `ShareCard`
- `invitation_model.dart` ↔ `Invitation`

### 13.4 変換責務
- `fromJson`
- `toJson`
- `toEntity`
- `fromEntity`

### 13.5 補助DTO
- `CreateNoteRequest`
- `UpdateNoteRequest`
- `GenerateAiRequest`
- `ShareCardRequest`
- `InviteMemberRequest`

---

## 14. テスト構成

```text
test/
  core/
  features/
    auth/
    profile/
    memory_notes/
    photo_upload/
    metadata_extraction/
    map/
    ai_generation/
    collaboration/
    permissions/
    share_card/
    search_calendar/
    settings/
  fakes/
  helpers/

integration_test/
  app_flow_test.dart
  auth_flow_test.dart
  create_note_flow_test.dart
  share_card_flow_test.dart
```

### 14.1 unit test
- UseCase
- Entity
- ValueObject
- Validator
- Mapper

### 14.2 widget test
- Screen
- Widget
- Empty state
- Error state
- Permission denied state

### 14.3 repository test
- Repository 実装
- DTO <-> Entity 変換
- Firestore / Storage の呼び出し確認

### 14.4 fake repository
- `FakeAuthRepository`
- `FakeMemoryNoteRepository`
- `FakePhotoRepository`
- `FakeAiRepository`
- `FakeCollaborationRepository`
- `FakeShareCardRepository`

### 14.5 Firebase emulator test
- Auth emulator
- Firestore emulator
- Storage emulator
- Security Rules の確認
- 招待・削除・権限のルール検証

### 14.6 integration test
- 初回登録
- ノート作成
- 写真アップロード
- AI生成
- 共有カード作成
- 招待参加
- 削除導線

---

## 15. 命名規則

### ファイル名
- `snake_case.dart`

### クラス名
- `PascalCase`

### Provider名
- `xxxProvider`

### UseCase名
- `VerbNounUseCase`

### Controller名
- `XxxController`

### State名
- `XxxState`

### Repository名
- `XxxRepository`

### DTO/Model
- `XxxModel`

### Entity
- `Xxx`

### 画面
- `XxxScreen`

### Widget
- `XxxWidget`
- `XxxView`
- `XxxCard`

---

## 16. 最初に作るべきファイル

優先順位が高い順です。

1. `lib/main.dart`
2. `lib/app.dart`
3. `lib/core/di/providers.dart`
4. `lib/core/routing/app_router.dart`
5. `lib/core/theme/app_theme.dart`
6. `lib/features/auth/presentation/screens/splash_screen.dart`
7. `lib/features/auth/presentation/screens/sign_in_screen.dart`
8. `lib/features/memory_notes/presentation/screens/note_list_screen.dart`
9. `lib/features/memory_notes/presentation/screens/note_detail_screen.dart`
10. `lib/features/memory_notes/presentation/screens/note_create_start_screen.dart`
11. `lib/features/photo_upload/presentation/screens/photo_picker_screen.dart`
12. `lib/features/ai_generation/presentation/screens/ai_generation_preview_screen.dart`
13. `lib/features/share_card/presentation/screens/share_card_setup_screen.dart`
14. `lib/features/collaboration/presentation/screens/member_management_screen.dart`
15. `lib/features/settings/presentation/screens/settings_screen.dart`
16. `functions/src/index.ts`
17. `firebase/firestore.rules`
18. `firebase/storage.rules`

---

## 17. 将来分割候補

Release v1 では大きくしすぎない前提で、将来分割候補を挙げます。

### 分割候補
- `memory_notes` の中をさらに
  - `note_list`
  - `note_detail`
  - `note_edit`
  - `note_create`
  に分割
- `share_card` の中を
  - `template`
  - `renderer`
  - `preview`
  に分割
- `ai_generation` の中を
  - `title`
  - `diary`
  - `summary`
  に分割
- `collaboration` の中を
  - `invite`
  - `member_management`
  - `ownership`
  に分割
- `settings` の中を
  - `privacy`
  - `terms`
  - `support`
  に分割

### 将来独立可能な共通化
- 画像処理共通モジュール
- 招待共通モジュール
- 権限判定共通モジュール
- カード描画共通モジュール

---

## 18. 未決定事項

Release v1 実装前に、人間承認または最終確定が必要な項目です。

| 論点 | 状態 | 影響 |
|---|---|---|
| Firebase / Supabase などの最終採用 | 未決定 | Repository 実装が変わる |
| 地図SDKの最終選定 | 未決定 | `map` feature の実装差分が出る |
| 原本画像の正式保存可否 | 未決定 | Storage 構成とコストに影響 |
| SNS共有カードの最終テンプレ数 | 未決定 | `share_card` の UI/Renderer に影響 |
| AI送信項目の最終線引き | 未決定 | `ai_generation` と `Cloud Functions` に影響 |
| 招待方式の優先順位 | 未決定 | invite route と UI に影響 |
| 位置情報の公開レベル既定値 | 未決定 | 共有カード仕様に影響 |
| 退会時のデータ削除ポリシー | 未決定 | `settings` / `delete_account` に影響 |

---

必要であれば次に、以下のどちらかを作れます。

1. **この構成をそのまま使える `lib/` の詳細ツリー版**
2. **各ファイルの役割をさらに一段細かくした実装タスクリスト版**