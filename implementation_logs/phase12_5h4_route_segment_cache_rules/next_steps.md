# Phase 12.5H-4 Next Steps

## すぐに行うこと

### Firebase deploy

以下を一括 deploy する:

```bash
firebase deploy --only functions,firestore:rules,firestore:indexes --project memory-note-app-dev
```

または分割:

```bash
firebase deploy --only firestore:rules --project memory-note-app-dev
firebase deploy --only firestore:indexes --project memory-note-app-dev
firebase deploy --only functions --project memory-note-app-dev
```

### Firebase Console で確認

1. Firestore → Rules タブ
   - `route_segments` の read ルールが追加されているか確認
2. Firestore → Indexes タブ
   - `route_segments` の composite index（travelMode ASC, generatedAt DESC）が作成されているか確認
   - index は作成に数分かかる場合がある
3. Functions → 関数一覧
   - `generateNoteRoutes` / `getNoteRouteSegments` / `deleteNoteRouteCache` が正常に表示されるか確認

---

## Phase 12.5H-5 チェックリスト

### computeRouteSegment の本実装（routesClient.ts）

```
POST https://routes.googleapis.com/directions/v2:computeRoutes
X-Goog-Api-Key: {GOOGLE_ROUTES_API_KEY}
X-Goog-FieldMask: routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration,routes.description,routes.warnings
Content-Type: application/json
```

- [ ] `node-fetch` または標準 `fetch`（Node 18+）で HTTP POST
- [ ] travelMode マッピング: walking→WALK, driving→DRIVE, transit→TRANSIT
- [ ] レスポンスパース: `routes[0]` から必要フィールドを抽出
- [ ] エラーハンドリング（Routes API エラーレスポンス形式）

### generateNoteRoutes の本実装（routeFunctions.ts）

- [ ] PlaceGroup を sortOrder 昇順で取得
- [ ] 隣接ペアのセグメント一覧を構築
- [ ] キャッシュ確認（isRouteSegmentStale）
- [ ] computeRouteSegment で Google Routes API 呼び出し
- [ ] decodePolyline で encodedPolyline を decode
- [ ] RouteSegmentDoc を Firestore に set（expiresAt = 30日後）
- [ ] Premium 判定 + 生成回数クォータを仮実装

### モバイル側での generateNoteRoutes 呼び出し

- [ ] `app/(app)/notes/[noteId]/map.tsx` に `generateNoteRoutes` の callable 呼び出しを追加
- [ ] `routeMode === 'premium' && isPremiumUser` のときにルート生成ボタンを表示
- [ ] ローディング状態の管理

### RouteSegmentCard UI

- [ ] 移動時間・距離・Travel Mode を表示するカードコンポーネント
- [ ] Polyline カラーコーディング（walking=teal, driving=blue, transit=orange）

---

## Phase 12.5H-6 以降

- TRANSIT モード実装（Phase 12.5H-6）
- RevenueCat / Premium entitlement 本実装（Phase 12.5H-7）
  - `isPremiumUser = false` のハードコードを本実装に差し替え
  - `assertRouteGenerationQuota` を本実装
- EAS Build / Android 実機確認（Phase 12.5H-8）
- 「ルートを更新」ボタン（forceRefresh）の実装
