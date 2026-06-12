# Phase 12.5: Cloud Functions API 設計

## 概要

Phase 12.5 で追加する Cloud Functions callable API の設計を定義する。すべての API は Firebase Auth 認証必須であり、外部 Places API キーは Secret Manager で管理する。

---

## API 一覧

| 関数名 | 目的 | 外部 API |
|---|---|---|
| `enrichNotePlaces` | ノート全体の場所推定をトリガー | Google Places |
| `getPlaceCandidatesForGroup` | PlaceGroup 単位の候補取得 | Google Places |
| `selectPlaceCandidate` | 候補を選択して PlaceGroup を確定 | なし |
| `updatePlaceGroupManually` | 手動で場所名・カテゴリを設定 | なし |
| `refreshPlaceCandidates` | 候補を再取得（強制更新） | Google Places |

---

## 1. `enrichNotePlaces`

### 目的
ノート全体に対して場所推定を実行する。写真の GPS 座標をグループ化し、グループごとに候補を取得してスコアリングを行い、PlaceGroup ドキュメントを作成する。

### Input
```typescript
{
  noteId: string;
  forceRefresh?: boolean;  // true: キャッシュ無視して再取得
}
```

### Output
```typescript
{
  success: boolean;
  placeGroupsCreated: number;
  status: 'completed' | 'partial' | 'no_gps_data';
  message?: string;
}
```

### 処理フロー
1. Auth チェック（owner または editor のみ）
2. `placeEnrichmentStatus` が `'fetching'` なら 409 Conflict（二重実行防止）
3. `noteId` の photos サブコレクションを取得
4. GPS ありの写真を抽出・グループ化（既存 `groupNearbyLocations` ロジック流用）
5. グループごとに `getPlaceCandidatesForGroup` を内部呼び出し（バッチ）
6. スコアリング・AI ランキングを実行
7. PlaceGroup ドキュメントを Firestore に保存
8. NoteDoc の `placeEnrichmentStatus` / `visitedPlacesSummary` を更新

### 権限
- owner: ○
- editor: ○
- viewer: ✗ → PERMISSION_DENIED

### Firestore 読み書き
- 読み取り: `memory_notes/{noteId}`, `photos` サブコレクション全件
- 書き込み: `memory_notes/{noteId}` (status更新), `place_groups` サブコレクション (create)

### コスト制御
- 1ノートあたり Places API 呼び出し上限: 5回（グループが5件を超える場合は代表グループのみ）
- `forceRefresh: false` のデフォルト: 24時間以内のキャッシュがあればスキップ
- 写真に GPS がない場合は Places API を呼ばない

### エラー設計
| エラーコード | 状況 |
|---|---|
| `NOT_FOUND` | noteId が存在しない |
| `PERMISSION_DENIED` | viewer またはメンバー外 |
| `ALREADY_EXISTS` | 既に fetching 中（409 相当） |
| `RESOURCE_EXHAUSTED` | 1日の API 呼び出し上限超過 |
| `INTERNAL` | Places API エラー |

### 冪等性
`forceRefresh: false` の場合は同一グループへの再呼び出しをスキップ。冪等。

### ログ方針
```
[enrichNotePlaces] noteId=${noteId.slice(0,8)}... uid=${uid.slice(-4)} groups=${n} status=completed
```
精密座標・場所名はログに出力しない。

---

## 2. `getPlaceCandidatesForGroup`

### 目的
PlaceGroup の代表座標から周辺施設候補を取得し、candidates サブコレクションに保存する。

### Input
```typescript
{
  noteId: string;
  placeGroupId: string;
  forceRefresh?: boolean;
}
```

### Output
```typescript
{
  candidates: Array<{
    id: string;
    name: string;
    category: string;
    distanceMeters: number;
    confidence: number;
  }>;
  cacheHit: boolean;
}
```

### 処理フロー
1. Auth チェック（owner または editor）
2. PlaceGroup ドキュメントを取得（代表 lat/lng を使用）
3. `fetchedAt` が 24時間以内なら candidates をキャッシュから返す
4. Google Places Nearby Search API を呼び出し
5. レスポンスをフィールドマスクで必要最小限に絞る
6. スコアリングを実行（`05_candidate_scoring_and_ai_ranking.md` 参照）
7. candidates サブコレクションに保存（最大 5件）

### 権限
- owner: ○
- editor: ○
- viewer: ✗

### 外部 API 呼び出し
```
POST https://places.googleapis.com/v1/places:searchNearby
Authorization: X-Goog-Api-Key: ${PLACES_API_KEY}
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.types,places.location,places.rating

Body:
{
  "locationRestriction": {
    "circle": {
      "center": { "latitude": lat, "longitude": lng },
      "radius": 200.0
    }
  },
  "maxResultCount": 10,
  "languageCode": "ja"
}
```

### コスト制御
- `maxResultCount: 10`（最大10件取得 → スコアリング後5件保存）
- キャッシュ期間: 24時間（Google ToS 上限）
- フィールドマスクで課金対象フィールドを最小化

