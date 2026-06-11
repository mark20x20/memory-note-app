# Figma Make UI Reference Map

## 概要

Memory Note アプリの画面名（仕様書 `final_spec/04_ui_ux/01_screen_list.md` より）と、
Expo Router 実装コード上のルートパスの対応表です。

Figma Make でUI草案を生成する際は、下記の画面IDとルートを参照してください。

---

## 対応表

| 画面ID | 仕様書の画面名 | 現在のルート / 予定ルート | 実装ファイル | 実装状態 | 実装Phase | Figma生成対象 | Figma作成優先度 | 任意UI草案保存場所 | 備考 |
|---|---|---|---|---|---|---|---|---|---|
| SCR-ONB-001 | スプラッシュ / 起動判定 | `/` | `app/index.tsx` | ✅ 実装済 | Phase 0〜2 | — | — | — | 認証状態判定のみ |
| SCR-ONB-002 | 初回オンボーディング | `/(auth)/onboarding` | `app/(auth)/onboarding.tsx` | ✅ 実装済 | Phase 2 | ○ | B | phase14_settings/ | Phase 14 でUI改善予定 |
| SCR-AUTH-001 | ログイン | `/(auth)/login` | `app/(auth)/login.tsx` | ✅ 実装済 | Phase 2 | ○ | B | phase14_settings/ | coral テーマ適用は Phase 14 |
| SCR-AUTH-002 | アカウント作成 | `/(auth)/sign-up` | `app/(auth)/sign-up.tsx` | ✅ 実装済 | Phase 2 | ○ | B | phase14_settings/ | coral テーマ適用は Phase 14 |
| SCR-AUTH-003 | プロフィール作成 | `/(auth)/profile-setup` | `app/(auth)/profile-setup.tsx` | ✅ 実装済 | Phase 2 | ○ | B | phase14_settings/ | coral テーマ適用は Phase 14 |
| SCR-HOME-001 | ホーム / ノート一覧 | `/(app)/home` | `app/(app)/home.tsx` | ✅ 実装済（Phase 7: coverPhotoURL表示対応） | Phase 5〜7 | ○ | **A** | phase5_memory_note_creation/ | ノートカードに代表写真表示 |
| SCR-HOME-002 | ホーム空状態 | `/(app)/home` | `app/(app)/home.tsx` | ✅ UI実装済（Phase 4） | Phase 4 | — | — | — | ✅ 完了 |
| SCR-CREATE-001 | 作成開始 | `/(app)/create` | `app/(app)/create/index.tsx` | 🟡 Placeholder | Phase 5 | ○ | **A** | phase5_memory_note_creation/ | Phase 5 本実装 |
| SCR-CREATE-002 | 写真選択 | `/(app)/create` | `app/(app)/create/index.tsx` | ✅ Phase 7 実装済み（アップロードフロー含む） | Phase 6〜7 | ○ | **A** | phase5_memory_note_creation/ | expo-image-picker + uploadBytesResumable |
| SCR-UPLOAD-001 | アップロード進捗 | `/(app)/create` | `app/(app)/create/index.tsx` | ✅ Phase 7 実装済み（Create画面内プログレスバー） | Phase 7 | — | — | — | 別画面化せず Create 画面内に統合 |
| SCR-UPLOAD-002 | 処理中 | `/(app)/create/processing` | `app/(app)/create/processing.tsx` | ❌ 未実装 | Phase 7 | ○ | **A** | phase6_upload_processing/ | EXIF解析・整理中 |
| SCR-AI-001 | 生成プレビュー | `/(app)/create/ai-preview` | `app/(app)/create/ai-preview.tsx` | ❌ 未実装 | Phase 9 | ○ | **A** | phase9_ai_generation/ | AI草案確認・保存 |
| SCR-AI-002 | AIタイトル編集 | `/(app)/create/ai-title-edit` | `app/(app)/create/ai-title-edit.tsx` | ❌ 未実装 | Phase 9 | ○ | **A** | phase9_ai_generation/ | インライン編集 |
| SCR-AI-003 | AI日記編集 | `/(app)/create/ai-diary-edit` | `app/(app)/create/ai-diary-edit.tsx` | ❌ 未実装 | Phase 9 | ○ | **A** | phase9_ai_generation/ | インライン編集 |
| SCR-AI-004 | 場所名編集 | `/(app)/create/ai-place-edit` | `app/(app)/create/ai-place-edit.tsx` | ❌ 未実装 | Phase 9 | ○ | C | phase9_ai_generation/ | P1 |
| SCR-NOTE-001 | ノート詳細 | `/(app)/notes/[noteId]` | `app/(app)/notes/[noteId].tsx` | ✅ Phase 7 実装済み（実写真表示・useNotePhotos） | Phase 7 | ○ | **A** | phase9_ai_generation/ | AI日記・地図は Phase 8〜9 |
| SCR-NOTE-002 | ノート編集 | `/(app)/notes/[noteId]/edit` | `app/(app)/notes/[noteId]/edit.tsx` | ❌ 未実装 | Phase 10 | ○ | B | phase10_note_detail/ | |
| SCR-NOTE-003 | 写真一覧 / スポット一覧 | `/(app)/notes/[noteId]/photos` | `app/(app)/notes/[noteId]/photos.tsx` | ❌ 未実装 | Phase 10 | ○ | B | phase10_note_detail/ | |
| SCR-NOTE-004 | 写真詳細 | `/(app)/notes/[noteId]/photos/[photoId]` | `app/(app)/notes/[noteId]/photos/[photoId].tsx` | ❌ 未実装 | Phase 10 | ○ | C | phase10_note_detail/ | P1 |
| SCR-MAP-001 | ノート地図 | `/(app)/notes/[noteId]/map` | `app/(app)/notes/[noteId]/map.tsx` | ❌ 未実装 | Phase 8 | ○ | **A** | phase8_map/ | |
| SCR-MAP-002 | カレンダー | `/(app)/calendar` | `app/(app)/calendar.tsx` | ❌ 未実装 | Phase 13 | ○ | B | phase13_calendar_search/ | |
| SCR-MAP-003 | 検索 | `/(app)/search` | `app/(app)/search.tsx` | ❌ 未実装 | Phase 13 | ○ | B | phase13_calendar_search/ | |
| SCR-MAP-004 | On This Day | `/(app)/calendar/on-this-day` | `app/(app)/calendar/on-this-day.tsx` | ❌ 未実装 | Phase 13 | ○ | C | phase13_calendar_search/ | P1 |
| SCR-SHARE-001 | 共有メンバー管理 | `/(app)/notes/[noteId]/members` | `app/(app)/notes/[noteId]/members.tsx` | ❌ 未実装 | Phase 11 | ○ | B | phase11_collaboration/ | |
| SCR-SHARE-002 | メンバー招待 | `/(app)/notes/[noteId]/invite` | `app/(app)/notes/[noteId]/invite.tsx` | ❌ 未実装 | Phase 11 | ○ | B | phase11_collaboration/ | |
| SCR-SHARE-003 | 権限変更 | `/(app)/notes/[noteId]/permissions` | `app/(app)/notes/[noteId]/permissions.tsx` | ❌ 未実装 | Phase 11 | ○ | B | phase11_collaboration/ | |
| SCR-SHARE-004 | 共有ノート離脱 | `/(app)/notes/[noteId]/leave` | `app/(app)/notes/[noteId]/leave.tsx` | ❌ 未実装 | Phase 11 | ○ | B | phase11_collaboration/ | |
| SCR-SHARE-005 | 削除確認 | `/(app)/notes/[noteId]/delete` | `app/(app)/notes/[noteId]/delete.tsx` | ❌ 未実装 | Phase 10 | ○ | B | phase10_note_detail/ | |
| SCR-CARD-001 | 共有カード設定 | `/(app)/notes/[noteId]/share-card` | `app/(app)/notes/[noteId]/share-card/index.tsx` | ❌ 未実装 | Phase 12 | ○ | B | phase12_share_card/ | |
| SCR-CARD-002 | カードプレビュー | `/(app)/notes/[noteId]/share-card/preview` | `app/(app)/notes/[noteId]/share-card/preview.tsx` | ❌ 未実装 | Phase 12 | ○ | B | phase12_share_card/ | |
| SCR-CARD-003 | カード保存完了 | `/(app)/notes/[noteId]/share-card/saved` | `app/(app)/notes/[noteId]/share-card/saved.tsx` | ❌ 未実装 | Phase 12 | ○ | B | phase12_share_card/ | |
| SCR-CARD-004 | 共有シート起動案内 | `/(app)/notes/[noteId]/share-card/share` | `app/(app)/notes/[noteId]/share-card/share.tsx` | ❌ 未実装 | Phase 12 | ○ | B | phase12_share_card/ | |
| SCR-SET-001 | 設定トップ | `/(app)/settings` | `app/(app)/settings.tsx` | 🟡 Placeholder | Phase 14 詳細 | ○ | B | phase14_settings/ | Profile表示済み |
| SCR-SET-002 | 権限説明 | `/(app)/settings/permissions` | `app/(app)/settings/permissions.tsx` | ❌ 未実装 | Phase 14 | ○ | B | phase14_settings/ | |
| SCR-SET-003 | プライバシー | `/(app)/settings/privacy` | `app/(app)/settings/privacy.tsx` | ❌ 未実装 | Phase 14 | ○ | B | phase14_settings/ | |
| SCR-SET-004 | 利用規約 | `/(app)/settings/terms` | `app/(app)/settings/terms.tsx` | ❌ 未実装 | Phase 14 | ○ | B | phase14_settings/ | |
| SCR-SET-005 | 問い合わせ | `/(app)/settings/support` | `app/(app)/settings/support.tsx` | ❌ 未実装 | Phase 14 | ○ | C | phase14_settings/ | P1 |
| SCR-ERR-001 | 権限不足 | — | 共通コンポーネント | ❌ 未実装 | Phase 11 | ○ | B | phase11_collaboration/ | |
| SCR-ERR-002 | 空状態 | — | `EmptyState.tsx` | ✅ 実装済 | Phase 3 | — | — | — | ✅ 汎用コンポーネント済み |
| SCR-ERR-003 | アップロード失敗 | — | `/(app)/create/index.tsx` 内 | ✅ Phase 7 実装済み（エラー表示＋ノート確認ボタン） | Phase 7 | — | — | — | 再試行は Phase 10 で詳細実装 |
| SCR-ERR-004 | AI失敗 | — | `/(app)/create/ai-preview` 内 | ❌ 未実装 | Phase 9 | ○ | **A** | phase9_ai_generation/ | フォールバック |
| SCR-ERR-005 | 削除失敗 | — | 共通コンポーネント | ❌ 未実装 | Phase 10 | ○ | C | phase10_note_detail/ | P1 |

