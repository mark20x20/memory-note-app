# UI-25 Integration QA — 課題リスト

## 即修正済み（このQAで対応）

### #1 preview.tsx の UI-16B Alert テキスト不整合
- **ファイル**: `app/(app)/notes/[noteId]/preview.tsx`
- **問題**: `handleConvertToShared` Alert が旧テキストのまま（UI-22 で OverviewPanel のみ更新、preview.tsx を見落とした）
- **修正**: "メンバーを招待しますか？" / "メンバーを招待すると..." / "招待へ進む" に修正
- **ステータス**: ✅ 修正済み

---

## リリース前に修正すべき課題

### #2 isOwner チェックの実装不整合
- **ファイル**: `app/(app)/notes/[noteId]/preview.tsx:69`
- **問題**: `isOwner = note.ownerId === uid` — permissions.ts の `canManageMembers(note, uid)` を使っていない
- **影響**: データが正常なら動作は同じ。Firestore のデータ不整合時（ownerId が members map と食い違う場合）に挙動が異なる可能性
- **対応案**: `import { canManageMembers } from '@/features/memoryNotes/utils/permissions'` を追加し `const isOwner = uid && note ? canManageMembers(note, uid) : false;` に変更
- **優先度**: Low（現実的な発生頻度は低い）

### #3 NoteDoc に memoryDate フィールドがない
- **関連ファイル**: `src/core/repositories/noteRepository.ts`, `app/(app)/calendar.tsx`
- **問題**: ノートの「思い出の日付」フィールドがなく、Calendar は `createdAt`（作成日時）で代替している
- **影響**: ノート作成日 ≠ 思い出の日付 のケース（翌日以降に入力したノート等）でカレンダーが正しい日付に表示されない
- **対応案**:
  1. `NoteDoc` に `memoryDate: Timestamp | null` を追加
  2. Create 画面で日付選択 UI を追加
  3. Calendar / Preview でこのフィールドを使用
- **優先度**: Medium（UX 上の重要度高め）
- **分離タスク**: `UI-26: memoryDate フィールド追加`

---

## 後回し可能な課題

### #4 Apple / Google OAuth が stub
- **ファイル**: `app/(auth)/login.tsx`
- **問題**: `handleApple` / `handleGoogle` が `Alert.alert` のみ（未実装）
- **影響**: SNS ログインが使えない
- **対応案**: Firebase Auth Apple/Google provider を実装
- **優先度**: リリース方針次第（メール認証のみでリリースするなら defer 可能）

### #5 useManageNoteMembers の shared isLoading flag
- **ファイル**: `src/features/memoryNotes/hooks/useManageNoteMembers.ts`
- **問題**: 単一の `isLoading` / `error` 状態を全操作が共有。並列呼び出しで clobber の可能性
- **影響**: 通常の UI フローでは1操作ずつのため発生確率は低い
- **対応案**: 操作ごとに loading state を分離（または操作中は UI をブロック）
- **優先度**: Low

### #6 利用規約 / プライバシーポリシー / お問い合わせリンク未実装
- **ファイル**: `app/(app)/settings.tsx`
- **問題**: 全て "準備中" で disabled
- **対応案**: URL が決定したら `Linking.openURL` で実装
- **優先度**: リリース要件次第

### #7 Calendar の月全体の空状態なし
- **ファイル**: `app/(app)/calendar.tsx`
- **問題**: 表示月に1件もノートがなくても、カレンダーグリッドには何もインジケーターが出ない（日選択後に空状態が出るだけ）
- **対応案**: 月全体のノート数が0の場合に「今月の思い出はまだありません」メッセージを追加
- **優先度**: Low

### #8 Calendar のノート取得が全件フェッチ
- **ファイル**: `app/(app)/calendar.tsx`, `src/features/memoryNotes/hooks/useMemoryNotesList.ts`
- **問題**: 全ノートをメモリに持ち、クライアントサイドで月フィルタリング。ノート数が増えると非効率
- **対応案**: `createdAt` の日付範囲クエリ + Firestore インデックス追加
- **優先度**: Low（数百件程度なら現実的に問題ない）

### #9 sign-up.tsx / profile-setup.tsx の QA 未実施
- **問題**: 今回のQA対象外だったが、サインアップフローは確認していない
- **対応案**: 別タスクで sign-up / profile-setup / needsProfileSetup フローの統合確認
- **優先度**: Medium（新規登録フローに影響する）
