# Phase 12.5C-3 Place Retrieval Diagnostics / Rework — Issues

## I1: Nearby Search では Google Maps 上の店舗が返らない可能性がある

**状況:** `Wasabi Plus 山葵日料 | Bukit Jalil` は Google Maps 上にピン・店舗ページが存在するが、Nearby Search の `maxResultCount: 10`（後に20）の範囲に含まれていない可能性がある。

**考えられる原因:**
- Google Places データベースの登録状態（新規 / 統合 / 閉店マーク）
- Nearby Search の結果セットに含まれる場所タイプ（`includedTypes` フィルタの影響）
- 写真 GPS と店舗座標のズレが半径外になっている
- `POPULARITY` より `DISTANCE` ランキングの方が表示されやすいが、それでも対象外の場合がある

**対応方針:** 診断スクリプト (`diagnose-place-retrieval.mjs`) で Nearby Search の radius 50m〜500m を全パターン試し、出るかどうかを確認する。

---

## I2: Text Search なら返る可能性がある

**状況:** Text Search (`POST /v1/places:searchText`) は名前でピンポイント検索できるため、Nearby Search で出ない店舗でも取得できる可能性がある。

**確認方法:** 診断スクリプトの T09〜T12 で確認する。

**影響:** Text Search で出るなら、Nearby 0件時の fallback として次フェーズで組み込む価値がある。

---

## I3: 写真 GPS の誤差

**状況:** iPhone で撮影した写真の GPS メタデータは通常 10m 以内の精度だが、屋内・高層ビル・地下では 20〜50m 程度の誤差が発生することがある。

**影響:** 店舗が小さいビルの一室にある場合、GPS が隣のビルや道路を指す可能性がある。

**確認方法:** 診断スクリプトで 50m / 100m の半径でも試す。T01 / T02 で出ない場合は GPS 誤差が大きい可能性あり。

---

## I4: 代表座標検索の限界

**状況:** 現在の実装は複数写真の平均 GPS（代表座標）から Nearby Search を行う。密集エリアでは平均がズレて、実際の撮影地点と異なる座標になりうる。

**例:** photo-1 (3.0615, 101.67668) と photo-2 (3.0613805, 101.676605) の平均は概ね同座標だが、3枚以上になると分散が大きくなる可能性がある。

**推奨:** 写真ごとに Nearby Search を実行し、placeId で統合する（Phase 12.5D 以降で検討）。

---

## I5: maxResultCount を20にしても出ない場合は手動入力が必要

**状況:** 診断スクリプトで maxResultCount: 20 を試しても Wasabi Plus が返らない場合、Nearby Search での自動取得は困難。

**対応方針:**
1. Text Search fallback を次フェーズで実装する
2. それでも出ない場合は `updatePlaceGroupManually` callable で手動入力
3. SCR-PLACE-004 (手動入力画面) は Phase 12.5E で実装済み予定

---

## I6: API コスト管理がまだ弱い

**状況:** 以下が未実装:
- ユーザー単位の日次 API カウンター（`usage_counters/{uid}/places_api_calls/{YYYYMMDD}`）
- `refreshPlaceCandidates` のレート制限（1グループ/日3回）

**影響:** 開発テスト中に診断スクリプトや forceRefresh を繰り返し実行すると Places API のリクエスト数が増加する。

**対応方針:** 診断スクリプト実行時は同じ API キーで多数リクエストするため、使用後に `Remove-Item Env:GOOGLE_PLACES_API_KEY` を実行すること。本番制限は Phase 12.5D で実装予定。

---

## I7: Firestore の candidates に distanceMeters インデックスが必要

**状況:** `orderBy('distanceMeters', 'asc')` に変更したが、Firestore の複合インデックスが未作成の場合、クエリがエラーになる可能性がある。

**対応方針:** 初回クエリ時に Firestore がコンソールにインデックス作成リンクを出力する。そのリンクをクリックしてインデックスを作成するか、`firestore.indexes.json` に追加して deploy する。
