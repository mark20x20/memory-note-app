# 02 Cloud Functions API Design

## 全体フロー

```
Mobile App
  │
  │ onCall: generateNoteRoutes(noteId, travelMode)
  ▼
Cloud Functions (asia-northeast1)
  │ 1. auth 確認
  │ 2. noteId バリデーション
  │ 3. ノート取得 + owner/editor 権限確認
  │ 4. premium 判定 (仮: isPremium = false → permission-denied)
  │ 5. PlaceGroup を sortOrder 順で取得
  │ 6. 隣接 PlaceGroup ペアでセグメント一覧を作成
  │    例: [#1→#2, #2→#3, #3→#4]
  │ 7. セグメントごとに Firestore キャッシュ確認
  │    └─ キャッシュあり → スキップ（cacheHitCount++）
  │    └─ キャッシュなし → Google Routes API 呼び出し
  │ 8. Google Routes API: POST computeRoutes
  │    origin: group[i] 座標, destination: group[i+1] 座標
  │    travelMode: WALK / DRIVE / TRANSIT
  │ 9. response → encodedPolyline, distanceMeters, durationSeconds を Firestore に保存
  │ 10. 結果サマリーを return
  ▼
Firestore: memory_notes/{noteId}/route_segments/{segmentId}
  │
  ▼
Mobile App (次回アクセス時はキャッシュを読む)
```

---

## Callable 関数一覧

### 1. `generateNoteRoutes` — メイン生成関数

#### input

```ts
type GenerateNoteRoutesInput = {
  noteId: string;
  travelMode: 'walking' | 'driving' | 'transit';
  /** true にするとキャッシュを無視して再生成。Premium でも1日制限あり */
  forceRefresh?: boolean;
};
```

#### output

```ts
type GenerateNoteRoutesResult = {
  noteId: string;
  travelMode: 'walking' | 'driving' | 'transit';
  /** 処理したセグメント総数 */
  segmentCount: number;
  /** キャッシュから返したセグメント数 */
  cacheHitCount: number;
  /** 新たに Routes API で生成したセグメント数 */
  generatedCount: number;
  /** 座標不明など理由でスキップしたセグメント数 */
  skippedCount: number;
};
```

#### 処理フロー（擬似コード）

