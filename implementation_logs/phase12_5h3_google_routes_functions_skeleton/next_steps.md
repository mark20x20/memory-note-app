# Phase 12.5H-3 Next Steps

## すぐに行うこと

### Firebase Functions deploy

```bash
firebase deploy --only functions
```

deploy 後、Firebase Console で以下3関数が登録されているか確認する:
- `generateNoteRoutes`
- `getNoteRouteSegments`
- `deleteNoteRouteCache`

---

## Phase 12.5H-4 に向けた準備

### Firestore Security Rules に route_segments を追加

`firebase/firestore.rules` に以下を追加:

```
match /memory_notes/{noteId}/route_segments/{segmentId} {
  allow read: if request.auth != null && isNoteMember(noteId, request.auth.uid);
  allow write: if false; // Cloud Functions Admin SDK のみ書き込み可
}
```

### Firestore composite index を追加

`firebase/firestore.indexes.json` に以下を追加:

```json
{
  "collectionGroup": "route_segments",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "travelMode", "order": "ASCENDING" },
    { "fieldPath": "generatedAt", "order": "DESCENDING" }
  ]
}
```

### getNoteRouteSegments の本実装

- `route_segments` サブコレクションを travelMode でフィルタして取得
- `RouteSegmentSummary` 型でレスポンスを返す

---

## Phase 12.5H-5 チェックリスト

- [ ] `computeRouteSegment()` に Google Routes API の実際の fetch 実装
  - `POST https://routes.googleapis.com/directions/v2:computeRoutes`
  - travelMode マッピング: walking→WALK, driving→DRIVE
  - FieldMask ヘッダー: `routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration`
- [ ] `generateNoteRoutes` の本実装
  - PlaceGroup を sortOrder 昇順で取得
  - 隣接ペアごとに `computeRouteSegment()` を呼び出す
  - Firestore に `RouteSegmentDoc` として保存（expiresAt = 30日後）
  - `decodePolyline()` で encodedPolyline を decode して保存
- [ ] モバイル側で `generateNoteRoutes` callable を呼び出す
- [ ] `RouteSegmentCard` UI コンポーネント実装

---

## Phase 12.5H-6 以降

- TRANSIT モード実装（Phase 12.5H-6）
- RevenueCat / Premium entitlement 本実装（Phase 12.5H-7）
- EAS Build / Android 実機確認（Phase 12.5H-8）
