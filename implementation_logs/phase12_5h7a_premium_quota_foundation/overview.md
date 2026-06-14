# Phase 12.5H-7A: Premium / Quota Control Foundation — 実装概要

## 目的

`isPremiumUser = true` のハードコードを削除し、Firestore の entitlement ドキュメントによる
本実装の Premium チェックを導入する。
また、1日あたりのルート生成回数クォータを Cloud Functions 内で強制する。

## 実装方針

- RevenueCat 連携は Phase 12.5H-7B 以降。本フェーズはあくまで Firestore entitlement の基盤構築。
- Transit モード、Android/EAS 対応は本フェーズ対象外。
- `manual_dev` ソースで手動付与することで開発中の動作確認を可能にする。

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `firebase/functions/src/route/types.ts` | 追記 | `PremiumEntitlementDoc`, `RouteUsageDoc` 型追加 |
| `firebase/functions/src/route/routeFunctions.ts` | 変更 | `assertPremiumUser()`, `assertRouteGenerationQuota()` 追加、isPremiumUser スタブ削除 |
| `firebase/firestore.rules` | 変更 | `entitlements`, `route_usage` サブコレクションルール追加 |
| `src/features/map/hooks/usePremiumStatus.ts` | 新規作成 | Firestore entitlement onSnapshot フック |
| `app/(app)/notes/[noteId]/map.tsx` | 変更 | `usePremiumStatus` 導入、isPremiumUser スタブ削除、premiumLoading 追加、DEV ガイド追加 |

## Firestore データモデル

```
users/{uid}/
  entitlements/
    premium:
      active: boolean
      source: 'manual_dev' | 'revenuecat' | 'admin'
      plan?: 'premium_monthly' | 'premium_yearly' | 'trial'
      updatedAt: Timestamp
      expiresAt?: Timestamp | null

  route_usage/
    {yyyyMMdd}:
      dateKey: string
      generateCount: number
      forceRefreshCount: number
      createdAt: Timestamp
      updatedAt: Timestamp
```

## クォータ仕様

| 種別 | 上限 |
|---|---|
| ルート生成（`generateNoteRoutes` 呼び出し） | 1日 10回 |
| forceRefresh | 1日 3回 |

日付キーは UTC yyyyMMdd 形式。
