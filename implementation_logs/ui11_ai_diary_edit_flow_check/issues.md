# UI-11 Issues

## 解決済み

### 1. "ノート詳細画面から生成できます" メッセージが壊れた導線を指していた

`index.tsx` が `preview.tsx` にリダイレクトされたため、
「ノート詳細画面」の AI日記生成 UI は存在しない状態になっていた。

→ メッセージを削除し、edit.tsx のメモタブ内で直接生成できる UI を追加。

### 2. generating / failed 状態の UI がなかった

`hasAiDiary === false` がすべての非完了状態を吸収していた。
`aiDiaryStatus === 'generating'` 中はスピナーなしで「まだ生成されていません」が表示されていた。

→ `aiDiaryStatus` を直接 MemoPanel に渡し、4状態 (completed/edited / generating / failed / idle) を個別に描画。

### 3. canGenerateAiDiary が存在するのに未使用だった

`permissions.ts` に `canGenerateAiDiary(note, uid)` が実装済みだったが、
edit.tsx も MemoPanel も使用していなかった。

→ edit.tsx で `userCanGenerateAiDiary` を算出し、`canGenerate` として MemoPanel に渡す。
→ viewer ユーザーには生成ボタンが表示されない。

---

## 未解決（将来対応）

### 1. generating 中の所要時間が不明

AI日記の生成時間は数秒〜数十秒と幅がある。
「しばらくお待ちください」のみで進行状況がわからない。
→ 将来: ProgressBar や推定時間の表示を追加できる。

### 2. 生成完了後のスクロール誘導がない

`aiDiaryStatus` が `'generating'` → `'completed'` に変わると
TextInput が現れるが、スクロール位置が変わらないため気づきにくい場合がある。
→ 将来: `ScrollView.scrollTo` で AI日記フィールドまでスクロールできる。
