# Phase 12.5E Places UI / User Confirmation — Next Steps

## フェーズ完了条件

Phase 12.5E は以下がすべて完了した時点で完了とみなす。

- [x] Detail 画面に「訪れた場所」セクションが出る
- [x] 「場所を推定する」ボタンから `enrichNotePlaces` を呼べる
- [x] PlaceGroup 一覧画面に遷移できる
- [x] 候補確認画面で候補一覧を見られる
- [x] 候補から `selectPlaceCandidate` で確定できる
- [x] 手動入力で `updatePlaceGroupManually` を呼べる
- [x] `userConfirmed=false` の場所は「確認が必要」と表示される
- [x] `userConfirmed=true` の場所は「確認済み」と表示される
- [x] viewer は編集系操作ができない
- [x] 開発用 Place Callable Test 画面は残る
- [x] AI ランキングは実装していない
- [x] Map SDK は実装していない
- [x] `npx tsc --noEmit` が Exit 0
- [x] `npx expo lint` が Exit 0
- [x] 実装ログ作成完了

---

## Step 1: Firebase deploy（人間が実施）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools deploy --only functions --project memory-note-app-dev
```

（Phase 12.5C-4 から functions が変更済みで未 deploy の場合に必要）

---

## Step 2: 実機テスト

1. `npx expo start` でアプリを起動
2. ノート詳細画面を開く
3. 「訪れた場所」セクションが表示されることを確認
4. 「場所を推定する」ボタンを押す
5. enrichNotePlaces 実行後、PlaceGroup カードが表示されることを確認
6. 「すべて見る」→ 一覧画面へ遷移することを確認
7. カードをタップ → 候補確認画面へ遷移することを確認
8. 候補を選択 → 「確認済み」バッジに変わることを確認
9. 「候補にない場所を手動で入力」→ 手動入力画面へ遷移することを確認
10. 場所名・カテゴリを入力して「保存する」→ 一覧に反映されることを確認

---

## Step 3: viewer 権限テスト

1. 別ユーザーを viewer として招待
2. viewer でノート詳細を開く
3. 「場所を推定する」ボタンが表示されないことを確認
4. 確認済み場所のカードをタップ → 候補確認画面に遷移できることを確認
5. 候補確認画面で「選択」ボタンが表示されないことを確認

---

## Step 4: Phase 12.5F Map SDK / Timeline Route へ進む

### Phase 12.5F への移行プロンプト

```
Phase 12.5F: Map SDK / 訪れた場所の地図表示

参照ドキュメント:
- docs/phase12_5_place_intelligence/06_ui_flow.md （ノート地図画面セクション）

実装:
- app/(app)/notes/[noteId]/map.tsx （本格地図画面）
- react-native-maps または expo-maps の導入
- EAS Development Build での動作確認
- PlaceGroup ピン表示（ラベル + 写真カウント）

方針:
- Phase 8 の MapPreview は引き続き Detail 画面に残す（フォールバック）
- 候補確認画面 [placeGroupId].tsx に地図ミニビューを追加
```