---

## ルートグループ構成（予定含む）

```
app/
├── index.tsx                              # 起動判定（SCR-ONB-001）
├── _layout.tsx                            # ルートレイアウト（SafeAreaProvider / AuthProvider）
├── (auth)/
│   ├── _layout.tsx                        # 認証ガード
│   ├── onboarding.tsx                     # SCR-ONB-002
│   ├── login.tsx                          # SCR-AUTH-001
│   ├── sign-up.tsx                        # SCR-AUTH-002
│   └── profile-setup.tsx                  # SCR-AUTH-003
└── (app)/
    ├── _layout.tsx                        # 認証ガード
    ├── home.tsx                           # SCR-HOME-001 / SCR-HOME-002
    ├── settings.tsx                       # SCR-SET-001
    ├── calendar.tsx                       # SCR-MAP-002（Phase 13）
    ├── search.tsx                         # SCR-MAP-003（Phase 13）
    ├── calendar/
    │   └── on-this-day.tsx                # SCR-MAP-004（Phase 13）
    ├── settings/
    │   ├── permissions.tsx                # SCR-SET-002（Phase 14）
    │   ├── privacy.tsx                    # SCR-SET-003（Phase 14）
    │   ├── terms.tsx                      # SCR-SET-004（Phase 14）
    │   └── support.tsx                    # SCR-SET-005（Phase 14）
    ├── create/
    │   ├── index.tsx                      # SCR-CREATE-001
    │   ├── upload.tsx                     # SCR-UPLOAD-001（Phase 7）
    │   ├── processing.tsx                 # SCR-UPLOAD-002（Phase 7）
    │   ├── ai-preview.tsx                 # SCR-AI-001（Phase 9）
    │   ├── ai-title-edit.tsx              # SCR-AI-002（Phase 9）
    │   ├── ai-diary-edit.tsx              # SCR-AI-003（Phase 9）
    │   └── ai-place-edit.tsx              # SCR-AI-004（Phase 9）
    └── notes/
        └── [noteId]/
            ├── index.tsx                  # SCR-NOTE-001（Phase 9〜10）
            ├── edit.tsx                   # SCR-NOTE-002（Phase 10）
            ├── photos.tsx                 # SCR-NOTE-003（Phase 10）
            ├── map.tsx                    # SCR-MAP-001（Phase 8）
            ├── members.tsx                # SCR-SHARE-001（Phase 11）
            ├── invite.tsx                 # SCR-SHARE-002（Phase 11）
            ├── permissions.tsx            # SCR-SHARE-003（Phase 11）
            ├── leave.tsx                  # SCR-SHARE-004（Phase 11）
            ├── delete.tsx                 # SCR-SHARE-005（Phase 10）
            ├── photos/
            │   └── [photoId].tsx          # SCR-NOTE-004（Phase 10）
            └── share-card/
                ├── index.tsx              # SCR-CARD-001（Phase 12）
                ├── preview.tsx            # SCR-CARD-002（Phase 12）
                ├── saved.tsx              # SCR-CARD-003（Phase 12）
                └── share.tsx              # SCR-CARD-004（Phase 12）
```

