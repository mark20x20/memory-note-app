# Phase 5 → Phase 6 引き継ぎ事項

## Phase 5 完了状態

- `firebase/firestore.rules` に `memory_notes` ルールを追加
- `src/core/repositories/noteRepository.ts` を作成（createNote / getNotesByOwner / getNoteById）
- `src/features/memoryNotes/hooks/useCreateNote.ts` を作成
- `src/features/memoryNotes/hooks/useMemoryNotesList.ts` を Firestore onSnapshot 対応に更新
- `app/(app)/create/index.tsx` をフォーム化（タイトル/メモ/ノート種別/保存）
- `app/(app)/home.tsx` をノートカード一覧表示に更新
- `app/(app)/notes/[noteId].tsx` を実データ表示に更新

---

## Phase 6 でやること（expo-image-picker 導入）

### 前提条件（Phase 6 開始前に必ず確認）

1. **`expo-image-picker` のバージョン確認**
   - Expo SDK ~56.0.0 に対応するバージョンを確認する
   - `https://docs.expo.dev/versions/v56.0.0/sdk/image-picker/` を参照
   - `npx expo install expo-image-picker` でインストール

2. **権限設定の確認**
   - `app.config.ts` または `app.json` に iOS / Android の権限設定を追加する
   - iOS: `NSPhotoLibraryUsageDescription`
   - Android: `READ_MEDIA_IMAGES` または `READ_EXTERNAL_STORAGE`

3. **Firebase Storage のルール確認**
   - `firebase/storage.rules` に `memory_notes/{noteId}/temp_uploads/` のルールを追加する
   - アップロードは `noteId` を作成後に行うため、先に noteId を確定させる必要がある

### 必須実装

1. **写真選択（expo-image-picker）**
   - `src/features/photos/hooks/usePhotoPicker.ts` を作成
   - `ImagePicker.launchImageLibraryAsync` で複数枚選択対応
   - Create 画面の「写真を選ぶ」ボタンを有効化

2. **EXIF 読み取り**
   - `expo-image-picker` が返す `exif` データから `takenAt`（撮影日時）を取得
   - GPS 座標（latitude / longitude）を取得

3. **選択済み写真のプレビュー表示**
   - Create 画面に選択した写真のサムネイルを表示
   - 選択解除ボタンを実装

### 推奨実装

- 写真枚数の上限（例: 10枚）バリデーション
- 選択済み写真一覧の表示スクロール
- 権限未付与時のガイダンス表示

---

## Phase 7 以降に回すこと（変更なし）

| 機能 | Phase |
|---|---|
| Firebase Storage アップロード | Phase 7 |
| アップロード進捗表示 | Phase 7 |
| ノート地図表示 | Phase 8 |
| notes/[noteId].tsx → /index.tsx 移行 | Phase 8 |
| AI生成 (Cloud Functions) | Phase 9 |
| ノート詳細 実データ取得（写真・スポット） | Phase 9〜10 |
| ノート編集 / 削除 | Phase 10 |
| 共有ノート・権限管理 | Phase 11 |
| Bottom Tab Navigation | Phase 11 |
| SNS共有カード | Phase 12 |
| 検索・カレンダー | Phase 13 |
| 設定・権限・プライバシー詳細 | Phase 14 |

---

## 注意事項

- Phase 6 実装後に `reference_map.md` の SCR-CREATE-002（写真選択）の実装状態を更新すること
- `npx tsc --noEmit` と `npx expo lint` を手動で確認すること
- Firestore Security Rules は `firebase deploy --only firestore:rules` でデプロイすること
- `memory_notes` の Firestore インデックスは Phase 11 以降で追加することを検討すること
