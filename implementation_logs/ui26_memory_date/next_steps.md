# UI-26 memoryDate 実装 — 次のステップ

## 完了タスク

- UI-18: Onboarding Polish ✓
- UI-19: Home Polish ✓
- UI-20: Create Polish ✓
- UI-21: Preview Polish ✓
- UI-22: Edit Polish ✓
- UI-23: Settings Polish ✓
- UI-24: Calendar Polish ✓
- UI-25: Integration QA ✓
- UI-26: memoryDate 実装 ✓

## 推奨次アクション

### 写真 EXIF からの撮影日自動入力（UI-27 候補）
- `usePhotoPicker` の返り値 `ImagePickerAsset.exif` から `DateTimeOriginal` を取得
- 選択写真の最も古い撮影日を `setMemoryDate` に自動提案
- useCreateNote の memoryDate 初期化を「写真選択時に最古撮影日へ更新」に変更

### MemoryDatePicker コンポーネント（UI-27 候補）
- `src/features/memoryNotes/components/MemoryDatePicker.tsx` として抽出
- タップでモーダルを表示し、月カレンダーで日付を選べるようにする
- Create / OverviewPanel の date selector を差し替え

### 既存ノート backfill（低優先）
- Cloud Function で全ノートの memoryDate を createdAt から backfill
- または admin script で一括更新

### sign-up / profile-setup フローの QA（UI-27 候補）
- UI-25 で未確認だった登録フローの動作確認

### Calendar の月単位 Firestore クエリ化（中長期）
- `useMemoryNotesList` 全件取得 → 月単位クエリに変更
- Firestore index: `createdAt` on `memory_notes` collection
- ただしインデックス追加 + Rules 確認が必要
