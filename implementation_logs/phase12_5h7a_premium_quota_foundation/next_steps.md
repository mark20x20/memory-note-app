# Phase 12.5H-7A Next Steps

## ビルド・デプロイ手順

### 1. Functions ビルド確認

```bash
cd firebase/functions
npm run build
```

### 2. クライアント型チェック

```bash
npx tsc --noEmit
```

### 3. Lint

```bash
npx expo lint
```

### 4. Firebase deploy

```bash
# Firestore Rules
firebase deploy --only firestore:rules --project memory-note-app-dev

# Functions
firebase deploy --only functions --project memory-note-app-dev
```

## 動作確認手順

### Premium 未付与の確認

1. iOS Simulator でアプリ起動
2. map.tsx の地図画面を開く
3. `[徒歩]` / `[車]` チップをタップ → Premium ロック UI が表示されること
4. `[DEV]` ガイドに `users/{uid}/entitlements/premium` のパスが表示されること

### Premium 付与後の確認

1. Firebase Console → Firestore → 上記パスにドキュメント作成:
   ```json
   { "active": true, "source": "manual_dev", "updatedAt": <serverTimestamp> }
   ```
2. アプリが即時に Premium ロック解除される（onSnapshot でリアルタイム反映）
3. ルート生成ボタンが有効になり、ルートが生成できること

### クォータ確認

1. Premium 付与済みの状態でルートを生成する
2. Firestore Console → `users/{uid}/route_usage/{yyyyMMdd}` に `generateCount: 1` が作成されること
3. 10回生成後、`resource-exhausted` エラーが返ること（トースト表示）

### Firestore Rules 確認

1. Firebase Console → Firestore Rules → テストツールで:
   - `users/{uid}/entitlements/premium` への write が `false` であること
   - `users/{uid}/route_usage/{dateKey}` への write が `false` であること
   - 自分の uid での read が許可されること

---

## Phase 12.5H-7B チェックリスト（RevenueCat）

- [ ] RevenueCat SDK 導入
- [ ] RevenueCat Webhook → Cloud Functions → Firestore entitlement 書き込み
- [ ] `source: 'revenuecat'` で付与されること
- [ ] サブスクリプション終了時に `active: false` に更新されること

## Phase 12.5H-6 チェックリスト（transit）

- [ ] `computeRouteSegment` の transit 実装
- [ ] 区間別モードの公共交通チップを enabled に変更

## Phase 12.5H-8 チェックリスト（Android/EAS）

- [ ] EAS Build で Android 実機確認
- [ ] Android Maps API key 設定
