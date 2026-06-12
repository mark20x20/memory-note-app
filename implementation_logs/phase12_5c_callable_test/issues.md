# Phase 12.5C Callable Test — Issues

## I1: GPS付き写真がないと no_gps_data が返る

**状況:** `enrichNotePlaces` は、ノート内の写真に GPS 座標が1件もない場合、`{ success: true, status: "no_gps_data" }` を返す。place_groups は作成されない。

**影響:** 開発用テストで `no_gps_data` が表示される場合、テストに使用するノートに GPS 付き写真が含まれていない。

**対応方針:** GPS 付き写真を含むノートを使ってテストすること。iOS: カメラアプリで撮影した写真は GPS 付き。Android: 設定 > 位置情報 > カメラ を ON にする。

---

## I2: Firestore candidates は viewer ロールでは取得不可

**状況:** `getPlaceCandidatesByGroupId` は Firestore Client SDK で `candidates` サブコレクションを読み込む。Firestore Rules により viewer は `place_groups` および `candidates` の読み取りが許可されている（Phase 12.5B の Rules 想定）。

**影響:** Rules が正しく deploy されていないと candidates が読めない。

**対応方針:** `firebase deploy --only firestore:rules` を実行して Phase 12.5B の Rules を適用する。

---

## I3: 開発用テスト画面は本番 UI ではない

**状況:** `app/(app)/dev/place-callable-test.tsx` はデバッグ用の JSON 表示・ボタン集合であり、エンドユーザー向けのデザインではない。

**影響:** ユーザーには見せない。本番 UI は Phase 12.5E で実装する。

---

## I4: Cloud Functions 側の日次 API 制限が未実装

**状況:** `usage_counters/{uid}/places_api_calls/{YYYYMMDD}` による日次制限は Phase 12.5C の Cloud Functions に実装されていない。

**影響:** 開発者が `enrichNotePlaces` を繰り返し呼び出すと Google Places API のリクエスト数が増加する。

**対応方針:** 開発テスト中は意図的に呼び出し回数を抑える。本番利用前に Phase 12.5D で実装する。

---

## I5: Node.js 20 deprecated warning は別タスク

**状況:** `firebase/functions` の `npm run build` 時に Node.js 20 の `--deprecation` 警告が出る場合がある（既知・別タスク）。

**影響:** 今回の実装では Functions を変更していないため影響なし。
