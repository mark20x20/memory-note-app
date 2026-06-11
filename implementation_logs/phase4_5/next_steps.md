# Phase 4.5 → Phase 5 引き継ぎ事項

## Phase 4.5 完了状態

- `generated_ui/figma_make/` 配下に UIデザインシステム・Figmaルール・Phase計画を整備
- 全38画面の予定 Expo Router ルートを `reference_map.md` に記録
- `app/index.tsx` と `app/(app)/_layout.tsx` の ActivityIndicator を coral に修正
- `final_spec/06_implementation_plan/` に Phase 4.5 を追記
- Figma Make 生成ルール・実装反映ルールを文書化

---

## Phase 5 でやること（Memory Note Creation 本実装）

### 前提条件（Phase 5 開始前に必ず確認）

1. **Firestore Security Rules を設定する**
   - `memory_notes` コレクションのルールを設定する
   - 参考: `implementation_logs/phase4_5/issues.md` I6
   - 最低限のルール: 本人のみ read/write 可能

2. **`memory_notes` スキーマを確定する**
   - `implementation_logs/phase4/next_steps.md` §3 参照
   - フィールド: `title`, `memo`, `ownerId`, `createdAt`, `updatedAt`

3. **Figma Make で Create 画面を生成する（推奨）**
   - `generated_ui/figma_make/figma_make_common_prompt.md` §2〜3 のプロンプトを使用
   - 生成対象: SCR-CREATE-001, SCR-CREATE-002, SCR-HOME-001（ノートあり状態）
   - 保存先: `generated_ui/figma_make/phase5_memory_note_creation/`

### 必須実装

1. **ノート作成フローの状態管理**
   - `src/features/memoryNotes/hooks/useCreateNote.ts` 作成
   - タイトル入力、メモ入力、保存ボタン
   - バリデーション（タイトル必須）

2. **ノートの Firestore 保存**
   - `src/core/repositories/noteRepository.ts` 実装
   - `createNote(uid, { title, memo })` → `memory_notes/{noteId}` に保存
   - 保存完了後に `/(app)/notes/[noteId]` へ遷移

3. **写真ピッカー導入（Phase 6 に変更）**
   - 元々 Phase 5 のスコープだったが、Phase 6 に移動することを確認する
   - `app/(app)/create/index.tsx` の写真選択ボタンは引き続き disabled のままでよい

### 推奨実装

- タイトル・メモのフォームバリデーション（空白のみのタイトルを弾く）
- 保存中のローディング状態表示
- 保存失敗時のエラー表示

---

## Phase 6 以降に回すこと（変更なし）

| 機能 | Phase |
|---|---|
| expo-image-picker / 写真選択 | Phase 6 |
| EXIF 読み取り | Phase 6 |
| Firebase Storage アップロード | Phase 7 |
| アップロード進捗表示 | Phase 7 |
| ノート地図表示 | Phase 8 |
| AI生成 (Cloud Functions) | Phase 9 |
| ノート詳細 実データ取得 | Phase 9〜10 |
| 共有ノート・権限管理 | Phase 11 |
| Bottom Tab Navigation | Phase 11 |
| SNS共有カード | Phase 12 |
| 検索・カレンダー | Phase 13 |
| 設定・権限・プライバシー詳細 | Phase 14 |
| Auth 画面の coral テーマ適用 | Phase 14 |
| notes/[noteId].tsx → /index.tsx 移行 | Phase 8 |

---

## 注意事項

- Phase 5 実装後に `reference_map.md` の SCR-CREATE-001 / SCR-HOME-001 の実装状態を更新すること
- `generated_ui/figma_make/` のドキュメントは各 Phase 開始前に参照すること
- コード変更後は `npx tsc --noEmit` と `npx expo lint` を手動実行すること
- 認証フロー（ログイン → ホーム遷移）が壊れていないことを Expo Go で確認すること
- Phase 5 で `noteId` の Firestore 形式が確定したら、`notes/[noteId].tsx` のルートパスを確認すること

---

## Figma で次に作るべき画面

Phase 5 実装前に以下を Figma Make で生成することを推奨:

1. **SCR-CREATE-001** — 作成開始（本実装版: タイトル入力・メモ入力フォームあり）
2. **SCR-HOME-001** — ホーム（ノートカードが並んでいる状態）

プロンプトは `generated_ui/figma_make/figma_make_common_prompt.md` を参照。
保存先は `generated_ui/figma_make/phase5_memory_note_creation/`。
