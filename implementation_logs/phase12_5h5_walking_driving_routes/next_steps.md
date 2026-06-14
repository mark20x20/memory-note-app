# Phase 12.5H-5 Next Steps

## すぐに行うこと

### Firebase Functions deploy

```bash
firebase deploy --only functions --project memory-note-app-dev
```

または functions + rules + indexes を一括:

```bash
firebase deploy --only functions,firestore:rules,firestore:indexes --project memory-note-app-dev
```

### 実機 / Simulator で動作確認

1. iOS Simulator でアプリを起動
2. 地図画面を開く
3. PlaceGroup が2件以上ある（かつ座標あり）ノートを開く
4. ルート表示 → 「徒歩」チップを選択
5. 「ルートを生成」ボタンをタップ
6. ルート生成完了後、地図に teal 色の Polyline が描画されること
7. 区間カードに「徒歩 XX分 / YYm」が表示されること
8. 「車」チップを選択 → 同様に blue 色 Polyline が表示されること

### Firestore Console で確認

1. `memory_notes/{noteId}/route_segments` に segmentId ドキュメントが作成されているか
2. `status: 'generated'`, `encodedPolyline`, `decodedPolyline` が保存されているか
3. `expiresAt` が 30日後に設定されているか

---

## Phase 12.5H-6 チェックリスト（transit 実装）

- [ ] `computeRouteSegment` の transit 実装（TRANSIT モード）
- [ ] `generateNoteRoutes` の transit 対応
- [ ] TransitStep 型定義（legs, steps, transit_details）
- [ ] RouteSegmentCard の transit 表示（路線名・乗換回数）

## Phase 12.5H-7 チェックリスト（Premium / RevenueCat）

- [ ] `isPremiumUser = true` を RevenueCat 本実装に差し替え（map.tsx）
- [ ] `isPremiumUser = true` を RevenueCat 本実装に差し替え（routeFunctions.ts）
- [ ] `assertRouteGenerationQuota` を本実装（1日10回 / forceRefresh 1日3回）

## Phase 12.5H-8 チェックリスト（EAS / Android）

- [ ] EAS Build で Android 実機確認
- [ ] Android Maps API key 設定
- [ ] Android での Polyline 描画確認
