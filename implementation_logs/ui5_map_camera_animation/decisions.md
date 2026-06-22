# UI-5 Design Decisions

## 1. `selectGroup()` ヘルパーで setSelectedGroupId と animateToRegion を統合

**決定:** `setSelectedGroupId(group.id)` を直接呼ぶ2箇所を `selectGroup(group)` ヘルパーに置き換える。

**理由:**
- ピンタップとタイムラインタップの両方で同じ処理が必要
- 将来の選択時処理（ハプティクス、ログ等）をヘルパーに集約できる
- ヘルパーを関数宣言にすることで、`useCallback` などの依存配列を増やさずに済む

## 2. animateToRegion の delta を 0.008 に固定

**決定:** `latitudeDelta: 0.008, longitudeDelta: 0.008`（ズームレベル約14）

**理由:**
- スペックの推奨（spec からの引用）に準拠
- 街歩きレベルの思い出記録で適切なズーム感
- 複数の場所が密集している場合も大体見える範囲

## 3. duration を 300ms に設定

**決定:** `animateToRegion(..., 300)`

**理由:**
- スペック要件通り
- ユーザーが「瞬間移動」と感じず、かつ待たされる感もない適切な速度

## 4. 安全ガードを関数内に集約

**決定:** `selectGroup` 内で以下をチェックしてから animateToRegion を呼ぶ:
- `mapRef.current != null`
- `typeof latitude === 'number'` かつ `latitude !== 0`
- `typeof longitude === 'number'` かつ `longitude !== 0`

**理由:**
- 位置情報なしのグループ（`getGroupsWithLocation` で除外済みだが念のため）
- MapView がまだマウントされていない edge case
- 0,0 座標（データ欠損のデフォルト値）への移動を防ぐ

## 5. 初期表示は animateToRegion を呼ばない

**決定:** 初期表示は `initialRegion={calcRegionForGroups(groupsWithLocation)}` のみ。useEffect で自動的に animateToRegion しない。

**理由:** ユーザーがまずルート全体を俯瞰できることが重要。
ピン選択は明示的なユーザー操作時のみ。
