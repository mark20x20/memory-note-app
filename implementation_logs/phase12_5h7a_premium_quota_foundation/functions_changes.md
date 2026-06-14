# Phase 12.5H-7A: Cloud Functions 変更詳細

## types.ts への追加

`PremiumEntitlementDoc` と `RouteUsageDoc` の型定義を追加。
`firebase-admin/firestore` の `Timestamp` を使用（クライアント SDK とは別）。

## routeFunctions.ts への追加

### 定数

```ts
const MAX_GENERATE_COUNT_PER_DAY = 10;
const MAX_FORCE_REFRESH_COUNT_PER_DAY = 3;
```

### getDateKey()

UTC yyyyMMdd 形式の日付キーを返す。
route_usage ドキュメントの ID として使用する。

### assertPremiumUser(db, uid)

1. `users/{uid}/entitlements/premium` を get
2. ドキュメント未存在 → `permission-denied`
3. `active !== true` → `permission-denied`
4. `expiresAt` が過去 → `permission-denied`

### assertRouteGenerationQuota(db, uid, forceRefresh)

Firestore トランザクション内で:
1. `users/{uid}/route_usage/{dateKey}` を read
2. `generateCount >= 10` → `resource-exhausted`
3. `forceRefresh && forceRefreshCount >= 3` → `resource-exhausted`
4. 上限内なら カウントをインクリメントして commit

### generateNoteRoutes の処理順序（Phase 12.5H-7A 後）

1. 認証チェック（`request.auth`）
2. input バリデーション（noteId, travelMode / segmentTravelModes）
3. owner/editor 権限確認（`assertOwnerOrEditor`）
4. **Premium 確認（`assertPremiumUser`）← NEW**
5. **quota チェック（`assertRouteGenerationQuota`）← NEW**
6. PlaceGroup を sortOrder 昇順で取得
7. 隣接ペアのキャッシュ確認
8. Google Routes API でルート生成
9. Firestore に保存

## エラーコード対応表

| エラー | コード | 原因 |
|---|---|---|
| 未認証 | `unauthenticated` | Firebase Auth なし |
| Premium なし | `permission-denied` | entitlement ドキュメント未存在 / active=false / 期限切れ |
| 生成回数超過 | `resource-exhausted` | generateCount >= 10 |
| forceRefresh 超過 | `resource-exhausted` | forceRefreshCount >= 3 |
| owner/editor でない | `permission-denied` | ノートのメンバーロール不足 |
