# UI-6 Issues

## 解決済み

### 1. group が hooks より後に導出される問題

`useState` の初期値に `group?.eventMemo` を使えないため、`useState('')` + `useEffect` 同期パターンを採用。
編集中は `isEditingMemo` フラグで同期をスキップし、入力内容を保護。

---

## 未解決（将来対応）

### 1. キーボード表示時のスクロール位置

TextInput `autoFocus` でキーボードが開くとき、Section 3 が画面外に隠れる可能性がある。
`KeyboardAvoidingView` または `ScrollView` の `keyboardShouldPersistTaps` を調整することで改善できる。
→ 現状の ScrollView デフォルト動作で許容範囲。将来の改善候補。

### 2. 編集中に前後ナビゲーションを押した場合の未保存警告

`prevGroup` / `nextGroup` へ `router.replace` するとき、`isEditingMemo === true` でも警告なしに遷移する。
未保存の変更が失われる可能性。
→ スコープ外。将来的に「編集中に移動しますか？」ダイアログを追加する候補。
