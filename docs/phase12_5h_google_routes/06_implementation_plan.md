# 06 Implementation Plan

## フェーズ分割方針

Google Routes API の本格実装は段階的に行う。
各フェーズは独立してリリース可能な単位にする。

---

## Phase 12.5H-3: Google Routes Secret / Client / Functions Skeleton

**目的**: Routes API を呼び出す最低限のスケルトンを作る

**変更ファイル**:
```
firebase/functions/src/route/           ← 新規ディレクトリ
  routeFunctions.ts                     ← generateNoteRoutes / getNoteRouteSegments の skeleton
  routesClient.ts                       ← Google Routes API HTTP クライアント
  polylineUtils.ts                      ← encodedPolyline decode 関数
  routeCache.ts                         ← isRouteSegmentStale / calcExpiresAt
  types.ts                              ← RouteSegmentDoc / GenerateNoteRoutesInput など
firebase/functions/src/index.ts         ← routeFunctions を export 追加
```

**Secret Manager**:
```
gcloud secrets create GOOGLE_ROUTES_API_KEY --data-file=- <<< "YOUR_KEY"
# または Secret Manager Console から追加
```

**注意**:
- Routes API は Places API と異なる API。同じプロジェクトで有効化が必要。
- `GOOGLE_ROUTES_API_KEY` は `GOOGLE_PLACES_API_KEY` と別のシークレットとして管理。
- Functions skeleton: auth チェック → permission-denied を返すだけでよい（実装は次フェーズ）

**deploy**: `--only functions`

**TypeScript / lint**: 必須（Exit 0 確認）

---

## Phase 12.5H-4: Route Segment Cache / Firestore Rules

**目的**: Firestore の `route_segments` サブコレクションを使えるようにする

**変更ファイル**:
```
firebase/firestore.rules                ← route_segments の read/write ルール追加
firebase/firestore.indexes.json         ← travelMode + generatedAt の複合インデックス
firebase/functions/src/route/routeFunctions.ts  ← getNoteRouteSegments 実装
```

**Firestore Rules 追加内容**:
```
match /memory_notes/{noteId}/route_segments/{segmentId} {
  allow read: if request.auth != null && isNoteMember(noteId, request.auth.uid);
  allow write: if false;  // Cloud Functions Admin SDK のみ
}
```

**deploy**: `--only firestore:rules,firestore:indexes,functions`

---

## Phase 12.5H-5: Walking / Driving Route Generation

**目的**: walking と driving の実ルートを生成できるようにする

**変更ファイル**:
```
firebase/functions/src/route/routeFunctions.ts  ← generateNoteRoutes 本実装
firebase/functions/src/route/routesClient.ts    ← Routes API HTTP 呼び出し実装
firebase/functions/src/route/polylineUtils.ts   ← decode 実装
firebase/functions/src/route/routeCache.ts      ← stale 判定 + usage カウンタ実装
app/(app)/notes/[noteId]/map.tsx               ← 「ルートを生成」ボタン + 区間情報 UI
src/features/map/components/RouteSegmentCard.tsx ← 区間カードコンポーネント新規
src/core/repositories/routeSegmentRepository.ts  ← getNoteRouteSegments 呼び出し
```

**premium チェック**: この時点では仮実装（isPremiumUser = false を固定で Premium に変更してテスト）
**transit**: このフェーズではスキップ（TRANSIT モードは Phase 12.5H-6）

**deploy**: `--only functions`

**UI 変更**:
- Map 画面: 「ルートを生成」ボタン、生成中ローディング、区間情報リスト
- 失敗時のエラー表示と「直線ルートで表示」フォールバック

---

## Phase 12.5H-6: Transit Route Support

**目的**: 公共交通（電車・バス）ルートの基本表示を実装する

**変更ファイル**:
```
firebase/functions/src/route/routesClient.ts    ← TRANSIT モード追加
firebase/functions/src/route/types.ts           ← Transit ステップ型追加
app/(app)/notes/[noteId]/map.tsx               ← Transit 区間表示
```