### エラー設計
| エラーコード | 状況 |
|---|---|
| `NOT_FOUND` | noteId / placeGroupId が存在しない |
| `PERMISSION_DENIED` | viewer またはメンバー外 |
| `UNAVAILABLE` | Places API が一時的に利用不可 |
| `RESOURCE_EXHAUSTED` | 1日の上限超過 |

### 冪等性
`forceRefresh: false` かつ 24時間以内のキャッシュがある場合は再取得しない。冪等。

---

## 3. `selectPlaceCandidate`

### 目的
ユーザーが候補の中から1件を選択し、PlaceGroup を確定状態（userConfirmed=true）にする。

### Input
```typescript
{
  noteId: string;
  placeGroupId: string;
  candidateId: string;
}
```

### Output
```typescript
{
  success: boolean;
  updatedLabel: string;
  updatedCategory: string;
}
```

### 処理フロー
1. Auth チェック（owner または editor）
2. PlaceGroup / candidate の存在確認
3. PlaceGroup を更新:
   - `selectedCandidateId = candidateId`
   - `label = candidate.name`
   - `category = 推定カテゴリ`
   - `confidence = candidate.confidence`
   - `userConfirmed = true`
   - `source = 'places_api'`
4. NoteDoc の `visitedPlacesSummary` を更新（topPlaceLabels の再計算）

### 権限
- owner: ○
- editor: ○
- viewer: ✗

### Firestore 読み書き
- 読み取り: `place_groups/{placeGroupId}`, `candidates/{candidateId}`
- 書き込み: `place_groups/{placeGroupId}`, `memory_notes/{noteId}` (summary更新)

### 冪等性
同一 candidateId を2回選択しても結果は同一。冪等。

---

## 4. `updatePlaceGroupManually`

### 目的
ユーザーが場所名・カテゴリを手動入力で設定する（候補外の場所への対応）。

### Input
```typescript
{
  noteId: string;
  placeGroupId: string;
  label: string;           // 手動入力の場所名
  category?: PlaceCategory; // 省略可（unknown デフォルト）
}
```

### Output
```typescript
{
  success: boolean;
}
```

### 処理フロー
1. Auth チェック（owner または editor）
2. `label` のバリデーション（1〜50文字）
3. PlaceGroup を更新:
   - `userEditedLabel = label`
   - `selectedCandidateId = undefined`
   - `category = category ?? 'unknown'`
   - `userConfirmed = true`
   - `source = 'manual'`
4. NoteDoc の `visitedPlacesSummary` を更新

### 権限
- owner: ○
- editor: ○
- viewer: ✗

---

## 5. `refreshPlaceCandidates`

### 目的
候補が古い・不満な場合に強制再取得する。内部で `getPlaceCandidatesForGroup` を `forceRefresh: true` で呼び出す。

### Input
```typescript
{
  noteId: string;
  placeGroupId: string;
}
```

### Output
```typescript
{
  candidatesCount: number;
  refreshedAt: string; // ISO8601
}
```

### 権限
- owner: ○
- editor: ○
- viewer: ✗

### コスト制御
1 PlaceGroup あたり 1日 3回までを上限とする（Firestore の `refreshCount` / `refreshResetAt` フィールドで管理）。

---

## 共通設計

### APIキー管理
```typescript
// Cloud Functions v2 (Node.js 20)
import { defineSecret } from 'firebase-functions/params';

const GOOGLE_PLACES_API_KEY = defineSecret('GOOGLE_PLACES_API_KEY');

export const enrichNotePlaces = onCall(
  { secrets: [GOOGLE_PLACES_API_KEY, OPENAI_API_KEY] },
  async (request) => { ... }
);
```

- `GOOGLE_PLACES_API_KEY` は Firebase Secret Manager に保存
- モバイルアプリには一切露出しない
- OpenAI キーは既存の `OPENAI_API_KEY` を流用

### 共通 Auth チェック
```typescript
function assertAuth(request: CallableRequest): string {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  return request.auth.uid;
}

async function assertOwnerOrEditor(noteId: string, uid: string): Promise<void> {
  const note = await db.collection('memory_notes').doc(noteId).get();
  if (!note.exists) throw new HttpsError('not-found', 'Note not found');
  const role = note.data()?.members?.[uid];
  if (role !== 'owner' && role !== 'editor')
    throw new HttpsError('permission-denied', 'Owner or Editor only');
}
```

### API 呼び出し回数制限（Firestore カウンター方式）

```
/usage_counters/{uid}/places_api_calls/{YYYYMMDD}: count
```

- 1日 20回/ユーザーを上限（調整可能）
- 上限超過時は `RESOURCE_EXHAUSTED` エラー

### ログ方針
- noteId は先頭8文字のみ
- uid は末尾4文字のみ
- 座標・場所名・住所はログに出力しない
- エラーは `console.error` + Firebase Crashlytics（将来）
