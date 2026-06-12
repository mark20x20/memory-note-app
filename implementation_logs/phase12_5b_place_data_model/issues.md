# Phase 12.5B Place Data Model — Issues

## I1: Firestore Rules は deploy するまで本番反映されない

**状況:** `firebase/firestore.rules` に place_groups / candidates のルールを追加したが、Firebase への deploy はまだ実施していない。

**影響:** 本番環境（memory-note-app-dev）では現在のルールが適用されており、新しい place_groups コレクションへのアクセスは `/{document=**} → allow read, write: if false` に該当し、全拒否になる。

**対応方針:** Phase 12.5B 完了後（または Phase 12.5C 実装開始前）に `npx firebase-tools deploy --only firestore:rules --project memory-note-app-dev` を実行する。Phase 11 の未デプロイ変更も同時にデプロイすることを推奨。

---

## I2: candidates の read 権限と UI 表示の整合性

**状況:** Firestore Rules で viewer に candidates の read を禁止したが、Phase 12.5E の UI 実装時に viewer 向け画面で candidates を参照しようとすると Permission Denied になる。

**影響:** 設計通り viewer は候補リストを見ない想定だが、Phase 12.5E の UI 設計で要件が変わった場合はルールの修正が必要になる。

**対応方針:** Phase 12.5E 実装前に viewer 向け画面の要件を確認し、必要であれば Rules を更新する。

---

## I3: deletePlaceGroupsForNote で candidates が孤立する

**状況:** `deletePlaceGroupsForNote` は PlaceGroup ドキュメントのみを削除し、candidates サブコレクションは削除しない（クライアント SDK では再帰削除不可）。

**影響:** ノート削除時に孤立した candidates ドキュメントが Firestore に残る可能性がある。読み込み件数はわずか（1 ノートあたり最大 25件）だが、厳密な削除連鎖が必要な場合は注意。

**対応方針:** Phase 12.5C の Cloud Functions 実装時に Admin SDK の `recursiveDelete` を使った cleanup 関数を追加する。または、Phase 10 のノート削除 Cloud Function（`deleteNote` 系）に candidates 削除を組み込む。

---

## I4: 既存ノートには place_enrichment フィールドが存在しない

**状況:** Phase 0〜12 で作成された既存ノートには `placeEnrichmentStatus` / `visitedPlacesSummary` 等のフィールドが存在しない。

**影響:** Firestore から既存ノートを読み込んだ時、`NoteDoc.placeEnrichmentStatus` は `undefined` になる。TypeScript 型は `optional` なので型エラーにはならない。UI 側で `placeEnrichmentStatus ?? 'idle'` のようにデフォルト値を設定する必要がある。

**対応方針:** Phase 12.5E の UI 実装時に null/undefined の扱いを明示する。Firestore の migration（既存ドキュメントへの backfill）は不要。

---

## I5: Phase 12.5C まではデータが自動生成されない

**状況:** PlaceGroupDoc / PlaceCandidateDoc の型定義・Repository・Rules は整備されたが、実際に place_groups コレクションにデータが書き込まれるのは Phase 12.5C の Cloud Functions 実装後になる。

**影響:** Phase 12.5B 単体ではアプリの見た目・動作に変化なし。Phase 12.5C 完了まで Places Intelligence 機能は使えない。

**対応方針:** Phase 12.5C で `enrichNotePlaces` Cloud Function を実装する。

---

## I6: candidates の orderBy('confidence') にコンポジットインデックスが必要になる可能性

**状況:** `getPlaceCandidatesByGroupId` は `orderBy('confidence', 'desc')` でクエリする。候補数が少ない（最大5件）うちは問題ないが、追加のフィルタ条件を加えた場合はコンポジットインデックスが必要になる。

**対応方針:** Phase 12.5C 実装時に必要なら `firestore.indexes.json` にインデックスを追加する。