**Transit 表示（初期）**: 移動時間・区間数のみ（乗換詳細なし）

**Transit 表示（将来）**: 乗換ステップ詳細、路線名、徒歩+電車+徒歩の内訳

**注意**: 地域によってカバレッジが異なる。日本国内は比較的充実しているが、
海外ノートではエラー or 空返却になる可能性がある。

---

## Phase 12.5H-7: Premium Entitlement Integration

**目的**: 実際のサブスク判定を組み込む

**変更ファイル**:
```
firebase/functions/src/route/routeFunctions.ts   ← isPremiumUser を仮実装から本実装に
firebase/functions/src/entitlement/               ← 新規（RevenueCat Webhook ハンドラ）
  webhookHandler.ts
  entitlementUtils.ts
app/(app)/notes/[noteId]/map.tsx                 ← Premium 状態をアプリ側でも取得
src/core/hooks/usePremiumStatus.ts               ← Premium フック新規
```

**RevenueCat Webhook 設計**:
```
RevenueCat Event → Firebase HTTP Function (onRequest) → Firestore update
users/{uid}/entitlements/premium: { active: true, expiresAt: Timestamp }
```

**Cloud Functions 内 premium チェック**:
```ts
const entitlementSnap = await db.doc(`users/${uid}/entitlements/premium`).get();
const isPremiumUser = entitlementSnap.exists && entitlementSnap.data()?.active === true;
```

---

## Phase 12.5H-8: Route UI Polish / Error Handling

**目的**: UI・エラーハンドリングを磨く

**変更内容**:
```
- ルートPolylineのアニメーション（フェードイン）
- 失敗区間のグレー破線フォールバック
- forceRefresh ボタン（「ルートを更新」）
- 区間カードのタップで地図のその区間にフォーカス
- EventMapPreview: Premium 生成済みの場合は実ルートPolyline 表示
- EAS Build + Android 実機確認
- パフォーマンス最適化（大量区間時の FlatList/ScrollView 対応）
```

---

## 各フェーズ一覧

| フェーズ | 内容 | deploy 要否 | 推定規模 |
|---------|------|------------|---------|
| 12.5H-1 | UI 土台・型定義（完了） | なし | S |
| 12.5H-2 | 設計ドキュメント（本フェーズ） | なし | S |
| 12.5H-3 | Routes Client / Functions Skeleton | functions | M |
| 12.5H-4 | Firestore Rules / Cache 読み取り | rules + indexes + functions | M |
| 12.5H-5 | walking / driving 生成 + UI | functions + rules | L |
| 12.5H-6 | transit 対応 | functions | M |
| 12.5H-7 | RevenueCat / Premium 判定 | functions | M |
| 12.5H-8 | UI 磨き / エラーハンドリング | なし | M |

---

## 実装上の注意点

### encodedPolyline の decode

Google Routes API が返す `encodedPolyline` は Google Encoded Polyline Algorithm で符号化されている。
decode には以下を検討:

```bash
# オプション1: npm パッケージ（Functions 側のみ）
npm install @googlemaps/polyline-codec

# オプション2: 軽量な自前実装（外部依存なし）
# Encoded Polyline Algorithm は仕様が公開されており 30行程度で実装可能
```

decode した座標配列を Firestore に保存することで、
モバイルアプリ側では decode 不要になる（読んでそのまま Polyline に渡せる）。

### API キーのスコープ

Routes API を有効化するには:
1. Google Cloud Console → API & Services → ライブラリ で "Routes API" を有効化
2. 既存の API キー（`GOOGLE_PLACES_API_KEY` と同一キーでも可）に Routes API を許可
3. または別キー `GOOGLE_ROUTES_API_KEY` を作成して制限を設定

Secret Manager に登録するキー名: `GOOGLE_ROUTES_API_KEY`

### Functions の region

既存の place Functions と同じ `asia-northeast1` を使う。

### Firestore インデックス

`route_segments` で `travelMode` でフィルタするには複合インデックスが必要:
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
