# Phase 11 Next Steps — Shared Notes / Member Management

## Phase 11 完了前の必須確認事項

### 1. TypeScript / Lint チェック（実施済み）
```
npx tsc --noEmit  → Exit 0
npx expo lint     → Exit 0
```

### 2. Functions ビルド（実施済み）
```
cd firebase/functions && npm run build → Exit 0
```

### 3. デプロイ（ユーザーが PowerShell で実行）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

# Functions（3 functions 追加: addNoteMemberByEmail, updateNoteMemberRole, removeNoteMember）
# Phase 9 の generateMemoryDiary も含めて全部デプロイ
npx firebase-tools deploy --only functions --project memory-note-app-dev

# Firestore Rules（users read 開放 + note update 強化 + photos 権限）
npx firebase-tools deploy --only firestore:rules --project memory-note-app-dev

# Storage Rules（member read 許可）
npx firebase-tools deploy --only storage --project memory-note-app-dev
```

### 4. Expo Go での手動確認フロー

```
前提:
- ユーザーA（owner）でログイン済み
- ユーザーBのアカウントが存在（プロフィール設定済み）
- Firestore users/{uidB} に email フィールドがある

確認1: 共有ノート作成
Home → ノートを開く → 編集 → ノートの種類を「共有ノート」に変更 → 保存
→ Detail の種類チップが「共有ノート」になる

確認2: メンバー追加
Detail → メンバーセクション → 「管理」ボタン（owner のみ表示）
→ Members 画面が開く
→ ユーザーBのメールアドレスを入力 → role「編集者」→ 「追加する」
→ メンバー一覧にユーザーBが表示される
→ Firestore Console で memory_notes/{noteId}.members にユーザーBが追加されている

確認3: editor 権限（ユーザーB でログイン）
Home → 共有ノートが表示される
→ Detail 画面が開ける
→ ヘッダーに「編集」ボタンが表示される
→ 編集画面でタイトル・メモを変更・保存できる
→ 削除ボタンは表示されない
→ Detail の「管理」ボタンは表示されない
→ Members 画面に直接 URL でアクセスすると閲覧のみ

確認4: viewer 権限
ユーザーAでユーザーBを「閲覧者に」変更
→ ユーザーBでログイン
→ Home に共有ノートが表示される
→ Detail で「編集」ボタンが表示されない
→ AI日記の再生成ボタンが表示されない
→ 直接 edit URL に行くと「編集権限がありません」表示

確認5: メンバー削除
ユーザーAで Members → ユーザーBの「削除」ボタン → 確認 → 削除
→ ユーザーBでホームに共有ノートが消える

確認6: owner 自身の削除不可
Members 画面で自分の行に削除ボタンが表示されないことを確認

確認7: 既存機能回帰
個人ノート作成 → 写真アップロード → AI日記生成 → 編集 → 削除
すべて正常動作することを確認
```

---

## Phase 12 推奨事項（次フェーズ）

- SNS 共有カード生成（1:1, 4:5, 9:16）
- 端末保存・OS 共有シート
- Instagram / LINE / X 共有導線

## Phase 13 推奨事項

- ノート検索
- カレンダービュー
- タイムライン

## 残課題（Phase 11 未対応）

- Public share link
- 招待メール送信
- owner 権限譲渡
- editor による写真アップロード（Storage パス変更が必要）
- users コレクションに emailLower フィールド追加（メール検索の精度向上）
