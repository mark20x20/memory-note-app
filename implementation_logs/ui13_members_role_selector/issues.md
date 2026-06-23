# UI-13 Issues

## 解決済み

### 1. ロール変更がトグルで意図が不明瞭だった

旧 UI では "閲覧者に" / "編集者に" のトグルボタンをタップするだけで
確認 Alert が出るまで変更先が分からなかった。

→ "変更" ボタン → Modal Bottom Sheet → 編集者 / 閲覧者 の明示的選択に変更。

### 2. 現在のロールが変更操作中に確認できなかった

旧 UI ではロールバッジとアクションボタンが別々に表示されており、
「現在が何で、何に変えるか」の比較ができなかった。

→ Modal 内に現在のロール (✓ マーク + ivory 背景) を表示することで解消。

---

## 未解決（将来対応）

### 1. iOS でのシート dismiss アニメーションが突然消える

React Native 標準 Modal は `animationType="slide"` で表示のアニメーションはあるが、
`setVisible(false)` で即座に消える (dismiss アニメーションなし)。
→ 将来: `@gorhom/bottom-sheet` または `react-native-reanimated` ベースの実装でスムーズな dismiss を実現できる。
  現時点では package.json 変更不可のため許容。

### 2. ロール変更後の成功フィードバックがない

updateRole 成功後はエラーがなければ何も表示されない。
→ 将来: Toast / Snackbar などの成功通知 UI を追加できる。
