# UI-2 Edit Tab Data Binding — Issues

## Open

### Issue 1: 写真並び替え (ドラッグ) 未実装
- **Severity**: Medium (UI-3 スコープ)
- **Symptom**: PhotosPanel に並び替えUIがない。写真グリッドを表示するのみ。
- **Impact**: UI-3 で DraggableFlatList または同等ライブラリを評価して実装する
- **Risk**: `package.json` 変更が必要になる可能性がある (UI-3 で判断)

### Issue 2: FlowsPanel と PlacesPanel が placeGroups を二重購読
- **Severity**: Low
- **Symptom**: Flows タブと Places タブがそれぞれ `subscribePlaceGroupsByNoteId` を呼んでいる
- **Impact**: 同時に両タブがアクティブにならないため実害は少ないが、理論上2つのFirestore subscriptionが走る
- **Resolution**: UI-3 で `usePlaceGroups(noteId)` フックを作成し、edit.tsx で一元購読する

### Issue 3: 離脱ガードの実装が確認アラートのみ
- **Severity**: Low
- **Symptom**: isDirty=true 時のキャンセルにアラートを表示するが、ハードウェアバック (Android) や Expo Router の navigation.goBack() は制御していない
- **Impact**: UI-3 で `usePreventLeaving` または Expo Router の `beforeRemove` イベントを利用した完全な離脱ガードを実装する

### Issue 4: coverPhotoId が NoteEditDraft に含まれていない
- **Severity**: Low (設計判断)
- **Symptom**: カバー写真の即時保存を選んだため、draft には coverPhotoId が存在しない
- **Impact**: プレビュー時にカバー写真の変更が即座に反映される利点がある。ただしsaveDraftと独立した操作のため、UXが二段階になっている
- **Resolution**: UI-3 でカバー写真をドラフトに含めるか検討する

### Issue 5: index.tsx と preview.tsx の役割重複 (継続)
- **Severity**: Medium (UI-7 スコープ)
- **Status**: 持ち越し
- **Impact**: UI-7 Integration QA で統合方針を決定

### Issue 6: MemoPanel の aiDiary 編集で `aiDiaryStatus` 更新
- **Severity**: Low
- **Symptom**: useNoteEditDraft.saveDraft は `aiDiaryStatus: 'edited'` を自動でセットする（noteRepository.updateNote の仕様）。ただし hasAiDiary=false の場合は aiDiary フィールドは更新されない。
- **Impact**: 正常な動作。ただし将来的にaiDiary初期生成フロー追加時に注意が必要。
