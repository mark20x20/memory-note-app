# UI-1 Preview / Edit Shell — Next Steps

## UI-2 で実装する内容

### 1. `useNoteEditDraft` フック

**`src/features/memoryNotes/hooks/useNoteEditDraft.ts`** (新規)

```typescript
export function useNoteEditDraft(noteId: string | null) {
  // note + photos + placeGroups を一括購読
  // NoteEditDraft の useState を一元管理
  // isDirty フラグ
  // save / discard 関数
  // unsaved changes の離脱ガード
}
```

### 2. Overview パネルの完全データ接続

- useNoteEditDraft に移行
- title, memo, noteType, aiDiary を draft から取得
- isDirty に応じて StickyBottomBar の保存ボタンを活性/非活性

### 3. Photos パネル実装

**`app/(app)/notes/[noteId]/edit.tsx` > `PhotosPanel`**

- `useNotePhotos(noteId)` を接続
- 写真グリッド表示
- カバー写真設定 (tap to set)
- 写真並び替え (DraggableFlatList 等の検討が必要)

### 4. Flows パネル強化

**`app/(app)/notes/[noteId]/edit.tsx` > `FlowsPanel`**

- Flow一覧表示 (placeGroupRepository)
- Flow名称編集インライン
- Flow分割/結合の本実装 (API接続)

### 5. Places パネル実装

**`app/(app)/notes/[noteId]/edit.tsx` > `PlacesPanel`**

- PlaceGroup一覧表示
- 場所候補確認 UI (候補からの選択)
- 手動住所入力との統合 (`places/manual.tsx` との連携)

### 6. Memo パネル強化

- memo の文字数カウンター表示
- markdown プレビュー切替 (オプション)

---

## UI-3 以降のスコープ (参考)

| フェーズ | 主要タスク |
|---------|-----------|
| UI-3 | places/[placeGroupId].tsx リデザイン、flows/[placeGroupId].tsx リデザイン |
| UI-4 | map.tsx UIポリッシュ (メモリーリードマップスタイリング) |
| UI-5 | photos/viewer.tsx ポリッシュ、members.tsx リデザイン、calendar.tsx 新規、onboarding.tsx 再デザイン |
| UI-6 | share.tsx シェアカードポリッシュ |
| UI-7 | 全画面 Integration QA、index.tsx → preview.tsx リダイレクト検討 |

---

## Codex への次フェーズ概要 (UI-2用)

```
UI-2: Edit Data Binding

Goals:
1. Implement useNoteEditDraft(noteId) hook
   - Centralized draft state for all 5 tabs
   - isDirty flag + unsaved changes guard
   - src/features/memoryNotes/hooks/useNoteEditDraft.ts

2. Photos tab full implementation
   - Connect useNotePhotos
   - Photo grid display with cover photo setting
   - Drag reorder (evaluate library options)

3. Flows tab data binding
   - List placeGroups from placeGroupRepository
   - Inline name editing
   - Connect existing flow-recreation logic

4. Places tab data binding
   - List placeGroups with place candidate selection UI
   - Integrate places/manual.tsx flow

Constraints:
- No Firebase/Firestore changes
- No Cloud Functions changes
- No RevenueCat changes
- No package.json changes
- TypeScript Exit 0 required
- Expo lint Exit 0 required
```
