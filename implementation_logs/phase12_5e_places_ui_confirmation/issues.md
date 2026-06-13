# Phase 12.5E Places UI / User Confirmation — Issues

## I1: 密集地では誤候補が出る

**状況:** Google Places Nearby Search（200m以内）では、ユーザーが訪問目的として選ばない場所（会社・歯医者・カーディーラー・学校）が上位候補に混入することがある。

**影響:** 候補確認画面で見づらくなるが、「訪問候補 / その他の近隣」の2グループ分類でUIレベルでは軽減している。

**将来対応:** Phase 12.5C-4 の food-aware search により飲食ノートは改善済み。非飲食ノートの誤候補は Phase 12.5D 以降で追加の絞り込みを検討。

---

## I2: Google Places に登録されていない場所は手動入力が必要

**状況:** ローカルの小規模店・民宿・個人宅などは Places API に出ないため候補に含まれない。

**影響:** 候補確認画面で候補0件になる場合がある。

**対処:** 手動入力画面（manual.tsx）へ誘導する。

---

## I3: viewer の候補詳細表示制御が部分的

**状況:** 現在の実装では viewer が places 一覧画面で未確認グループをタップしても何もしない（サイレント）が、候補確認画面（`[placeGroupId].tsx`）を直接 URL で開くと閲覧できてしまう。

**影響:** セキュリティリスクは低い（候補はユーザー自身のノートデータ）が、UX として不整合がある。

**将来対応:** Cloud Functions の permission 制御が既に `assertOwnerOrEditor` で保護されているため、選択操作は不可。閲覧制限は Phase 12.5F で整備。

---

## I4: Map SDK は未実装

**状況:** 候補確認画面に「地図ミニビュー（写真ピン表示）」を追加できていない。

**影響:** 場所の地理的な位置関係がUIで確認できない。

**将来対応:** Phase 12.5F で react-native-maps または expo-maps を導入時に実装。

---

## I5: 時系列表示は未実装

**状況:** 確定済み PlaceGroup の時系列表示（タイムライン）は本フェーズでは実装していない。

**将来対応:** Phase 12.5F または独立した Phase で実装予定。

---

## I6: API コスト制御は未実装

**状況:** 本番 UI から `enrichNotePlaces`（ `forceRefresh` なし）・`refreshPlaceCandidates` を繰り返し呼び出すと Places API コストが増加する。

**影響:** 開発テスト中は問題ないが、ユーザー数が増えた場合のコスト管理が必要。

**将来対応:** Phase 12.5D で日次 API 制限・レート制限を実装予定。

---

## I7: manual.tsx の placeGroupId が URL クエリパラメータ依存

**状況:** `manual.tsx` は `placeGroupId` を URL クエリ (`?placeGroupId=xxx`) で受け取る。
places/index.tsx から新規グループを手動追加するケースでは `placeGroupId` が空になる。

**影響:** 現在の実装では `placeGroupId` がない場合に Alert を表示して保存を拒否する。

**将来対応:** `placeGroupId` がない場合は新規 PlaceGroup を作成して保存する機能を追加。
