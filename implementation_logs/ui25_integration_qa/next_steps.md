# UI-25 Integration QA — 次のステップ

## QA完了ステータス

| 画面 | ステータス | 備考 |
|---|---|---|
| Onboarding | ✅ OK | |
| Home | ✅ OK | |
| Create | ✅ OK | |
| Preview | ✅ OK | Alert テキスト修正済み |
| Edit | ✅ OK | |
| Members | ✅ OK | |
| Share Card | ✅ OK | |
| Photo Viewer | ✅ OK | |
| Map | ✅ OK | |
| Calendar | ✅ OK | memoryDate 未実装は既知課題 |
| Settings | ✅ OK | |
| Flow Detail | ✅ OK | |
| Place Detail | ✅ OK | |
| Auth / Routing | ✅ OK | |
| Permissions | ✅ OK | |

## 推奨次アクション（優先度順）

### 1. memoryDate フィールド追加（UI-26）
最も UX 影響が大きい機能改善。
- `NoteDoc` に `memoryDate: Timestamp | null` を追加
- Create 画面で日付ピッカー追加
- Calendar / Preview での利用
- 既存ノートへの backfill 方針を決める

### 2. sign-up / profile-setup フローのQA
新規ユーザーの登録フローが今回未確認。
- `app/(auth)/sign-up.tsx`
- `app/(auth)/profile-setup.tsx`
- `needsProfileSetup` 遷移の確認

### 3. isOwner の permissions util への統一
preview.tsx の `note.ownerId === uid` を `canManageMembers` に統一。
軽微だが、コードの一貫性向上のために対応推奨。

### 4. OAuth 実装（Apple / Google）
リリース前に必要かどうかプロダクト判断。
メール認証のみでMVPリリースする場合は defer 可能。

## 長期的な課題

- Calendar の Firestore 日付範囲クエリ化（スケール改善）
- useManageNoteMembers の操作別 loading state 分離
- 利用規約 / プライバシーポリシーページの実装
- プロフィール編集機能
