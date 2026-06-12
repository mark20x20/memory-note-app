# Phase 12.5B Place Data Model — Decisions

## D1: Firestore 用型は PlaceGroupDoc / PlaceCandidateDoc と命名する

**決定:** Firestore 保存用の型名を `PlaceGroupDoc` / `PlaceCandidateDoc` とし、既存の Phase 8 型 `PlaceGroup`（`src/features/map/types/index.ts`）とは明確に分離する。

**理由:** 既存の `PlaceGroup` 型は Phase 8 の簡易グルーピング専用であり、ローカル UI 計算にのみ使用している（MapPreview / locationUtils）。リネームすると既存の import が多数壊れる一方、Firestore 用は `PlaceGroupDoc` という命名で新規追加することで影響範囲を最小化できる。

---

## D2: 既存 PlaceGroup 型はそのまま残す（リネームしない）

**決定:** `src/features/map/types/index.ts` の既存 `PlaceGroup` 型を `LocalPlaceGroup` にリネームしない。`PlaceGroupDoc` を追加するだけとする。

**理由:** `PlaceGroup` は `MapPreview.tsx` / `locationUtils.ts` で使用されており、リネームすると import の修正が必要になる。Phase 12.5B の目的はデータモデル準備であり、Phase 8 のリファクタリングは対象外。名前衝突も発生しないため、そのまま残す判断をした。

---

## D3: viewer は candidates を read できない

**決定:** `firebase/firestore.rules` において、`candidates` サブコレクションの read を `owner` / `editor` のみに制限し、`viewer` には許可しない。

**理由:** `07_privacy_security_cost_policy.md` の方針に従い、viewer は確定場所名（`PlaceGroupDoc.label`）のみ参照できれば十分。候補リストには座標・住所・外部 API rating が含まれており、プライバシーリスクがある。UI 上でも viewer に候補リストを表示する要件はない。

---

## D4: NoteDoc の場所フィールドはすべて optional とする

**決定:** `NoteDoc` に追加する Phase 12.5 フィールド（`placeEnrichmentStatus` / `placeEnrichmentError` / `placeEnrichmentUpdatedAt` / `visitedPlacesSummary`）はすべて `optional` かつ `| null` 型とする。

**理由:** 既存ノート（Phase 0〜12 で作成済み）にはこれらのフィールドが存在しない。optional にしておくことで既存 NoteDoc の読み込み時に型エラーが発生しない。Firestore はスキーマレスなので、フィールドなしの既存ドキュメントは `undefined` として扱われる。

---

## D5: Cloud Functions は Phase 12.5C で実装する

**決定:** `placeGroupRepository.ts` はクライアント Firestore SDK のみを使用する。`enrichNotePlaces` 等の Cloud Functions callable は Phase 12.5C で実装する。

**理由:** Phase 12.5B の目的はデータモデル・型定義・Rules の整備のみ。Google Places API 呼び出し・AI ランキング等は Phase 12.5C 以降に分離して実装する。

---

## D6: deletePlaceGroupsForNote は PlaceGroup ドキュメントのみ削除

**決定:** `deletePlaceGroupsForNote` は `place_groups` コレクションのドキュメントのみ削除する。`candidates` サブコレクションはクライアント SDK では再帰削除できないため、削除しない。

**理由:** Firestore クライアント SDK にはサブコレクションの再帰削除機能がない。`candidates` の削除は Cloud Functions Admin SDK（`recursiveDelete`）または定期的なクリーンアップジョブで対応する。ノート削除時に孤立した candidates が残っても Firestore のコスト・セキュリティ上の問題は小さい（Rules により他ユーザーはアクセス不可）。

---

## D7: candidates の orderBy は confidence 降順

**決定:** `getPlaceCandidatesByGroupId` では `orderBy('confidence', 'desc')` で候補を返す。

**理由:** Phase 12.5D で実装するスコアリング後の候補は confidence 降順が UI 表示の基本順序となる。Phase 12.5C（Cloud Functions）が candidates を書き込む際に confidence を設定する。