> **注意**: `notes/[noteId].tsx` → `notes/[noteId]/index.tsx` への移行は、`[noteId]` 配下にサブルートを追加する際（Phase 8 以降）に実施する。現在の `notes/[noteId].tsx` は Phase 8 まで現状維持。

---

## カラーパレット（UI方針 → 実装マッピング）

| 用途 | 仕様書の値 | `colors.ts` トークン |
|---|---|---|
| 背景（クリーム） | `#FAF7F2` | `colors.background` |
| カード背景 | `#FFFFFF` | `colors.surface` |
| 薄い面（アイボリー） | `#F4EEE6` | `colors.surfaceIvory` |
| 暖かい面 | `#FFF9F4` | `colors.surfaceWarm` |
| メインアクセント（コーラル） | `#F26B5B` | `colors.primary` |
| コーラル淡 | `#FEF0EE` | `colors.primaryLight` |
| 地図アクセント（ティール） | `#4FA8A1` | `colors.mapAccent` |
| ティール淡 | `#E6F4F3` | `colors.mapAccentLight` |
| テキスト（メイン） | `#2E2A27` | `colors.textPrimary` |
| テキスト（サブ） | `#7A746D` | `colors.textSecondary` |
| テキスト（補助） | `#B8AD9F` | `colors.textTertiary` |
| 区切り線 | `#E8DED4` | `colors.border` |

