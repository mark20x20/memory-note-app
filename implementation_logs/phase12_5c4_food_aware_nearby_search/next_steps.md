# Phase 12.5C-4 Food-aware Nearby Search — Next Steps

## フェーズ完了条件

Phase 12.5C-4 は以下がすべて完了した時点で完了とみなす。

- [x] `searchNearbyPlaces` が `includedTypes` を受け取れる（`maxResultCount: 20`）
- [x] `isFoodRelatedNote` 関数を `placeUtils.ts` に追加
- [x] `FOOD_INCLUDED_TYPES = ['restaurant', 'cafe']` を定義
- [x] `MAX_SAVED_CANDIDATES = 20` を定義
- [x] `mergeDedupe` / `searchPlacesForGroup` ヘルパーを追加
- [x] `fetchAndSaveCandidates` が food-aware に対応
- [x] `enrichNotePlaces` が food-aware に対応
- [x] `getPlaceCandidatesForGroup` が food-aware に対応
- [x] `refreshPlaceCandidates` が food-aware に対応
- [x] candidates が `distanceMeters` 昇順で保存される
- [x] `userConfirmed=false` が維持されている
- [x] AIランキングが実装されていない
- [x] `npm run build` in `firebase/functions` が Exit 0
- [x] `npx tsc --noEmit` が Exit 0
- [x] `npx expo lint` が Exit 0
- [x] 実装ログ作成完了

---

## Step 1: Firebase deploy（人間が実施）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools deploy --only functions --project memory-note-app-dev
```

---

## Step 2: Wasabi Plus ノートで forceRefresh=true 再テスト

1. 開発用テスト画面 `/(app)/dev/place-callable-test` を開く
2. Wasabi Plus 写真を含むノートの `noteId` を入力
3. `forceRefresh: true` にして `enrichNotePlaces` を実行
4. PlaceGroups の候補一覧を確認

**期待結果:**
- `Candidates (N件 / 最大20件, 距離順)` で候補数が増加
- Wasabi Plus 山葵日料 が1位または上位に表示される
- `distanceMeters` が最小の候補が先頭になる

---

## Step 3: 結果判断フロー

### ケース A: Wasabi Plus が候補上位に出た

```text
→ Phase 12.5C-4 の目的達成
→ Phase 12.5E 本番 UI へ進む
```

### ケース B: まだ Wasabi Plus が候補に出ない

```text
→ Cloud Functions ログで isFoodRelated=true になっているか確認
→ isFoodRelated=false の場合: ノートの title/memo/noteType を確認
→ isFoodRelated=true でも出ない場合: food Nearby Search 200m の候補をログで確認
→ それでも出ない場合: Text Search fallback の実装を検討（Phase 12.5D-text）
```

### ケース C: Text Search fallback が必要と判断した場合

```text
実装方針:
- enrichNotePlaces で food+general Nearby が 0件または上位 confidence が低い場合に
  searchTextPlaces を fallback として呼び出す
- textQuery = ノートの title をそのまま使う（シンプル版）
```

---

## Step 4: Firestore インデックス確認

`orderBy('distanceMeters', 'asc')` クエリで `FAILED_PRECONDITION` エラーが出た場合:

```text
Firestore コンソールに出力されたリンクをクリックしてインデックスを作成する
または firestore.indexes.json に追加して deploy する
```

---

## Step 5: Phase 12.5E 本番 UI へ進む

### Phase 12.5E への移行プロンプト

```
Phase 12.5E: Places UI 画面実装

参照ドキュメント:
- docs/phase12_5_place_intelligence/06_ui_flow.md

実装画面:
- SCR-PLACE-001: places 一覧画面（app/(app)/notes/[noteId]/places/index.tsx）
- SCR-PLACE-002: 候補確認画面（app/(app)/notes/[noteId]/places/[placeGroupId].tsx）
- SCR-PLACE-004: 手動入力画面（app/(app)/notes/[noteId]/places/manual.tsx）

方針:
- 候補表示は distanceMeters 昇順（近い順）
- confidence は開発用参考値として非表示またはサブ表示
- userConfirmed = false のグループは「要確認」バッジを表示
- AIランキングはスキップ
- 最大20件の候補を上位3件表示 + 折りたたみで残りを表示
```
