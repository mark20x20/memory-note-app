# Phase 12.5: Data Model — Firestore スキーマ設計

## 概要

Phase 12.5 では以下の Firestore コレクションを追加・拡張する。

```
memory_notes/{noteId}                   — 既存（visitedPlacesSummary フィールド追加）
memory_notes/{noteId}/photos/{photoId}  — 既存（変更なし）
memory_notes/{noteId}/place_groups/{placeGroupId}  — NEW
memory_notes/{noteId}/place_groups/{placeGroupId}/candidates/{candidateId}  — NEW
```

---

## 1. NoteDoc 拡張（memory_notes/{noteId}）

既存の `NoteDoc` に以下のフィールドを追加する。

```typescript
type NoteDoc = {
  // 既存フィールド（変更なし）
  ownerId: string;
  title: string;
  memo?: string;
  noteType: 'personal' | 'shared';
  members: Record<string, 'owner' | 'editor' | 'viewer'>;
  coverPhotoURL?: string;
  photoCount?: number;
  aiDiary?: string;
  aiDiaryStatus?: 'idle' | 'generating' | 'completed' | 'failed' | 'edited';
  aiDiaryGeneratedAt?: Timestamp;
  aiDiaryError?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Phase 12.5 追加フィールド（optional — 後方互換性を維持）
  placeEnrichmentStatus?: 'idle' | 'fetching' | 'completed' | 'failed';
  placeEnrichmentError?: string;
  placeEnrichmentUpdatedAt?: Timestamp;
  visitedPlacesSummary?: VisitedPlacesSummary;
};

type VisitedPlacesSummary = {
  confirmedCount: number;        // userConfirmed=true の場所数
  totalGroupCount: number;       // PlaceGroup 総数
  topPlaceLabels: string[];      // 確定場所名の先頭 3件（AI日記・共有カード表示用）
  areaLabel?: string;            // エリアレベルのラベル（例: 東京 浅草）
  generatedAt: Timestamp;
};
```

**設計上の理由:**
- `placeEnrichmentStatus` により UI が取得中・完了・失敗を表示できる
- `visitedPlacesSummary` は AI 日記生成と共有カードが Firestore を 1回読むだけで場所情報を参照できるようにするための非正規化
- 後方互換性: 全フィールドが optional なので既存ノートは壊れない

---

## 2. PhotoDoc 拡張（変更なし）

`PhotoDoc` は変更しない。GPS 座標（latitude/longitude）は既に保存済み。

```typescript
// Phase 12.5 での参照のみ（書き込み不要）
type PhotoDoc = {
  id: string;
  noteId: string;
  ownerId: string;
  storagePath: string;
  downloadURL: string;
  metadata: { width?: number; height?: number; mimeType?: string; fileSize?: number; };
  latitude?: number;   // GPS
  longitude?: number;  // GPS
  takenAt?: string;    // ISO8601
  sortOrder: number;
  createdAt: Timestamp;
};
```

---

## 3. PlaceGroup（memory_notes/{noteId}/place_groups/{placeGroupId}）

```typescript
type PlaceGroupDoc = {
  id: string;
  noteId: string;

  // 場所の位置（代表点）
  latitude: number;
  longitude: number;

  // ラベルとカテゴリ
  label: string;  // 例: "浅草寺"、"代官山 蔦屋書店"
  category: PlaceCategory;

  // この場所グループに属する写真
  photoIds: string[];
  photoCount: number;
  coverPhotoURL?: string;

  // 選択された候補
  selectedCandidateId?: string;         // candidates サブコレクションの ID
  selectedProviderPlaceId?: string;     // 外部 API の placeId（重複確認用）

  // スコア・信頼度
  confidence: number;  // 0.0 〜 1.0

  // ユーザー確認状態
  userConfirmed: boolean;     // true: ユーザーが確認・選択した
  userEditedLabel?: string;   // 手動入力ラベル（selectedCandidateId がない場合）

  // データソース
  source: PlaceGroupSource;

  // タイムスタンプ
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'tourist_attraction'
  | 'station'
  | 'hotel'
  | 'shopping'
  | 'park'
  | 'museum'
  | 'area'
  | 'unknown';

type PlaceGroupSource =
  | 'gps'           // GPS のみ（候補取得前）
  | 'places_api'    // Places API 候補から自動選択
  | 'ai_assisted'   // AI 補助によるスコアリング
  | 'manual';       // ユーザー手動入力
```