---

## UI実装・Figma Make 参照方針

> **方針（Phase 4.5 後）**: Figma Make は任意ツールです。使えない場合は `ui_design_system.md` と本ファイルを参照して直接 React Native 実装を進めてください。

### 実装時に必ず参照するドキュメント

1. **UIデザインルール（必須）**: `generated_ui/figma_make/ui_design_system.md`
2. **実装反映ルール（必須）**: `generated_ui/figma_make/implementation_rules.md`
3. **Phase計画（必須）**: `generated_ui/figma_make/phase_plan.md`
4. **画面優先順位（必須）**: `generated_ui/figma_make/screen_priority.md`

### Figma Make を使う場合のみ参照するドキュメント（任意）

5. **共通ベースプロンプト**: `generated_ui/figma_make/figma_make_common_prompt.md` §2
6. **画面別追加プロンプト**: `generated_ui/figma_make/figma_make_common_prompt.md` §3
7. **生成・保存ルール**: `generated_ui/figma_make/generation_rules.md`

---

## 更新履歴

| 日付 | 更新内容 |
|---|---|
| 2026-06-11 | Phase 4 で初版作成 |
| 2026-06-11 | Phase 4.5 で大幅補強: 予定ルート追加, Figma生成対象/優先度/Phase/保存場所列追加, ルートグループ更新 |
| 2026-06-11 | Phase 7 完了: SCR-HOME-001, SCR-CREATE-002, SCR-UPLOAD-001, SCR-NOTE-001, SCR-ERR-003 を実装済みに更新 |