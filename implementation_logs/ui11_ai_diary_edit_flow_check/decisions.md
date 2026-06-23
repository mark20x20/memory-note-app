# UI-11 Design Decisions

## 1. hasAiDiary boolean → aiDiaryStatus string に変更

**決定:** MemoPanel の props を `hasAiDiary: boolean` から `aiDiaryStatus: string | null | undefined` に変更。

**理由:**
- `hasAiDiary` では `generating` / `failed` / `idle` の区別ができない。
- `aiDiaryStatus` を渡すことで MemoPanel 内で完結した状態表示が可能になる。
- edit.tsx の `hasAiDiary` 計算 (`completed || edited`) は MemoPanel 側に移動し、単一の判定ロジックに集約。

## 2. AI日記生成ボタンを MemoPanel 内に配置

**決定:** `onGenerateDiary` コールバックと `canGenerate` フラグを MemoPanel に渡し、idle / failed 状態で生成ボタンを表示する。

**理由:**
- 仕様: preview.tsx への AI再生成ボタン追加はしない。
- edit.tsx の memo タブが AI日記の管理場所として適切。
- owner / editor のみ (`canGenerateAiDiary`) が生成ボタンを見られる。viewer はボタンなし。
- MemoPanel はコールバックを受け取るだけ — 生成ロジックは edit.tsx が保持する責務分担。

## 3. useGenerateDiary を edit.tsx レベルで呼ぶ

**決定:** `useGenerateDiary()` を MemoPanel ではなく edit.tsx で呼び出し、結果を props として渡す。

**理由:**
- MemoPanel はプレゼンテーションコンポーネント。フックを内部で呼ぶと責務が混在する。
- `isGeneratingDiary` を `isBusy` と分離することで、生成中でも保存ボタンは操作可能にする
  （生成は非同期で Firestore 経由で反映されるため、保存とは独立）。

## 4. generating 判定は aiDiaryStatus OR isGeneratingDiary の OR 条件

**決定:** `const isGenerating = aiDiaryStatus === 'generating' || isGeneratingDiary;`

**理由:**
- `isGeneratingDiary` は Functions 呼び出し中（数秒）。
- `aiDiaryStatus === 'generating'` は Functions が処理中（数十秒）。
- どちらの場合もスピナーを表示するのが適切。

## 5. failed 状態のカードを赤系に

**決定:** `aiDiaryFailedCard: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }` — エラー系のカラーを使用。

**理由:**
- idle / generating は ivory (暖色) で穏やかな印象。
- failed は明確にエラーであることを伝える必要があるため、赤系で差別化。
- `colors.error` でタイトルも赤く表示。
