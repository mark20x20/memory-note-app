# 03 Firestore Route Cache Model

## コレクションパス

```
memory_notes/{noteId}/route_segments/{segmentId}
```

サブコレクションとして `memory_notes/{noteId}` の直下に置く。
理由: ノート削除時に一緒に削除できる（Firestore の階層構造を活かす）。

---

## segmentId の命名規則

```
{fromPlaceGroupId}_{toPlaceGroupId}_{travelMode}
```

例:
```
abc123_def456_walking
abc123_def456_driving
abc123_def456_transit
```

- 同一区間でも travelMode が異なれば別ドキュメント
- fromPlaceGroupId / toPlaceGroupId は Firestore の PlaceGroup ドキュメント ID をそのまま使う
- 衝突しないよう underscore で連結（PlaceGroup ID に underscore が含まれないことを前提）

---

## RouteSegmentDoc スキーマ

```ts
import type { Timestamp } from 'firebase/firestore';

type RouteSegmentDoc = {
  // ── ドキュメント識別 ───────────────────────────────
  id: string;                        // = segmentId（{from}_{to}_{travelMode}）
  noteId: string;

  // ── 区間の端点 ───────────────────────────────────
  fromPlaceGroupId: string;
  toPlaceGroupId: string;

  // ── 移動手段 ─────────────────────────────────────
  travelMode: 'walking' | 'driving' | 'transit';
  provider: 'google_routes';

  // ── 端点座標（キャッシュ無効化の検出に使う） ──────
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;

  // ── ルート情報 ───────────────────────────────────
  distanceMeters?: number;           // 区間距離（例: 850）
  durationSeconds?: number;          // 所要時間（例: 720 = 12分）

  // ── Polyline ─────────────────────────────────────
  /**
   * Google Routes API が返す encoded polyline 文字列。
   * decode して decodedPolyline を作成するが、元データも保存しておく。
   */
  encodedPolyline?: string;
  /**
   * encodedPolyline を decode した座標配列。
   * Firestore からそのまま読んで MapView の Polyline に渡せる。
   * decode は Cloud Functions 側で行う（モバイルでの計算を省略）。
   */
  decodedPolyline?: Array<{
    latitude: number;
    longitude: number;
  }>;

  // ── 補足情報 ─────────────────────────────────────
  routeSummary?: string;             // 例: "国道14号" （driving の場合）
  warnings?: string[];               // Routes API からの警告

  // ── ステータス ───────────────────────────────────
  /**
   * - 'generated': 正常に生成済み
   * - 'failed': API 呼び出し失敗（fallback: 直線ルートを使う）
   * - 'stale': 座標変更などにより無効化された（再生成が必要）
   */
  status: 'generated' | 'failed' | 'stale';

  // ── タイムスタンプ ───────────────────────────────
  generatedAt: Timestamp;
  updatedAt: Timestamp;
  /**
   * この日時を過ぎたらキャッシュを無効とみなす。
   * 初期 TTL: 30日
   */
  expiresAt?: Timestamp;

  // ── バージョン管理（将来用） ──────────────────────
  /**
   * PlaceGroup の座標ハッシュ。
   * 座標が変わっていないか検出するために使う（将来実装）。
   */
  placeGroupVersionHash?: string;
};
```

---

## キャッシュ有効性の判定ロジック

```ts
function isRouteSegmentStale(doc: RouteSegmentDoc): boolean {
  // 失敗したセグメントは stale 扱い
  if (doc.status === 'failed' || doc.status === 'stale') return true;

  // expiresAt を過ぎていれば stale
  if (doc.expiresAt) {
    const now = new Date();
    const expires = doc.expiresAt.toDate();
    if (now > expires) return true;
  }

  return false;
}
```

---

## キャッシュ無効化条件

以下のいずれかが発生した場合、対応するセグメントを `status: 'stale'` に更新するか、削除する。

| 条件 | 対応 |
|------|------|
| PlaceGroup の座標が変わった | 関連セグメントを stale に更新 |
| 場所候補を選び直した（座標が変わる場合） | 関連セグメントを stale に更新 |
| フロー分割を再実行した（sortOrder が変わる） | 全セグメントを削除して再生成 |
| travelMode が変わった | 別 segmentId なので影響なし |
| forceRefresh: true で再生成を明示指定 | 既存を上書き |
| expiresAt を過ぎた | stale 扱い（次回 generateNoteRoutes 実行時に再生成） |

---

## TTL 設計

```
初期 TTL: 30日
```

理由:
- 観光旅行のノートは基本的に内容が変わらない（場所が変わることは少ない）
- TTL を短くすると API コストが上がる
- 30日後に再度地図を開いてルートを見る場合は再生成リクエストを送る

```ts
function calcExpiresAt(days: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return admin.firestore.Timestamp.fromDate(date);
}
```

---

## Firestore Security Rules（将来）

```
match /memory_notes/{noteId}/route_segments/{segmentId} {
  // 読み取り: ノートメンバー全員（owner / editor / viewer）
  allow read: if request.auth != null
    && isNoteMember(noteId, request.auth.uid);

  // 書き込み: Cloud Functions の Admin SDK 経由のみ（クライアントからは不可）
  allow write: if false;
}
```

`isNoteMember()` は `/memory_notes/{noteId}` ドキュメントの `members` フィールドを確認する関数。
クライアントからの直接書き込みは禁止し、Cloud Functions の Admin SDK のみが書き込める。

---

## インデックス

Firestore に作成が必要なインデックス（将来）:

```
コレクション: memory_notes/{noteId}/route_segments
フィールド: travelMode ASC, generatedAt DESC
```

`getNoteRouteSegments` で `travelMode` でフィルタして `generatedAt` でソートする場合に必要。

---

## 容量見積もり

1ドキュメントの推定サイズ:
- encodedPolyline（〜200バイト / 1km 相当）: 最大 2KB
- decodedPolyline（10点 × 20バイト）: 最大 200バイト
- その他フィールド: 〜300バイト

合計: 1セグメント ≈ 2-3KB

10区間・3モード = 30ドキュメント × 3KB = 90KB / ノート
→ Firestore 無料枠（1GB）でも数千ノート分まで保存可能。
