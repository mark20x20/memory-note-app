# UI-17 Design Decisions

## 1. matchedGroup を既存の placeGroupId 購読から取得

**決定:** 新しい `usePlaceGroups` フックを追加せず、既存の `placeGroupRepository.subscribePlaceGroupsByNoteId` のコールバック内で `matchedGroup` を同時にセットする。

**理由:**
- viewer はすでに `placeGroupId` モードの場合に `placeGroupRepository.subscribePlaceGroupsByNoteId` を購読している。
- 同じコールバック内で `group` を `setMatchedGroup` するだけで追加購読なしにラベルを取得できる。
- 追加の Firestore 購読を避けるという方針に合致。

## 2. placeLabel は userEditedLabel を優先

**決定:** `matchedGroup.userEditedLabel ?? matchedGroup.label` の順で表示。

**理由:**
- `userEditedLabel` はユーザーが手動修正した場所名。これを優先すべき。
- `label` は AI またはAPIが設定した自動ラベル。fallback として適切。

## 3. Flow ラベルは sortOrder から生成

**決定:** `matchedGroup.sortOrder != null` の場合のみ `Flow N`（N = sortOrder + 1）を表示。

**理由:**
- `sortOrder` は 0-indexed なので +1 して表示。
- `sortOrder` がない場合（古いデータ等）は表示しない方が自然。

## 4. ボトムメタデータパネルはメインFlatListの外側にオーバーレイ

**決定:** メタデータを `renderItem` 内ではなく、`position: 'absolute'` のパネルに表示。

**理由:**
- `currentIndex` が変わると `currentPhoto` も変わり、自動的に `takenAt` が更新される。
- パネルをスワイプ時にアニメーション不要で切り替えられる。
- `renderItem` に置くとスワイプ中に写真と一緒にパネルが移動してしまう。

## 5. expo-linear-gradient は使わない

**決定:** 単純な `rgba` 背景色でヘッダー・パネルを実装。グラジェントは使わない。

**理由:**
- `expo-linear-gradient` が `package.json` に含まれていない。
- `rgba(15,14,13,0.48)` のフラット背景でも視覚的に十分なオーバーレイ効果が得られる。
- 今回のスコープ外のパッケージ追加を避ける。

## 6. container スタイルを 2 種類に分離

**決定:** `container`（loading/error/empty 用・中央揃え）と `mainContainer`（メイン・flex:1のみ）を分離。

**理由:**
- loading/error/empty は `justifyContent: 'center', alignItems: 'center'` が必要。
- メインビューアで同じスタイルを使うと FlatList が正常に展開しない。
