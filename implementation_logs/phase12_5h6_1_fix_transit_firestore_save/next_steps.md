# Phase 12.5H-6.1 Fix Transit Firestore Save — Next Steps

## 必須

1. **Firebase Functions deploy**
   ```
   firebase deploy --only functions
   ```
   
2. **既存の failed transit segments を削除してから再生成**
   - Firestore Console または deleteNoteRouteCache で `travelMode: 'transit'` のセグメントを削除
   - マップ画面で「公共交通」を選択してルート生成

## 確認項目

- [ ] `*_transit` Firestore ドキュメントが `status: generated` で作成される
- [ ] `distanceMeters`, `durationSeconds`, `encodedPolyline`, `decodedPolyline` が保存される
- [ ] `routeSummary` フィールドが transit ドキュメントに存在しない（undefined 除去済み）
- [ ] orange (#D97B4F) polyline がマップに表示される
- [ ] 失敗時は gray dashed フォールバック + `status: failed` + `errorMessage` が保存される
- [ ] 区間別モードで transit 区間も生成できる

## Functions ログで確認できること

成功時:
```
[generateNoteRoutes] travelMode=transit uid=***XXXX noteId=XXXXXXXX
[generateNoteRoutes] segment generated { segmentId, travelMode: 'transit', distanceMeters, ... }
```

失敗時:
```
[generateNoteRoutes] segment=XXX travelMode=transit failed: <エラーメッセージ>
```