```ts
export const generateNoteRoutes = onCall(
  { region: 'asia-northeast1', secrets: [googleRoutesApiKey] },
  async (request) => {
    // 1. auth 確認
    if (!request.auth) throw new HttpsError('unauthenticated', '認証が必要です');
    const uid = request.auth.uid;

    // 2. input バリデーション
    const { noteId, travelMode, forceRefresh = false } = request.data as GenerateNoteRoutesInput;
    if (!noteId || !['walking', 'driving', 'transit'].includes(travelMode)) {
      throw new HttpsError('invalid-argument', 'noteId または travelMode が不正です');
    }

    const db = admin.firestore();

    // 3. ノート取得 + owner/editor 権限確認
    const noteSnap = await assertOwnerOrEditor(db, noteId, uid);

    // 4. premium 判定
    // TODO: Replace with real subscription check (RevenueCat custom claims, etc.)
    const isPremiumUser = await checkPremiumStatus(uid); // 将来実装
    if (!isPremiumUser) {
      throw new HttpsError('permission-denied', 'ルート生成はプレミアムプランのみご利用いただけます');
    }

    // 5. 使用量チェック（forceRefresh の場合も含め 1日N回制限）
    await assertRouteGenerationQuota(db, uid, forceRefresh);

    // 6. PlaceGroup を sortOrder 昇順で取得
    const groupsSnap = await db
      .collection(`memory_notes/${noteId}/place_groups`)
      .orderBy('sortOrder', 'asc')
      .get();
    const groups = groupsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(g => g.latitude && g.longitude && g.latitude !== 0 && g.longitude !== 0);

    if (groups.length < 2) {
      return { noteId, travelMode, segmentCount: 0, cacheHitCount: 0, generatedCount: 0, skippedCount: 0 };
    }

    // 7. セグメントペアを構築
    const segments = [];
    for (let i = 0; i < groups.length - 1; i++) {
      segments.push({ from: groups[i], to: groups[i + 1] });
    }

    // 8. セグメントごとに処理
    let cacheHitCount = 0, generatedCount = 0, skippedCount = 0;
    const apiKey = googleRoutesApiKey.value();

    for (const { from, to } of segments) {
      const segmentId = `${from.id}_${to.id}_${travelMode}`;
      const segRef = db.doc(`memory_notes/${noteId}/route_segments/${segmentId}`);

      // キャッシュ確認
      if (!forceRefresh) {
        const existing = await segRef.get();
        if (existing.exists && !isRouteSegmentStale(existing.data())) {
          cacheHitCount++;
          continue;
        }
      }

      // Google Routes API 呼び出し
      try {
        const routeResult = await callGoogleRoutesApi(
          apiKey,
          { lat: from.latitude, lng: from.longitude },
          { lat: to.latitude, lng: to.longitude },
          toRoutesApiTravelMode(travelMode)
        );

        // Firestore に保存
        await segRef.set({
          id: segmentId,
          noteId,
          fromPlaceGroupId: from.id,
          toPlaceGroupId: to.id,
          travelMode,
          provider: 'google_routes',
          fromLatitude: from.latitude,
          fromLongitude: from.longitude,
          toLatitude: to.latitude,
          toLongitude: to.longitude,
          distanceMeters: routeResult.distanceMeters,
          durationSeconds: routeResult.durationSeconds,
          encodedPolyline: routeResult.encodedPolyline,
          decodedPolyline: decodePolyline(routeResult.encodedPolyline),
          routeSummary: routeResult.summary,
          warnings: routeResult.warnings ?? [],
          status: 'generated',
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: calcExpiresAt(30), // 30日後
        });
        generatedCount++;
      } catch (e) {
        console.error(`[generateNoteRoutes] segment=${segmentId} failed`);
        await segRef.set({
          id: segmentId,
          noteId,
          fromPlaceGroupId: from.id,
          toPlaceGroupId: to.id,
          travelMode,
          status: 'failed',
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        skippedCount++;
      }
    }

    // 使用量カウンタを更新
    await incrementRouteGenerationUsage(db, uid);

    return {
      noteId,
      travelMode,
      segmentCount: segments.length,
      cacheHitCount,
      generatedCount,
      skippedCount,
    };
  }
);
```

---

### 2. `getNoteRouteSegments` — キャッシュ読み取り関数

viewer を含む全メンバーがキャッシュ済みルートを閲覧できる（生成はできない）。

#### input

```ts
type GetNoteRouteSegmentsInput = {
  noteId: string;
  travelMode: 'walking' | 'driving' | 'transit';
};
```

#### output

```ts
type GetNoteRouteSegmentsResult = {
  noteId: string;
  travelMode: 'walking' | 'driving' | 'transit';
  segments: RouteSegmentSummary[];
};

type RouteSegmentSummary = {
  id: string;
  fromPlaceGroupId: string;
  toPlaceGroupId: string;
  distanceMeters?: number;
  durationSeconds?: number;
  decodedPolyline?: Array<{ latitude: number; longitude: number }>;
  status: 'generated' | 'failed' | 'stale';
};
```

#### 処理（擬似コード）

