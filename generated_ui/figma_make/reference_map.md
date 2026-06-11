# Figma Make UI Reference Map

## 概要

Memory Note アプリの画面名（仕様書 `final_spec/04_ui_ux/01_screen_list.md` より）と、
Expo Router 実装コード上のルートパスの対応表です。

Figma Make でUI草案を生成する際は、下記の画面IDとルートを参照してください。

---

## 対応表

| 画面ID | 仕様書の画面名 | Expo Router ルート | 実装ファイル | 実装状態 |
|---|---|---|---|---|
| SCR-ONB-001 | スプラッシュ / 起動判定 | `/` | `app/index.tsx` | ✅ 実装済 |
| SCR-ONB-002 | 初回オンボーディング | `/(auth)/onboarding` | `app/(auth)/onboarding.tsx` | ✅ 実装済 |
| SCR-AUTH-001 | ログイン | `/(auth)/login` | `app/(auth)/login.tsx` | ✅ 実装済 |
| SCR-AUTH-002 | アカウント作成 | `/(auth)/sign-up` | `app/(auth)/sign-up.tsx` | ✅ 実装済 |
| SCR-AUTH-003 | プロフィール作成 | `/(auth)/profile-setup` | `app/(auth)/profile-setup.tsx` | ✅ 実装済 |
| SCR-HOME-001 | ホーム / ノート一覧 | `/(app)/home` | `app/(app)/home.tsx` | 🟡 Placeholder（空状態のみ） |
| SCR-HOME-002 | ホーム空状態 | `/(app)/home` | `app/(app)/home.tsx` | ✅ UI実装済（Phase 4） |
| SCR-CREATE-001 | 作成開始 | `/(app)/create` | `app/(app)/create/index.tsx` | 🟡 Placeholder（Phase 5で本実装） |
| SCR-CREATE-002 | 写真選択 | `/(app)/create` | `app/(app)/create/index.tsx` | ❌ 未実装（Phase 5） |
| SCR-UPLOAD-001 | アップロード進捗 | 未定 | 未作成 | ❌ 未実装（Phase 6） |
| SCR-UPLOAD-002 | 処理中 | 未定 | 未作成 | ❌ 未実装（Phase 6） |
| SCR-AI-001 | 生成プレビュー | 未定 | 未作成 | ❌ 未実装（Phase 9） |
| SCR-AI-002 | AIタイトル編集 | 未定 | 未作成 | ❌ 未実装（Phase 9） |
| SCR-AI-003 | AI日記編集 | 未定 | 未作成 | ❌ 未実装（Phase 9） |
| SCR-AI-004 | 場所名編集 | 未定 | 未作成 | ❌ 未実装（Phase 9） |
| SCR-NOTE-001 | ノート詳細 | `/(app)/notes/[noteId]` | `app/(app)/notes/[noteId].tsx` | 🟡 Placeholder（Phase 9で本実装） |
| SCR-NOTE-002 | ノート編集 | 未定 | 未作成 | ❌ 未実装（Phase 9） |
| SCR-NOTE-003 | 写真一覧 / スポット一覧 | 未定 | 未作成 | ❌ 未実装（Phase 9） |
| SCR-NOTE-004 | 写真詳細 | 未定 | 未作成 | ❌ 未実装（Phase 9） |
| SCR-MAP-001 | ノート地図 | 未定 | 未作成 | ❌ 未実装（Phase 8） |
| SCR-MAP-002 | カレンダー | 未定 | 未作成 | ❌ 未実装（Phase 11） |
| SCR-MAP-003 | 検索 | 未定 | 未作成 | ❌ 未実装（Phase 11） |
| SCR-MAP-004 | On This Day | 未定 | 未作成 | ❌ 未実装（Phase 11） |
| SCR-SHARE-001 | 共有メンバー管理 | 未定 | 未作成 | ❌ 未実装（Phase 10） |
| SCR-SHARE-002 | メンバー招待 | 未定 | 未作成 | ❌ 未実装（Phase 10） |
| SCR-SHARE-003 | 権限変更 | 未定 | 未作成 | ❌ 未実装（Phase 10） |
| SCR-SHARE-004 | 共有ノート離脱 | 未定 | 未作成 | ❌ 未実装（Phase 10） |
| SCR-SHARE-005 | 削除確認 | 未定 | 未作成 | ❌ 未実装（Phase 9） |
| SCR-CARD-001 | 共有カード設定 | 未定 | 未作成 | ❌ 未実装（Phase 12） |
| SCR-CARD-002 | カードプレビュー | 未定 | 未作成 | ❌ 未実装（Phase 12） |
| SCR-CARD-003 | カード保存完了 | 未定 | 未作成 | ❌ 未実装（Phase 12） |
| SCR-CARD-004 | 共有シート起動案内 | 未定 | 未作成 | ❌ 未実装（Phase 12） |
| SCR-SET-001 | 設定トップ | `/(app)/settings` | `app/(app)/settings.tsx` | 🟡 Placeholder（Phase 14で詳細実装） |
| SCR-SET-002 | 権限説明 | 未定 | 未作成 | ❌ 未実装（Phase 14） |
| SCR-SET-003 | プライバシー | 未定 | 未作成 | ❌ 未実装（Phase 14） |
| SCR-SET-004 | 利用規約 | 未定 | 未作成 | ❌ 未実装（Phase 14） |
| SCR-SET-005 | 問い合わせ | 未定 | 未作成 | ❌ 未実装（Phase 14） |
| SCR-ERR-001 | 権限不足 | — | 共通コンポーネント | ❌ 未実装（Phase 14） |
| SCR-ERR-002 | 空状態 | — | `EmptyState.tsx` | ✅ コンポーネント実装済 |
| SCR-ERR-003 | アップロード失敗 | — | 未作成 | ❌ 未実装（Phase 6） |
| SCR-ERR-004 | AI失敗 | — | 未作成 | ❌ 未実装（Phase 9） |
| SCR-ERR-005 | 削除失敗 | — | 未作成 | ❌ 未実装（Phase 9） |

