# UI-2 Edit Tab Data Binding — Decisions

## useNoteEditDraft の設計

`useNoteEditDraft(noteId)` を自己完結型にした理由:
- `useNoteDetail` を内部で呼び出し、Firestore subscriptionの重複を避けるため edit.tsx は `useNoteDetail` を直接呼ばない
- note, draft, updateField, isDirty, saveDraft を一か所から提供することでedit.tsxがシンプルになる
- UI-3以降で `placeEdits`, `photoOrder` などを追加する際に型を拡張しやすい

## カバー写真設定を即時保存とした理由

- ドラフト保存フローに組み込まない設計を選んだ
- `noteRepository.updateCoverPhoto(noteId, { coverPhotoURL, photoCount })` が既にAPIとして存在している
- ドラフトに coverPhotoId を持ち保存時にURLに解決する方式は、photo.downloadURL の参照が必要で手順が増える
- 即時保存の方がUXがシンプルで実装リスクが低い

## FlowsPanel / PlacesPanel のデータ取得

- 両パネル内で独自に `placeGroupRepository.subscribePlaceGroupsByNoteId()` を呼び出す設計を採用
- 同じデータを2回購読することになるが:
  - Flows / Places タブは同時表示されないため、片方が非アクティブな間は購読が発生している可能性はあるが問題は小さい
  - 将来的に `usePlaceGroups(noteId)` フックを作ってedit.tsxで一元購読する方向に変更可能
  - UI-2段階では可読性を優先した

## パネルを別ファイルに分離した理由

- edit.tsx が UI-1 段階でも約400行あり、5タブ分のデータバインディングを追加すると1000行超になる可能性があった
- 各パネルは独立したコンポーネントとして扱えるため、`src/features/memoryNotes/components/edit/panels/` に分離した
- これにより個々のパネルの TypeScript 型チェック、テスト、レビューが容易になる

## isDirty 制御の保存ボタン

- `isDirty=false` の場合、保存ボタンを subdued (gray) かつ `disabled` にした
- これにより誤保存を防ぎ、ユーザーが変更を行ったかどうかを視覚的に確認できる
- キャンセル時に `isDirty=true` の場合は確認アラートを表示する設計を採用

## プレビュー導線

- ScreenHeader の rightElement に「プレビュー」ボタンを追加
- `router.push('/(app)/notes/${noteId}/preview')` で preview.tsx に遷移
- 編集中でも思い出の見え方を確認できるようにした
