# 04 Premium Access and Cost Control

## アクセス制御方針

### 無料ユーザー

```
- generateNoteRoutes: 呼び出し不可 (permission-denied)
- getNoteRouteSegments: キャッシュ閲覧のみ可
- UI: Premium 案内カードを表示
- Polyline: 直線破線のまま
```

### Premium ユーザー

```
- generateNoteRoutes: 呼び出し可（1日のクォータ内）
- getNoteRouteSegments: 呼び出し可
- deleteNoteRouteCache: 呼び出し可
- UI: 「ルートを生成」ボタンが有効
- Polyline: 実ルート表示（生成後）
```

### 共有ノートでの権限

| ロール | Premium 状態 | generateNoteRoutes | 閲覧 |
|--------|-------------|-------------------|------|
| owner (Premium) | はい | ✅ | ✅ |
| owner (Free) | いいえ | ❌ | ✅ |
| editor (Premium) | はい | ✅ | ✅ |
| editor (Free) | いいえ | ❌ | ✅ |
| viewer (Premium) | はい | ❌ (viewerはNG) | ✅ |
| viewer (Free) | いいえ | ❌ | ✅ |

viewer はルート生成はできないが、owner/editor が生成したキャッシュは閲覧できる。

---

## RevenueCat 統合前の仮実装

現在（Phase 12.5H-1）の仮実装:

```ts
// TODO: Replace with real subscription status from RevenueCat / App Store.
const isPremiumUser = false;
```

将来の実装方針（優先度順）:

### 方針A: Firebase Custom Claims（推奨）

RevenueCat のサーバーサイド Webhook → Firebase Cloud Functions → Custom Claims 更新

```ts
// Cloud Functions 内
const isPremiumUser = request.auth?.token?.premium === true;
```

- メリット: ID Token に含まれるため追加の Firestore アクセス不要。高速。
- デメリット: Custom Claims の更新に最大1時間のラグがある（Token refresh が必要）

### 方針B: Firestore entitlement ドキュメント

```ts
// Firestore: users/{uid}/entitlements/premium
const entitlementSnap = await db.doc(`users/${uid}/entitlements/premium`).get();
const isPremiumUser = entitlementSnap.exists && entitlementSnap.data()?.active === true;
```

- メリット: RevenueCat Webhook で即時更新できる
- デメリット: 毎回 Firestore 読み取りが発生する（コスト）

### 方針C: RevenueCat REST API で直接確認

```ts
const resp = await fetch(`https://api.revenuecat.com/v1/subscribers/${uid}`, {
  headers: { Authorization: `Bearer ${revenueCatApiKey}` }
});
const isPremiumUser = /* resp の entitlements を確認 */;
```

- デメリット: RevenueCat への HTTP 呼び出しが毎回発生、レイテンシ増加

**初期採用: 方針B（Firestore entitlement）** を推奨。
RevenueCat の Webhook を `users/{uid}/entitlements/premium` に書き込む構成にする。

---

## コスト制御設計

### Google Routes API 料金（参考）

| SKU | 単価（目安） |
|-----|------------|
| Compute Routes (Basic) | $0.005 / リクエスト |
| Compute Routes (Advanced) | $0.01 / リクエスト |
| Transit Routes | $0.01 / リクエスト |

参考: https://mapsplatform.google.com/pricing/ （要確認）

例: 10 区間 × 3 モード = 30 リクエスト = 約 $0.15〜$0.30 / ノート

### 生成回数制限（1日あたり）

```ts
// Firestore カウンタパス案
// users/{uid}/usage/route_generation_daily/{yyyyMMdd}
// または
// route_generation_usage/{uid}_{yyyyMMdd}  （コレクション直下 = 管理しやすい）
```

制限値（初期案）:

| 項目 | 制限 |
|------|------|
| 1ユーザー / 1日の生成回数 | 10回（最大10ノート分） |
| 1ノートあたりの最大区間数 | 10区間 |
| forceRefresh の最大回数 | 3回 / ノート / 日 |

forceRefresh はキャッシュを使わず再生成するため、コストが高い。
通常生成より厳しく制限する。

### カウンタ実装（擬似コード）

```ts
async function assertRouteGenerationQuota(
  db: admin.firestore.Firestore,
  uid: string,
  isForceRefresh: boolean
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const usageRef = db.doc(`route_generation_usage/${uid}_${today}`);
  const usageSnap = await usageRef.get();

  const usage = usageSnap.exists ? (usageSnap.data() as { count: number; forceRefreshCount: number }) : { count: 0, forceRefreshCount: 0 };

  const DAILY_LIMIT = 10;
  const FORCE_REFRESH_LIMIT = 3;

  if (usage.count >= DAILY_LIMIT) {
    throw new HttpsError('resource-exhausted', '1日のルート生成回数の上限に達しました');
  }

  if (isForceRefresh && usage.forceRefreshCount >= FORCE_REFRESH_LIMIT) {
    throw new HttpsError('resource-exhausted', '本日の強制再生成の上限に達しました');
  }

  // 更新
  await usageRef.set({
    uid,
    date: today,
    count: admin.firestore.FieldValue.increment(1),
    forceRefreshCount: isForceRefresh
      ? admin.firestore.FieldValue.increment(1)
      : admin.firestore.FieldValue.increment(0),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}
```

---

## API エラー時のフォールバック

Google Routes API が失敗した場合:

1. セグメントの `status: 'failed'` を Firestore に保存
2. Cloud Functions から `skippedCount` をインクリメントして返す
3. モバイルアプリ側: `status: 'failed'` のセグメントは直線ルートで代替表示する

UI表示:

```
一部区間で実ルートを取得できませんでした。
該当区間は直線ルートで表示しています。
```

---

## コスト最小化チェックリスト

- [x] キャッシュ（TTL 30日）: 同じ区間は再度 API を呼ばない
- [x] 無料ユーザーは API 呼び出しなし: 直線ルートのみ
- [x] 生成回数制限: 1日あたり最大10回
- [x] forceRefresh 制限: 1日3回まで
- [x] 座標がない PlaceGroup はスキップ: 無駄な API 呼び出しなし
- [x] 最大区間数: 1ノートあたり10区間
- [ ] 将来: 複数 waypoint を1リクエストにまとめる（Routes API は intermediate waypoints 対応）
- [ ] 将来: API Budget Alert（Google Cloud Console で設定）

---

## 課金設計まとめ（将来の full plan）

```
無料プラン:
  - 直線ルート（API コスト: 0）
  - ルート生成ボタンなし

Premium プラン（月額課金）:
  - 実ルート生成（Routes API）
  - 徒歩 / 車 / 公共交通の選択
  - 区間ごとの距離・時間表示
  - 1日あたり生成上限: 10回
  - キャッシュ有効期間: 30日（自動再生成なし）
```