---

## ルートグループ構成

```
app/
├── index.tsx                    # 起動判定（SCR-ONB-001）
├── _layout.tsx                  # ルートレイアウト（SafeAreaProvider / AuthProvider）
├── (auth)/
│   ├── _layout.tsx              # 認証ガード（signedIn → /(app)/home）
│   ├── onboarding.tsx           # SCR-ONB-002
│   ├── login.tsx                # SCR-AUTH-001
│   ├── sign-up.tsx              # SCR-AUTH-002
│   └── profile-setup.tsx        # SCR-AUTH-003
└── (app)/
    ├── _layout.tsx              # 認証ガード（未認証 → /(auth)/onboarding）
    ├── home.tsx                 # SCR-HOME-001 / SCR-HOME-002
    ├── settings.tsx             # SCR-SET-001
    ├── create/
    │   └── index.tsx            # SCR-CREATE-001
    └── notes/
        └── [noteId].tsx         # SCR-NOTE-001
```

---

## カラーパレット（UI方針 → 実装マッピング）

| 用途 | 仕様書の値 | `colors.ts` トークン |
|---|---|---|
| 背景（クリーム） | `#FAF7F2` | `colors.background` |
| カード背景 | `#FFFFFF` | `colors.surface` |
| 薄い面（アイボリー） | `#F4EEE6` | `colors.surfaceIvory` |
| メインアクセント（コーラル） | `#F26B5B` | `colors.primary` |
| 地図アクセント（ティール） | `#4FA8A1` | `colors.mapAccent` |
| テキスト（メイン） | `#2E2A27` | `colors.textPrimary` |
| テキスト（サブ） | `#7A746D` | `colors.textSecondary` |
| 区切り線 | `#E8DED4` | `colors.border` |

---

## Figma Make 生成方針

Figma Make でUI草案を生成する際のガイドライン：

1. **共通ベースプロンプト** (`final_spec/04_ui_ux/03_ui_visual_direction.md` §12 参照)
2. **避けること** (`final_spec/04_ui_ux/03_ui_visual_direction.md` §13 参照)
3. 生成結果は本番コードとして直接使わず、**参照・検討用**として `generated_ui/figma_make/` に格納する
4. 実コードへの反映は既存コンポーネントに合わせて手動で書き換える

---

## 更新履歴

| 日付 | 更新内容 |
|---|---|
| 2026-06-11 | Phase 4 で初版作成 |
