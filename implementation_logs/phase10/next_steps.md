# Phase 10 Next Steps — Note Detail / Edit / Delete

## Phase 10 完了前の必須確認事項

### 1. TypeScript / Lint チェック（実施済み）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx tsc --noEmit    # → 通過
npx expo lint       # → 通過
```

### 2. Storage Rules のデプロイ

Storage Rules を変更したため、デプロイが必要。

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools deploy --only storage --project <project-id>
```

### 3. Expo Go での手動確認フロー

```
ログイン → Home → 既存ノートを開く

【Detail 画面の確認】
→ ヘッダー右上に「編集」ボタンが表示される
→ タイトル・メモ・写真・地図・AI日記が正常に表示される

【編集画面の確認】
→ 「編集」ボタンをタップ → 編集画面が開く
→ フォームに現在の値が入っている
→ タイトルを変更して「保存する」ボタンをタップ
→ Detail 画面に戻る
→ タイトルが変更されている
→ Home に戻る → カードのタイトルも更新されている

【AI日記手動編集の確認（AI日記生成済みのノートのみ）】
→ 編集画面に「AI日記」フィールドが表示される
→ テキストを修正して保存
→ Detail 画面で修正後のテキストが表示される
→ AiDiarySection に「再生成」ボタンがある

【削除確認】
→ 編集画面の「このノートを削除する」ボタンをタップ
→ 確認ダイアログが表示される
→ 「削除する」を選択
→ Home に遷移する
→ Home 一覧から対象ノートが消える
→ Firebase Console で memory_notes から対象ドキュメントが消えている
→ Firebase Console で Storage の対応写真が消えている
```

---

## Phase 11 推奨事項（次フェーズ）

- 共有ノートのメンバー管理 UI
- 招待フロー
- Firestore Rules を役割（owner/editor/viewer）に応じた制御に更新
- 共有ノートでの編集・削除権限の制御

## Phase 13 推奨事項

- 削除時に `deletedAt` を設定するソフト削除への変更（復元機能の布石）
- ノート検索

## Photo 関連（Phase 10 未対応）

- 写真個別削除 UI
- 写真追加 UI（既存ノートへの追加）
- 画像圧縮（Phase 10 では延期）
