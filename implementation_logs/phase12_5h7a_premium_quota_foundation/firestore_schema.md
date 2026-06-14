# Phase 12.5H-7A: Firestore スキーマ詳細

## users/{uid}/entitlements/premium

Cloud Functions Admin SDK のみ書き込む（Firestore Rules で `allow write: if false`）。
クライアントは read のみ（自分のドキュメントのみ）。

### フィールド

| フィールド | 型 | 説明 |
|---|---|---|
| `active` | boolean | Premium が有効かどうか |
| `source` | string | 付与元（`manual_dev` / `revenuecat` / `admin`） |
| `plan` | string? | プラン種別（`premium_monthly` / `premium_yearly` / `trial`） |
| `updatedAt` | Timestamp | 最終更新日時 |
| `expiresAt` | Timestamp? | 有効期限（null = 無期限） |

### 手動付与手順（開発中）

1. Firebase Console → Firestore → `users/{uid}/entitlements`
2. ドキュメント ID: `premium`
3. フィールド:
   ```json
   {
     "active": true,
     "source": "manual_dev",
     "updatedAt": <serverTimestamp>
   }
   ```

uid は `[DEV]` バッジ（Premium ロック時に map.tsx のカードに表示）で確認できる。

## users/{uid}/route_usage/{yyyyMMdd}

Cloud Functions Admin SDK がトランザクションで書き込む（Firestore Rules で `allow write: if false`）。
クライアントは read のみ（将来の残回数表示用）。

### フィールド

| フィールド | 型 | 説明 |
|---|---|---|
| `dateKey` | string | UTC yyyyMMdd 例: `"20260615"` |
| `generateCount` | number | その日のルート生成回数 |
| `forceRefreshCount` | number | その日の forceRefresh 回数 |
| `createdAt` | Timestamp | ドキュメント作成日時 |
| `updatedAt` | Timestamp | 最終更新日時 |

### インクリメント動作

- ドキュメント未存在 → `set()` で新規作成（generateCount: 1）
- ドキュメント存在 → `update()` で `FieldValue.increment(1)`
- forceRefresh=true のとき `forceRefreshCount` もインクリメント
- すべてトランザクション内で実行（read-check-write を atomic に）

## Firestore Rules（追加分）

```
match /users/{userId} {
  // ...既存ルール...

  match /entitlements/{entitlementId} {
    allow read: if request.auth != null && request.auth.uid == userId;
    allow write: if false;
  }

  match /route_usage/{dateKey} {
    allow read: if request.auth != null && request.auth.uid == userId;
    allow write: if false;
  }
}
```
