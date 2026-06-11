# Phase 4 → Phase 5 引き継ぎ事項

## Phase 4 完了状態

- カラーパレットを仕様書準拠の coral + teal 系に更新
- Home / Create / Detail / Settings 画面の見た目を整備
- Figma Make 参照マップ作成（`generated_ui/figma_make/reference_map.md`）
- 画面名 ↔ Expo Router ルート対応表の整理
- implementation_logs/phase4/ 作成

---

## Phase 5 でやること (Memory Note Creation 本実装)

### 必須

1. **ノート作成フローの状態管理**
   - `src/features/memoryNotes/` に Create flow の state/hooks を追加
   - タイトル入力、メモ入力、保存ボタン

2. **写真ピッカー導入**
   - `expo-image-picker` または `expo-media-library` を使用
   - `app/(app)/create/index.tsx` の写真選択ボタンを有効化
   - 明示選択のみ（バックグラウンドアクセス不可）
   - GPSなし写真も許容

3. **ノートの Firestore 保存**
   - `memory_notes` コレクション設計に基づいた保存処理
   - `src/core/repositories/noteRepository.ts` の実装

### 推奨

- `src/features/memoryNotes/hooks/useCreateNote.ts` フック作成
- タイトル・メモのフォームバリデーション
- 保存完了後にノート詳細 `/(app)/notes/[noteId]` へ遷移

---

## Phase 6 以降に回すこと

| 機能 | Phase |
|---|---|
| Firebase Storage アップロード | Phase 6 |
| EXIF 読み取り | Phase 7 |
| ノート詳細 実データ取得 | Phase 9 |
| AI生成 (Cloud Functions) | Phase 9 |
| 地図表示 | Phase 8 |
| Bottom Tab Navigation | Phase 11 |
| 設定・権限・プライバシー詳細 | Phase 14 |
| Auth 画面の coral テーマ適用 | Phase 14 |

---

## 注意事項

- `generated_ui/figma_make/reference_map.md` は各フェーズで実装状態を更新すること
- `colors.ts` のトークンを参照するよう、ハードコード箇所を順次移行する（特に auth 画面）
- Phase 5 で `noteId` の Firestore 形式が確定したら、`notes/[noteId].tsx` のルートパスを確認
- `memory_notes` コレクションの Firestore Security Rules は Phase 5 開始前に設定すること
