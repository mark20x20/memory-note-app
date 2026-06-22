# UI-1 Preview / Edit Shell — Issues

## Open

### Issue 1: index.tsx と preview.tsx の役割重複 (継続)
- **Severity**: Medium
- **Status**: 持ち越し (UI-0 Issue 7)
- **Symptom**: index.tsx が現在も primary な閲覧画面として機能している。preview.tsx を追加したが、どちらに遷移するかのルーティングが未整理。
- **Impact**: ユーザーが両画面にアクセスできる重複状態
- **Resolution**: UI-7 Integration QA で index.tsx → preview.tsx リダイレクトまたは統合を決定する

### Issue 2: Photos パネルのデータ未接続
- **Severity**: Medium (UI-2 ブロッカー)
- **Symptom**: edit.tsx の写真タブは placeholder のみ。写真一覧表示・並び替え・カバー写真設定が未実装。
- **Impact**: UI-2 で `useNotePhotos` を Photos パネルに接続し、並び替えUIを実装する必要がある
- **Risk**: 写真ドラッグ並び替えには `DraggableFlatList` などの追加ライブラリが必要な可能性がある

### Issue 3: Places パネルのデータ未接続
- **Severity**: Medium (UI-2 ブロッカー)
- **Symptom**: edit.tsx の場所タブは placeholder のみ。Place候補選択・確認UIが未実装。
- **Impact**: UI-2 で `placeGroupRepository` と接続が必要

### Issue 4: `useNoteEditDraft` フックが未実装
- **Severity**: High (UI-2 ブロッカー)
- **Symptom**: 現在は個別の useState で title/memo/noteType/aiDiary を管理している。5タブ間で unsaved changes を一元管理するフックがない。
- **Impact**: UI-2 で `src/features/memoryNotes/hooks/useNoteEditDraft.ts` を実装する

### Issue 5: edit.tsx のキーボード回避が KeyboardAvoidingView のみ
- **Severity**: Low
- **Symptom**: StickyBottomBar と KeyboardAvoidingView の組み合わせでボトムバーが隠れる可能性がある
- **Impact**: 実機テストで確認が必要。iOS では `behavior="padding"` が有効だが Android での挙動要確認

### Issue 6: preview.tsx のヒーロー写真 タップで viewer.tsx が initialIndex=0 固定
- **Severity**: Low
- **Symptom**: cover photo のタップは `initialIndex=0` を渡しているが、viewer.tsx が `?initialIndex=` クエリパラメータを正しく受け取るか未確認
- **Impact**: photos/viewer.tsx の実装を確認して対応

### Issue 7: Card.tsx radius 変更の影響
- **Severity**: Low
- **Status**: 修正済み (12 → 20)
- **Risk**: Card コンポーネントを使っている既存画面（home等）で角丸が若干大きくなる。視覚的変化は小さいが実機確認が必要。
