# UI-26 memoryDate 実装 — 課題・既知の問題

## 解決済み

### #1 Calendar が createdAt で日付 grouping していた
- **問題**: ノート作成日 ≠ 思い出の日付の場合に Calendar が不正確
- **解決**: `getMemoryDate(note)` を使い memoryDate > createdAt > updatedAt の優先順位で grouping

### #2 Preview / Home の日付表示が createdAt 固定
- **問題**: createdAt（作成日時）が表示されており、思い出の日付と異なる場合があった
- **解決**: `formatMemoryDate(note)` で統一（memoryDate 優先、createdAt fallback）

### #3 Edit 画面で memoryDate を変更できなかった
- **問題**: OverviewPanel の「日付」は readonly 表示のみだった
- **解決**: date selector UI（‹ 日付 › + 今日に設定）を OverviewPanel に追加

### #4 Create 画面で memoryDate が設定できなかった
- **問題**: 新規ノート作成時に思い出の日付を指定できなかった
- **解決**: useCreateNote に memoryDate state を追加し、Create 画面でも date selector を表示

## 残存課題

### #5 既存ノートへの memoryDate backfill
- **内容**: UI-26 以前に作成されたノートは memoryDate が null
- **現在の対処**: createdAt fallback で Calendar / Preview に表示される（動作は UI-26 前と同じ）
- **改善案**: Firestore バッチ更新 or Cloud Function で全ノートの memoryDate を createdAt から backfill
- **判断**: UX 的には createdAt でも問題ない。今後新規作成分から memoryDate が付くため、優先度は低

### #6 Date Selector が日単位のみ
- **内容**: 現在の date selector は ±1 日の操作のみ。大きな日付変更（1ヶ月前など）は非効率
- **改善案**: タップで簡易カレンダーモーダルを表示できる `MemoryDatePicker` コンポーネント
- **判断**: 現在の `前日 / 今日 / 翌日` で基本ユースケース（数日の誤差修正）はカバーできる。将来的に差し替え可能な構造にしてある

### #7 写真メタデータからの撮影日自動入力なし
- **内容**: 仕様では「写真の撮影日付を提案」と記載されていたが、現在は今日で固定
- **理由**: `expo-image-picker` から返される `ImagePickerAsset` は `exif` フィールドを含むが、取得できる保証がないため今回は省略
- **改善案**: `usePhotoPicker` で写真を選んだ後、EXIF の撮影日時を取得して `setMemoryDate` に渡す
- **判断**: 今回の scope 外。別タスクで対応

### #8 memoryDate の時刻情報が捨てられる
- **内容**: date selector は「日」単位で操作するため、時刻は 00:00:00 に固定
- **影響**: toLocalDateKey では問題ないが、Timestamp として保存するため深夜0時として記録される
- **判断**: 思い出の日付に時刻精度は不要のため問題なし
