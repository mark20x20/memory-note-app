# UI-24 Calendar Screen Polish — 課題・既知の問題

## 解決済み

### #1 Calendar 画面が存在しなかった
- **問題**: `app/(app)/calendar.tsx` が未作成
- **解決**: warm / photo-first なカスタム実装を新規作成

### #2 外部カレンダーライブラリ不使用
- **問題**: `package.json` を変更できない制約
- **解決**: 純 RN + TypeScript のカスタムグリッドで実装。機能的に十分な月表示・日付選択を実現

## 残存課題

### #3 ノートの「思い出日付」がない
- **内容**: `NoteDoc` に `memoryDate` / `visitDate` フィールドが存在しない
- **現在の対処**: `createdAt` で代替
- **影響**: ノートを後から作成した場合（翌日以降に入力）、思い出の実際の日付とずれる
- **将来対応**: `memoryDate: Timestamp | null` フィールドを NoteDoc に追加し、Create 画面でも設定できるようにする

### #4 月をまたいだノートのカウントが非効率
- **内容**: `useMemoryNotesList()` は全ノートを取得するが、カレンダーでは 1 ヶ月単位の表示
- **影響**: ノート数が増えると全件 useMemo 処理。現状は問題なし
- **将来対応**: Firestore の日付範囲クエリで月単位フィルタリング（インデックス追加が必要）

### #5 ノートなし月の empty state
- **内容**: 表示月に1件もノートがない場合、カレンダーグリッドにはドットが出ず、日付選択時のみ空状態が表示される
- **影響**: 月単位の空状態メッセージ（「今月の思い出はまだありません」等）がない
- **判断**: 日選択後の空状態で十分。別タスクで対応

### #6 calendar.tsx への navigation ルートが未確認
- **内容**: Home / BottomTab からの `/(app)/calendar` ルートが設定されているか未確認
- **調査内容**: `app/(app)/_layout.tsx` は `Stack screenOptions={{ headerShown: false }}` のみ。
  Expo Router のファイルベースルーティングにより `calendar.tsx` が存在すれば自動的に `/(app)/calendar` として登録される。
- **判断**: 問題なし
