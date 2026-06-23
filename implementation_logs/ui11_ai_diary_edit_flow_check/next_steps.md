# UI-11 Next Steps

## 完了確認チェックリスト

- [x] aiDiaryStatus が MemoPanel に渡される
- [x] completed / edited: 編集可能な TextInput + status badge (生成済み/編集済み)
- [x] generating (Firestore) または isGeneratingDiary (Functions呼び出し中): スピナー + メッセージ
- [x] failed: エラーカード (赤系) + 再生成ボタン (canGenerate 時)
- [x] idle / null / undefined: 未生成カード + 生成ボタン (canGenerate 時)
- [x] viewer (canGenerate=false) は生成ボタンが表示されない
- [x] owner / editor は生成ボタンが表示される (canGenerateAiDiary)
- [x] "ノート詳細画面から生成できます" メッセージが削除済み
- [x] useGenerateDiary が edit.tsx に接続済み
- [x] generateDiaryError がエラー時に表示される
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## 次フェーズ候補

### UI-12: 退出 (leave) 機能追加

- 非 owner ユーザーが自分でノートから退出できるボタンを追加
- `useManageNoteMembers` に `leaveNote` を追加

### UI-13: Members ロール変更 UI の改善

- 「閲覧者に / 編集者に」トグルボタン → ActionSheet/BottomSheet セレクタ
- 3段階 (editor → viewer → editor) ではなく明示的な選択に

### UI-14: generating 完了後の自動スクロール

- aiDiaryStatus が generating → completed に変わった際に AI日記フィールドへスクロール
- ScrollView ref + useEffect で実装可能

### Share Card mini map

- share card 内に地図位置情報ヒントを追加
- visitedPlacesSummary の topPlaceLabels 座標を MapView で表示
