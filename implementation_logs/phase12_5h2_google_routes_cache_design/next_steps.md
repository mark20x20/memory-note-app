# Phase 12.5H-2 Next Steps

## Phase 12.5H-3 に向けた準備事項

### Google Routes API の有効化確認

1. Google Cloud Console → API & Services → ライブラリ で "Routes API" を検索・有効化
2. 既存 API キーに Routes API を追加するか、新規キーを作成するか判断
   - 推奨: 新規キー `GOOGLE_ROUTES_API_KEY`（Places API キーと分離）
3. Secret Manager に `GOOGLE_ROUTES_API_KEY` を登録
   ```bash
   echo "YOUR_KEY" | gcloud secrets create GOOGLE_ROUTES_API_KEY \
     --data-file=- --project=memory-note-app-dev
   ```

### encodedPolyline decode パッケージの判断

- 候補A: `@googlemaps/polyline-codec`（npm install が必要）
- 候補B: 自前実装（30行程度、外部依存なし）
- 判断基準: Functions のバンドルサイズ・メンテコスト

### API 料金の最終確認

- Google Maps Platform のダッシュボードで Billing を確認
- Routes API の SKU と単価を記録する
- $200 / 月の無料クレジットとの兼ね合いを試算する

---

## Phase 12.5H-3 実装ステップ

1. `firebase/functions/src/route/` ディレクトリ作成
2. `types.ts` 作成（`RouteSegmentDoc`, `GenerateNoteRoutesInput` などの型）
3. `routesClient.ts` 作成（Google Routes API HTTP クライアント skeleton）
4. `polylineUtils.ts` 作成（encodedPolyline decode 実装）
5. `routeCache.ts` 作成（`isRouteSegmentStale`, `calcExpiresAt`）
6. `routeFunctions.ts` 作成（`generateNoteRoutes` skeleton: auth チェック → permission-denied）
7. `index.ts` に `generateNoteRoutes`, `getNoteRouteSegments` を export 追加
8. `npm run build` でエラーがないか確認
9. `firebase deploy --only functions`
10. Firebase Console で関数が登録されているか確認

---

## 将来フェーズのチェックリスト

### Phase 12.5H-4
- [ ] `firestore.rules` に `route_segments` の read ルールを追加
- [ ] `firestore.indexes.json` に複合インデックスを追加
- [ ] `getNoteRouteSegments` の実装完了

### Phase 12.5H-5
- [ ] `generateNoteRoutes` の walking / driving 本実装
- [ ] Google Routes API 呼び出しテスト（実際の座標を使って手動テスト）
- [ ] モバイル側 Map 画面に「ルートを生成」ボタン追加
- [ ] 区間情報カード（RouteSegmentCard）実装
- [ ] 失敗フォールバック（直線 Polyline）の実装

### Phase 12.5H-6
- [ ] TRANSIT モードの実装
- [ ] 区間表示（電車・バス・徒歩の内訳）

### Phase 12.5H-7
- [ ] RevenueCat Webhook ハンドラ実装
- [ ] `users/{uid}/entitlements/premium` Firestore 更新
- [ ] `isPremiumUser` を本実装に差し替え
- [ ] `usePremiumStatus` フック実装

### Phase 12.5H-8
- [ ] EAS Build / Android 実機確認
- [ ] Polyline アニメーション
- [ ] EventMapPreview で実ルート Polyline 対応
- [ ] 「ルートを更新」ボタン（forceRefresh）