**設計上の理由:**
- `userConfirmed` が false のうちは「推定中」として表示し、ユーザーに確認を促す
- `userEditedLabel` は `selectedCandidateId` と排他（manual override 時に使用）
- `confidence` は 0.0〜1.0 のスコアで UI 表示に使用（低い場合は「要確認」マーク）
- `category` は AI 日記プロンプトの補助情報として使用

---

## 4. PlaceCandidate（place_groups/{placeGroupId}/candidates/{candidateId}）

```typescript
type PlaceCandidateDoc = {
  id: string;

  // 外部プロバイダ情報
  provider: 'google' | 'foursquare' | 'osm' | 'geocoding' | 'manual';
  providerPlaceId?: string;   // 外部 API の place_id（再取得・重複確認用）

  // 場所情報
  name: string;
  address?: string;            // 住所（表示用）
  types: string[];             // 外部 API のカテゴリ（例: ["tourist_attraction", "point_of_interest"]）
  latitude: number;
  longitude: number;

  // スコア
  distanceMeters?: number;     // PlaceGroup 代表点からの距離
  rating?: number;             // 外部 API の評価（0.0〜5.0）
  confidence?: number;         // このアプリでのスコアリング結果

  // 取得方法
  source: 'places_api' | 'geocoding' | 'ai_ranked' | 'manual';

  // タイムスタンプ
  fetchedAt: Timestamp;
};
```

**設計上の理由:**
- API レスポンス全文は保存しない（必要最小限フィールドのみ）
- `providerPlaceId` は重複排除と24時間キャッシュ確認に使用
- `fetchedAt` により 24時間経過後の再取得判断が可能（Google ToS 準拠）
- 候補数は 1 グループあたり最大 5件を推奨（Firestore コスト・読み取り数の観点）

---

## 5. インデックス・クエリ方針

```
候補取得:
  collection: memory_notes/{noteId}/place_groups
  → orderBy('createdAt', 'asc')
  インデックス不要（サブコレクション単体クエリ）

候補一覧:
  collection: place_groups/{placeGroupId}/candidates
  → orderBy('confidence', 'desc')
  インデックス: confidence + fetchedAt 複合インデックス（必要なら）
```

---

## 6. Firestore Security Rules（追加予定）

```
// Phase 12.5 で追加予定のルール骨格（実装は Phase 12.5B にて確定）

match /memory_notes/{noteId}/place_groups/{placeGroupId} {
  allow read: if isNoteOwnerOrMember(noteId);
  allow create, update: if isNoteOwnerOrEditor(noteId);
  allow delete: if isNoteOwner(noteId);

  match /candidates/{candidateId} {
    allow read: if isNoteOwnerOrMember(noteId);
    allow create, update: if isNoteOwnerOrEditor(noteId);
    allow delete: if isNoteOwner(noteId);
  }
}
```

---

## 7. データ量の見積もり

| コレクション | 1ノートあたり | 想定サイズ |
|---|---|---|
| place_groups | 1〜5件 | 約 500 bytes / doc |
| candidates | 1グループあたり最大 5件 | 約 300 bytes / doc |
| NoteDoc 追加フィールド | 固定 | 約 200 bytes |

1ノートあたり追加データ: 約 5KB 以内（許容範囲）

---

## 8. 既存 PlaceGroup 型との関係

`src/features/map/types/index.ts` に定義されている既存の `PlaceGroup` 型は、Phase 8 の簡易グループ化ロジック専用の型であり、Firestore への保存を想定していない。

Phase 12.5B では以下の対応を取る:
- 既存 `PlaceGroup` 型は `LocalPlaceGroup` にリネームして Phase 8 内部ロジック専用とする
- Firestore 保存用の `PlaceGroupDoc` 型は `src/core/repositories/` に新設する
- `src/features/map/` の既存コードへの影響を最小化する

（リネーム・移行は Phase 12.5B の実装時に判断する）
