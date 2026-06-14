# Phase 12.5H-5.5 Next Steps

## すぐに行うこと

### Firebase Functions deploy

```bash
firebase deploy --only functions --project memory-note-app-dev
```

### 実機 / Simulator で動作確認（区間別モード）

1. iOS Simulator でアプリを起動
2. PlaceGroup が3件以上ある（かつ座標あり）ノートを開く
3. 地図画面 → `[区間別]` チップをタップ
4. 各区間の `[徒歩]` / `[車]` チップで移動手段を変更
5. `[選択した移動手段でルートを生成]` をタップ
6. ルート生成完了後、地図に区間ごとの色分けPolylineが描画されること
   - 徒歩区間: teal (#4FA8A1)
   - 車区間: blue (#5B8DD9)
   - 未生成区間: gray dashed fallback
7. 区間カードに「徒歩 XX分 / YYm」「車 XX分 / YYkm」が混在表示されること
8. `[公共交通]` チップが disabled 表示で選択不可なこと

### Firestore Console で確認

1. `memory_notes/{noteId}/route_segments` に walking と driving の両方のドキュメントが
   同じ区間（同じ fromPlaceGroupId / toPlaceGroupId）で作成されていること
   例: `group1_group2_walking` と `group1_group2_driving` が共存
2. 各ドキュメントに `travelMode` フィールドが正しく設定されていること

### 既存モードの動作確認

1. `[徒歩]` チップをタップ → teal Polyline 表示
2. `[車]` チップをタップ → blue Polyline 表示
3. 既存の単一モードが壊れていないこと

---

## Phase 12.5H-6 チェックリスト（transit 実装）

- [ ] `computeRouteSegment` の transit 実装（TRANSIT モード）
- [ ] `generateNoteRoutes` の transit 対応（スキップ→実装）
- [ ] TransitStep 型定義（legs, steps, transit_details）
- [ ] RouteSegmentCard の transit 表示（路線名・乗換回数）
- [ ] 区間別モードの公共交通チップを enabled に変更

## Phase 12.5H-7 チェックリスト（Premium / RevenueCat）

- [ ] `isPremiumUser = true` を RevenueCat 本実装に差し替え（map.tsx）
- [ ] `isPremiumUser = true` を RevenueCat 本実装に差し替え（routeFunctions.ts）
- [ ] `assertRouteGenerationQuota` を本実装（1日10回 / forceRefresh 1日3回）

## Phase 12.5H-8 チェックリスト（EAS / Android）

- [ ] EAS Build で Android 実機確認
- [ ] Android Maps API key 設定
- [ ] Android での Polyline 描画確認（区間別色分けを含む）
