# UI-2 Edit Tab Data Binding — Next Steps

## UI-3 で実装する内容

### 1. 写真並び替え (PhotosPanel)

**`src/features/memoryNotes/components/edit/panels/PhotosPanel.tsx`**

- DraggableFlatList または同等ライブラリの評価・導入 (package.json 変更が必要)
- 並び替え後のsortOrderをFirestoreに永続化する API の検討
- photoRepository に `updatePhotoSortOrder(noteId, photoId, sortOrder)` を追加

### 2. usePlaceGroups フック

**`src/features/placeIntelligence/hooks/usePlaceGroups.ts`** (新規)

```ts
export function usePlaceGroups(noteId: string | null) {
  const [groups, setGroups] = useState<PlaceGroupDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!noteId) { setGroups([]); return; }
    setIsLoading(true);
    const unsub = placeGroupRepository.subscribePlaceGroupsByNoteId(
      noteId,
      (g) => { setGroups(g); setIsLoading(false); },
      () => setIsLoading(false)
    );
    return unsub;
  }, [noteId]);
  
  return { groups, isLoading };
}
```

- edit.tsx で一元購読し、FlowsPanel / PlacesPanel に props で渡す

### 3. 完全な離脱ガード

- Expo Router の `useFocusEffect` + navigation event で Android ハードウェアバックを制御
- `isDirty` に応じて離脱前確認アラートを表示
- または `usePreventLeave` 的なユーティリティフックを実装

### 4. places/[placeGroupId].tsx リデザイン (UI-3 スコープ)

- PlacesPanel からの候補確認フローのUXを改善
- 候補選択完了後に PlacesPanel に戻るナビゲーションの整合性を確認

### 5. flows/[placeGroupId].tsx リデザイン (UI-3 スコープ)

- FlowsPanel からの詳細確認フローのUXを改善

---

## UI-4 以降のスコープ (参考)

| フェーズ | 主要タスク |
|---------|-----------|
| UI-4 | map.tsx UIポリッシュ (メモリーリードマップスタイリング) |
| UI-5 | photos/viewer.tsx ポリッシュ、members.tsx リデザイン、calendar.tsx 新規、onboarding.tsx 再デザイン |
| UI-6 | share.tsx シェアカードポリッシュ |
| UI-7 | 全画面 Integration QA、index.tsx → preview.tsx リダイレクト検討 |

---

## Codex への次フェーズ概要 (UI-3用)

```
UI-3: Place/Flow Detail Redesign + Photo Reorder

Goals:
1. places/[placeGroupId].tsx リデザイン
   - UI spec準拠のカード + 候補マップ + アクションボタン
   - edit.tsx PlacesPanel との遷移一貫性

2. flows/[placeGroupId].tsx リデザイン
   - UI spec準拠のフロー詳細画面
   - edit.tsx FlowsPanel との遷移一貫性

3. PhotosPanel 写真並び替え
   - DraggableFlatList or equivalent
   - sortOrder Firestore 永続化

4. usePlaceGroups フック作成
   - FlowsPanel / PlacesPanel の二重購読を解消

Constraints:
- No Firebase/Firestore schema changes
- No Cloud Functions changes
- No RevenueCat changes
- TypeScript Exit 0
- Expo lint Exit 0
```
