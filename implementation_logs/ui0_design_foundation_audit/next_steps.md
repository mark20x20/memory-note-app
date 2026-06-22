# UI-0 Design Foundation Audit — Next Steps

## UI-1 で実装する内容

### 1. デザイントークン拡張 (小変更)

**`src/shared/theme/spacing.ts`**
- `borderRadius.xxl = 24` を追加 (spec radius.cardLarge)

**`src/shared/components/ui/AppText.tsx`**
- variant を拡張: `display(28)`, `screenTitle(24)`, `cardTitle(18)`, `bodyMd(15)`, `micro(11)` を追加
- 既存 h1/h2/h3/h4/body/bodySmall/caption/label/button は削除しない

**`src/shared/components/ui/Card.tsx`**
- `borderRadius: 12` → `borderRadius.xl` (20) に修正
- ※ 変更によって既存画面の見た目が変わるか要確認

### 2. 共通コンポーネント新規作成

**`src/shared/components/ui/EditTabBar.tsx`**
```
- tabs: Array<{ key: EditTabKey; label: string }>
- activeTab: EditTabKey
- onTabChange: (key: EditTabKey) => void
- height: 44
- active: bg #FDE7E2, text #F26B5B
- inactive: text #7A746D
- tab radius: 999 (pill)
- label: 13px / weight 500
```

**`src/shared/components/ui/StickyBottomBar.tsx`**
```
- children: ReactNode (ボタン等を受け取る)
- SafeAreaView 対応 (bottom inset)
- min height: 78
- background: colors.surface (#FFFFFF)
- 上部に border-top: 1px #E8DED4
```

### 3. Edit タブ型定義

**`src/features/memoryNotes/types/edit.ts`** (新規)
```typescript
export type EditTabKey = 'overview' | 'photos' | 'flows' | 'places' | 'memo';

export interface NoteEditDraft {
  title: string;
  memo: string;
  aiDiary: string;
  // flows / places は UI-2 で拡張
}
```

### 4. `preview.tsx` 新規作成

**`app/(app)/notes/[noteId]/preview.tsx`**

構成:
- NotePreviewScreenContent (ファイル内 component)
  - PreviewHeroSection (ヒーロー写真 + タイトル + 日付 + 場所)
  - VisitTimelineSection (既存コンポーネント流用)
  - EventMapPreview (既存コンポーネント流用)
  - PreviewMemoSection (メモ表示)
  - PreviewBottomActions (「編集する」CTA — ghost/secondary)
- ScreenHeader (既存流用)
- Screen (既存流用)

データ取得:
- `useNoteDetail(noteId)` — ノート情報
- `useNotePhotos(noteId)` — 写真

ナビゲーション:
- 「編集する」→ `router.push('/(app)/notes/[noteId]/edit')`
- 「地図を見る」→ `router.push('/(app)/notes/[noteId]/map')`
- ヒーロー写真タップ → `router.push('/(app)/notes/[noteId]/photos/viewer')`

### 5. `edit.tsx` タブシェル化 (データバインディングはUI-2)

**`app/(app)/notes/[noteId]/edit.tsx`** をリファクタ:
- EditTabBar を追加 (5タブ)
- StickyBottomBar に「保存」「キャンセル」を配置
- 5パネルのスケルトン (OverviewPanel, PhotosPanel, FlowsPanel, PlacesPanel, MemoPanel)
- 各パネルは UI-1 ではプレースホルダー表示 → UI-2 でデータバインディング
- 既存の flow-recreation ボタンは Flows タブに移動
- 既存の aiDiary 表示は Overview タブか Memo タブに移動

### 6. index.ts への export 追加

**`src/shared/components/ui/index.ts`**
```typescript
export { EditTabBar } from './EditTabBar';
export { StickyBottomBar } from './StickyBottomBar';
```

---

## 作成予定ファイル (UI-1)

```
src/shared/components/ui/EditTabBar.tsx       (新規)
src/shared/components/ui/StickyBottomBar.tsx  (新規)
src/features/memoryNotes/types/edit.ts        (新規)
app/(app)/notes/[noteId]/preview.tsx          (新規)
```

## 変更予定ファイル (UI-1)

```
src/shared/theme/spacing.ts                  (borderRadius.xxl 追加)
src/shared/components/ui/AppText.tsx         (variant 拡張)
src/shared/components/ui/Card.tsx            (radius 修正)
src/shared/components/ui/index.ts            (新コンポーネント export 追加)
app/(app)/notes/[noteId]/edit.tsx            (タブシェル化)
```

---

## UI-2 以降のスコープ (参考)

| フェーズ | 主要タスク |
|---------|-----------|
| UI-2 | edit.tsx 5タブデータバインディング、useNoteEditDraft フック、写真並び替え |
| UI-3 | places/[placeGroupId].tsx リデザイン、flows/[placeGroupId].tsx リデザイン |
| UI-4 | map.tsx UIポリッシュ (メモリーリードマップスタイリング) |
| UI-5 | photos/viewer.tsx ポリッシュ、members.tsx リデザイン、calendar.tsx 新規、onboarding.tsx 再デザイン |
| UI-6 | share.tsx シェアカードポリッシュ |
| UI-7 | 全画面 Integration QA、index.tsx → preview.tsx リダイレクト検討 |

---

## Codex への次フェーズ概要 (UI-1用)

```
UI-1: Preview/Edit Shell

Goals:
1. Create app/(app)/notes/[noteId]/preview.tsx
   - Hero photo (360h), title, date, place
   - Reuse VisitTimelineSection + EventMapPreview
   - Memo section (quiet display)
   - Bottom action: 「編集する」 → edit.tsx
   Design tokens: colors.background #FAF7F2, radius.card 20, radius.cardLarge 24

2. Refactor app/(app)/notes/[noteId]/edit.tsx
   - Add EditTabBar (5 tabs: Overview/Photos/Flows/Places/Memo)
   - Add StickyBottomBar (save/cancel)
   - Each tab shows placeholder content (UI-2 will add data binding)
   - Move flow-recreation button into Flows tab
   Tab spec: height 44, active bg #FDE7E2, active text #F26B5B

3. Add shared components:
   - src/shared/components/ui/EditTabBar.tsx
   - src/shared/components/ui/StickyBottomBar.tsx

4. Extend theme tokens:
   - spacing.ts: add borderRadius.xxl = 24
   - AppText.tsx: add display(28), screenTitle(24), cardTitle(18), bodyMd(15), micro(11) variants

Constraints:
- No Firebase/Firestore changes
- No Cloud Functions changes
- No RevenueCat changes
- No package.json changes
- TypeScript Exit 0 required
- Expo lint Exit 0 required
```
