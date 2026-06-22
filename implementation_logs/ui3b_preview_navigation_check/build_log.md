# UI-3B Build Log: Preview Real Data / Navigation Check

## 実施日: 2026-06-23

## 目的

UI-1〜UI-3Aで作成した画面群の導線・実データ表示を確認し、preview.tsx を実用状態に整える。

---

## 確認ファイル一覧

| ファイル | 状態 | 確認結果 |
|---|---|---|
| `app/(app)/notes/[noteId]/preview.tsx` | 要修正 (3点) | → 修正済み |
| `app/(app)/notes/[noteId]/edit.tsx` | 確認のみ | 異常なし |
| `app/(app)/notes/[noteId]/index.tsx` | 確認のみ | 異常なし（役割重複は issues.md に記載） |
| `app/(app)/notes/[noteId]/map.tsx` | 確認のみ | 存在確認 ✓ (Phase 12.5H-7A) |
| `app/(app)/notes/[noteId]/photos/viewer.tsx` | 確認のみ | 存在確認 ✓ |
| `app/(app)/notes/[noteId]/flows/[placeGroupId].tsx` | 確認のみ | 導線確認 ✓ |
| `app/(app)/notes/[noteId]/places/[placeGroupId].tsx` | 確認のみ | 導線確認 ✓ |
| `src/features/placeIntelligence/components/VisitTimelineSection.tsx` | 確認のみ | 異常なし |
| `src/features/placeIntelligence/components/EventMapPreview.tsx` | 確認のみ | 異常なし |
| `src/features/photos/hooks/useNotePhotos.ts` | 確認のみ | 異常なし |
| `src/features/memoryNotes/hooks/useNoteDetail.ts` | 確認のみ | 異常なし |

---

## 修正内容（preview.tsx のみ変更）

### 1. `photosLoading` ゲート削除

**変更前:**
```tsx
{photosLoading ? (
  <View style={styles.mapLoadingBox}>
    <ActivityIndicator color={colors.mapAccent} />
  </View>
) : (
  <EventMapPreview noteId={noteId} photoLocations={photoLocations} height={200} />
)}
```

**変更後:**
```tsx
<EventMapPreview noteId={noteId} photoLocations={photoLocations} height={200} />
```

`EventMapPreview` は内部で `placeGroupRepository.subscribePlaceGroupsByNoteId` を独立購読するため、
`photosLoading` の完了を待つ必要はない。`photoLocations` は PlaceGroup がない場合のフォールバック用。

### 2. 重複 `mapLink` 削除

**変更前:** `EventMapPreview`（内部に "地図で見る" リンク）の下に、さらに "地図を見る →" TouchableOpacity があった。

**変更後:** 重複リンクを削除。`EventMapPreview` の `mapFooter` 内の "地図で見る" のみが残る。

### 3. aiDiary セクション追加

**変更前:** `note.memo` のみ表示。

**変更後:** memo の下に aiDiary セクションを追加。
```tsx
{(note.aiDiaryStatus === 'completed' || note.aiDiaryStatus === 'edited') && note.aiDiary ? (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>AI日記</Text>
    <View style={styles.memoCard}>
      <Text style={styles.memoText}>{note.aiDiary}</Text>
    </View>
  </View>
) : null}
```

### 4. 不要スタイル削除

削除したスタイル: `mapLoadingBox`, `mapLink`, `mapLinkText`

### 5. `photosLoading` の destructuring 削除

```ts
// 変更前
const { photos: notePhotos, isLoading: photosLoading } = useNotePhotos(noteId ?? null);
// 変更後
const { photos: notePhotos } = useNotePhotos(noteId ?? null);
```

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- Functions build: 不要 (Functions は変更なし)
