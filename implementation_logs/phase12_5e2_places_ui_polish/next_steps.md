# Phase 12.5E-2 Places UI Polish — Next Steps

## フェーズ完了条件

Phase 12.5E-2 は以下がすべて完了した時点で完了とみなす。

- [x] Detail の「訪れた場所」から「候補を確認・変更」ボタンで候補確認に行ける
- [x] 「候補を再取得」ボタンが本番UIから非表示（`__DEV__` 限定）
- [x] 候補確認画面の上部に「手動で入力」バナーがある
- [x] 候補カードに `#1`, `#2` のような番号が表示される
- [x] 候補カードにカテゴリタグが表示される
- [x] カテゴリチップで候補を絞り込める
- [x] places/index.tsx でもカテゴリタグが表示される
- [x] userConfirmed の確認済み/要確認表示が維持される
- [x] viewer は編集系操作ができない
- [x] AIランキングを実装していない
- [x] Map SDKを実装していない
- [x] `npx tsc --noEmit` が Exit 0
- [x] `npx expo lint` が Exit 0
- [x] 実装ログが作成されている

---

## Step 1: Firebase deploy（人間が実施）

Phase 12.5C-4 の Cloud Functions がまだデプロイされていない場合:

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools deploy --only functions --project memory-note-app-dev
```

---

## Step 2: 実機テスト

1. `npx expo start` でアプリを起動
2. ノート詳細画面を開く
3. 「訪れた場所」セクションの場所カードに「候補を確認・変更」ボタンがあることを確認
4. 「候補を確認・変更」ボタン → 候補確認画面へ遷移することを確認
5. 候補確認画面の上部に「候補にない場合 → 手動で入力」バナーがあることを確認
6. 候補カードに `#1`, `#2`, カテゴリタグが表示されることを確認
7. カテゴリフィルタチップを押して候補が絞り込まれることを確認
8. 候補を選択 → 「確認済み」になることを確認

---

## Step 3: viewer 権限確認

1. viewer でノート詳細を開く
2. 「候補を確認・変更」ボタンが非表示（viewer では出ない）ことを確認
3. places/index.tsx で確認済み場所の「詳細を見る」ボタンがあることを確認
4. 候補確認画面で「選択」ボタンが非表示であることを確認

---

## Step 4: Phase 12.5F Map SDK / Timeline へ進む

```
Phase 12.5F: Map SDK / 場所ピン表示

実装:
- app/(app)/notes/[noteId]/map.tsx
- react-native-maps または expo-maps の導入
- EAS Development Build
- PlaceGroup 番号付きピン（#1, #2, ... と候補確認画面の番号を対応）

方針:
- Detail 画面の Phase 8 MapPreview はフォールバックとして残す
- candidates の番号は UI の表示順と Map SDK ピン番号を合わせる
```
