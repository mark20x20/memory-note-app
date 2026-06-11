# Phase 6 → Phase 7 引き継ぎ事項

## Phase 6 完了状態

- `expo-image-picker` を導入（手動: `npx expo install expo-image-picker`）
- `app.json` に `expo-image-picker` プラグインと iOS 権限文言を追加
- `src/features/photos/types/index.ts` → `PickedPhoto` 型定義
- `src/features/photos/hooks/usePhotoPicker.ts` → 写真選択・10枚上限・EXIF取得
- `app/(app)/create/index.tsx` → 写真選択有効化・サムネイル表示・フォーム統合
- `generated_ui/figma_make/reference_map.md` → SCR-CREATE-002 を実装済みに更新

---

## Phase 7 でやること（Firebase Storage アップロード）

### 前提条件

1. **`firebase/storage.rules` の更新**
   - `memory_notes/{noteId}/photos/{photoId}` のルールを追加
   - 書き込みは noteId の owner のみ許可
   - 読み取りは members + public（共有リンク経由）を想定

2. **`expo-file-system` または `expo-image-manipulator` の確認**
   - アップロード前に画像圧縮が必要な場合は `expo-image-manipulator` を使用
   - `npx expo install expo-image-manipulator` でインストール

3. **Firestore `memory_notes/{noteId}/photos` サブコレクション設計**
   - `data_model.md` を参照して PhotoDoc 型を確認

### 必須実装

1. **photoRepository.ts を作成**
   - `src/core/repositories/photoRepository.ts`
   - `uploadPhoto(noteId, photo: PickedPhoto): Promise<PhotoDoc>`
   - Firebase Storage に URI からアップロード
   - Firestore の `memory_notes/{noteId}/photos` サブコレクションに保存

2. **usePhotoUpload.ts を作成**
   - `src/features/photos/hooks/usePhotoUpload.ts`
   - アップロード進捗管理
   - エラーハンドリング

3. **Create 画面のアップロード統合**
   - ノート作成（`saveNote`）後に写真アップロード開始
   - アップロード完了後に Detail 画面へ遷移
   - アップロード失敗時のリトライ UI

4. **Detail 画面の写真表示**
   - `app/(app)/notes/[noteId].tsx` に写真グリッド表示を追加

### 推奨実装

- アップロード進捗バー（パーセンテージ表示）
- 画像圧縮（最大辺 1920px 程度）
- アップロード失敗時に選択写真を保持してリトライ可能にする

---

## Phase 8 以降に回すこと

| 機能 | Phase |
|---|---|
| ノート地図表示 (GPS座標活用) | Phase 8 |
| notes/[noteId].tsx → /index.tsx 移行 | Phase 8 |
| GPS符号 (N/S/E/W) 変換処理 | Phase 8 |
| AI生成 (Cloud Functions) | Phase 9 |
| ノート詳細 写真一覧 実データ | Phase 9〜10 |
| ノート編集 / 削除 | Phase 10 |
| 共有ノート・権限管理 | Phase 11 |
| Bottom Tab Navigation | Phase 11 |

---

## 注意事項

- Phase 7 実装後に `reference_map.md` の SCR-CREATE-003（写真アップロード）の実装状態を更新すること
- `firebase deploy --only storage` でStorage Rulesをデプロイすること
- `memory_notes` の Firestore インデックスは Phase 11 以降で追加することを検討すること
- `src/features/photoUpload/` ディレクトリ（空）は Phase 7 で使用するか `photos/` に統合するか判断すること
