# Phase 12.5H-6 Fix: Transit UI Enabled — Next Steps

## 必須

- Firebase Functions deploy: `firebase deploy --only functions`
  (Cloud Functions 側の transit 対応は前フェーズで実装済み、未デプロイの場合は必要)

## 推奨: 実機テスト

1. マップ画面を開く
2. 「公共交通」チップをタップ → routeMode='premium', premiumTravelMode='transit' になること
3. ルートを生成 → orange (#D97B4F) のポリラインが表示されること
4. Firestore の route_segments に `*_transit` ドキュメントが作成されること
5. 区間別モードで「公共交通」チップが選択できること
6. transit 失敗時に gray dashed フォールバックが表示されること

## 確認済みの受け入れ条件 (App 側)

- [x] 「公共交通ルートは次のフェーズで対応予定です。」が消えた
- [x] 「公共交通は次フェーズで対応予定（直線表示）」が消えた
- [x] 公共交通チップが押せる（disabled 解除）
- [x] 公共交通モードで getNoteRouteSegments({ noteId, travelMode: 'transit' }) が呼ばれる
- [x] 公共交通モードで generateNoteRoutes({ noteId, travelMode: 'transit' }) が呼ばれる
- [x] 区間別モードで公共交通を選べる
- [x] segmentTravelModes に transit が入る
- [x] transit Polyline が orange で表示される
- [x] transit 失敗時は gray dashed fallback
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0
