# Phase 7: Firebase Storage Upload — Build Log

## 実装日
2026-06-11

## 実装概要
Firebase Storage への写真アップロード機能を実装。Create画面でのアップロード進捗表示、Detail画面での実写真表示、Home画面のカードへの代表写真表示を含む。

## 新規作成ファイル

### `src/core/repositories/photoRepository.ts`
- `PhotoDoc` 型定義（Storage・Firestore メタデータ統合）
- `uploadPhotosForNote(uid, noteId, photos, onProgress)` — `uploadBytesResumable` によるプログレス対応並列アップロード
- `subscribePhotosByNoteId(noteId, onData, onError)` — `onSnapshot` + `orderBy('sortOrder', 'asc')` によるリアルタイム購読
- Storage パス: `users/{uid}/memory_notes/{noteId}/photos/{timestamp}_{sortOrder}.{ext}`
- Firestore コレクション: `memory_notes/{noteId}/photos/{photoId}`

### `src/features/photos/hooks/usePhotoUpload.ts`
- `isUploading`, `uploadProgress` (0〜100), `error`, `uploadedPhotos` ステート管理
- `uploadPhotos({ uid, noteId, photos })` — photoRepository 経由でアップロード実行
- `resetUploadState()` — 状態リセット

### `src/features/photos/hooks/useNotePhotos.ts`
- `useNotePhotos(noteId: string | null)` → `{ photos: PhotoDoc[], isLoading, error }`
- `onSnapshot` を useEffect 内で購読し、クリーンアップで unsubscribe

## 更新ファイル

### `src/core/repositories/noteRepository.ts`
- `NoteDoc` に `coverPhotoURL?: string | null`, `photoCount?: number` フィールド追加
- `updateCoverPhoto(noteId, { coverPhotoURL, photoCount })` メソッド追加

### `firebase/firestore.rules`
- `memory_notes/{noteId}/photos/{photoId}` サブコレクションのルール追加
  - create: `request.resource.data.ownerId == request.auth.uid`
  - read: owner または members に含まれるユーザー（`get()` で親ドキュメント参照）
  - update/delete: owner のみ

### `firebase/storage.rules`
- `users/{uid}/memory_notes/{noteId}/photos/{fileName}` パスに write/read ルール追加
- write: 認証済み & 自パス & `image/*` & 10MB 以下
- read: 認証済み & 自パス
- キャッチオール deny ルールは維持

### `app/(app)/create/index.tsx`
- 2ステップ処理: `saveNote()` → `uploadPhotos()` → `updateCoverPhoto()`
- プログレスバー UI（`uploadBytesResumable` の進捗を 0〜100% で表示）
- アップロード失敗時: エラー表示 + "ノートを確認する" ボタン（ノートは作成済み）
- フォームを `isProcessing` 中は disabled に

### `app/(app)/notes/[noteId].tsx`
- `useNotePhotos` フックで写真をリアルタイム取得
- カバー写真: 先頭写真の `downloadURL` を表示、なければプレースホルダー
- 写真グリッド: 3カラムグリッドで実写真表示、ローディング・空状態対応

### `app/(app)/home.tsx`
- `Image` コンポーネントを追加インポート
- `NoteCard` の左カバー部: `coverPhotoURL` があれば `<Image>` 表示、なければ 📷 絵文字
- `noteCardCoverImage` スタイル追加

## Firebase デプロイ必要作業
```bash
npx firebase-tools deploy --only firestore:rules,storage --project <your-project-id>
```
