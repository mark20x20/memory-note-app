# Phase 7 → Phase 8: 引き継ぎ事項

## Phase 7 完了確認チェックリスト

- [x] `photoRepository.ts` 作成
- [x] `usePhotoUpload.ts` 作成
- [x] `useNotePhotos.ts` 作成
- [x] `noteRepository.ts` に `coverPhotoURL`, `photoCount`, `updateCoverPhoto` 追加
- [x] `firestore.rules` に photos サブコレクション rules 追加
- [x] `storage.rules` にパス指定 rules 追加
- [x] `create/index.tsx` アップロードフロー実装
- [x] `notes/[noteId].tsx` 実写真表示実装
- [x] `home.tsx` coverPhotoURL カード表示実装
- [ ] **Firebase Rules のデプロイ**（ユーザー操作が必要）
- [ ] **TypeScript/Lint 確認**: `npx tsc --noEmit` / `npx expo lint`

## Firebase Rules デプロイ手順

PowerShell で実行:
```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools deploy --only firestore:rules,storage --project <your-project-id>
```

## Phase 8 で実装予定の内容

### Phase 8: 地図表示（Map Integration）
- `react-native-maps` または `expo-maps` の導入
- EXIF から取得した緯度経度を PhotoDoc に保存（Phase 7 で取得済み）
- `notes/[noteId]/map.tsx` の実装（SCR-MAP-001）
- Detail 画面の地図プレースホルダーを実地図に置き換え
- Home → Detail → Map ナビゲーションフロー確認

### Phase 8 実装前に確認すること
- Phase 7 の写真に緯度経度が正しく保存されているか確認（EXIF 付き写真でテスト）
- `expo-location` 権限申請フローの設計（EXIF なし写真の位置情報取得方法）
- map ライブラリの選定（`react-native-maps` vs `expo-maps`）

## Phase 7 で積み残した技術的負債

1. **画像圧縮** — `expo-image-manipulator` による圧縮を Phase 10 以降で追加
2. **写真削除フロー** — 削除時の `coverPhotoURL` 更新を Phase 10 で実装
3. **Storage メンバー読み取り** — Phase 11 で共有機能と合わせて対応
4. **アップロードリトライ UI** — 部分失敗時のリカバリを Phase 10 で検討