```ts
export const getNoteRouteSegments = onCall(
  { region: 'asia-northeast1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', '認証が必要です');
    const uid = request.auth.uid;

    const { noteId, travelMode } = request.data as GetNoteRouteSegmentsInput;

    // ノートメンバー確認（viewer も閲覧可）
    await assertNoteAccess(db, noteId, uid); // owner / editor / viewer を許可

    const segsSnap = await db
      .collection(`memory_notes/${noteId}/route_segments`)
      .where('travelMode', '==', travelMode)
      .get();

    const segments = segsSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        fromPlaceGroupId: data.fromPlaceGroupId,
        toPlaceGroupId: data.toPlaceGroupId,
        distanceMeters: data.distanceMeters,
        durationSeconds: data.durationSeconds,
        decodedPolyline: data.decodedPolyline,
        status: data.status,
      };
    });

    return { noteId, travelMode, segments };
  }
);
```

---

### 3. `deleteNoteRouteCache` — キャッシュ削除関数

owner/editor のみ削除可能。travelMode を指定してそのモードのキャッシュを削除する。
または `travelMode: 'all'` で全モードを削除する。

#### input

```ts
type DeleteNoteRouteCacheInput = {
  noteId: string;
  travelMode: 'walking' | 'driving' | 'transit' | 'all';
};
```

#### output

```ts
type DeleteNoteRouteCacheResult = {
  deletedCount: number;
};
```

---

## Google Routes API 呼び出し設計

### エンドポイント

```
POST https://routes.googleapis.com/directions/v2:computeRoutes
```

### request body 例（walking）

```json
{
  "origin": {
    "location": {
      "latLng": { "latitude": 35.7101, "longitude": 139.8107 }
    }
  },
  "destination": {
    "location": {
      "latLng": { "latitude": 35.7148, "longitude": 139.7967 }
    }
  },
  "travelMode": "WALK",
  "computeAlternativeRoutes": false,
  "routeModifiers": {},
  "polylineQuality": "HIGH_QUALITY"
}
```

### travelMode マッピング

| アプリ側 | Routes API |
|---------|------------|
| walking | WALK |
| driving | DRIVE |
| transit | TRANSIT |

### 必要な response field

```
routes[0].polyline.encodedPolyline
routes[0].distanceMeters
routes[0].duration
routes[0].description (routeSummary)
routes[0].warnings
```

### Secret Manager キー名

```
GOOGLE_ROUTES_API_KEY
```

既存の `GOOGLE_PLACES_API_KEY` とは別のキーとして管理する。
（同一プロジェクトの同一 API キーでも使えるが、権限を分けるため別キーを推奨）

---

## 権限設計まとめ

| 操作 | owner | editor | viewer |
|------|-------|--------|--------|
| generateNoteRoutes | ✅ | ✅ | ❌ |
| getNoteRouteSegments（キャッシュ閲覧） | ✅ | ✅ | ✅ |
| deleteNoteRouteCache | ✅ | ✅ | ❌ |

viewer は既存のキャッシュ済みルートを閲覧するだけ。
ルートの生成（API 呼び出し）は owner/editor に限定する。

---

## 共有ノートにおける Premium 権限の扱い

- **初期方針**: generateNoteRoutes を呼んだユーザー本人の Premium 状態を確認する。
  - Premium の owner が生成 → キャッシュが Firestore に残る → 無料 viewer も閲覧できる
  - 無料 editor が generateNoteRoutes を呼ぼうとする → permission-denied
- **将来検討**: ノート owner が Premium なら全 editor もルート生成を許可する（ノートレベル権限付与）

---

## Cloud Functions ファイル構成（将来）

```
firebase/functions/src/
├── index.ts                  ← export 追加
├── place/
│   ├── placeFunctions.ts     ← 既存
│   └── ...
└── route/                    ← 新規（Phase 12.5H-3+）
    ├── routeFunctions.ts     ← generateNoteRoutes, getNoteRouteSegments, deleteNoteRouteCache
    ├── routesClient.ts       ← Google Routes API HTTP クライアント
    ├── polylineUtils.ts      ← encodedPolyline decode
    ├── routeCache.ts         ← isRouteSegmentStale, calcExpiresAt など
    └── types.ts              ← RouteSegmentDoc, GenerateNoteRoutesInput など
```
