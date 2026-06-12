# Phase 12.5B Place Data Model — Next Steps

## フェーズ完了条件

Phase 12.5B は以下がすべて完了した時点で Phase 12.5C に進む。

- [x] 型定義追加（PlaceGroupDoc / PlaceCandidateDoc / VisitedPlacesSummary 等）
- [x] placeGroupRepository.ts 新規作成
- [x] Firestore Rules 更新（place_groups / candidates）
- [x] NoteDoc に Phase 12.5 optional fields 追加
- [x] npx tsc --noEmit が Exit 0
- [x] npx expo lint が Exit 0
- [x] 実装ログ作成

---

## Step 1: Firestore Rules を deploy する（人間が実施）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

# Phase 11 の未デプロイ変更も含めて deploy（推奨）
npx firebase-tools deploy --only functions,firestore:rules,storage --project memory-note-app-dev

# Rules のみ deploy する場合
npx firebase-tools deploy --only firestore:rules --project memory-note-app-dev
```

---

## Step 2: Phase 12.5C — Cloud Functions 実装

Phase 12.5C では以下の Cloud Functions を実装する。

```text
docs/phase12_5_place_intelligence/04_cloud_functions_api_design.md を参照。
```

実装する callable:
1. `enrichNotePlaces` — GPS 座標グルーピング → Google Places API 呼び出し → PlaceGroupDoc / PlaceCandidateDoc 保存
2. `getPlaceCandidatesForGroup` — 候補一覧を返す（クライアント向け）
3. `selectPlaceCandidate` — ユーザー選択を PlaceGroupDoc に反映
4. `updatePlaceGroupManually` — 手動ラベル入力
5. `refreshPlaceCandidates` — 24時間経過後の再取得

実装内容:
- Google Places API (New) Nearby Search 呼び出し（GOOGLE_PLACES_API_KEY は Secret Manager から参照）
- PlaceGroupDoc / PlaceCandidateDoc の Firestore 書き込み
- NoteDoc の placeEnrichmentStatus 更新
- visitedPlacesSummary の再計算

---

## Step 3: Phase 12.5D — 候補スコアリング実装

```text
docs/phase12_5_place_intelligence/05_candidate_scoring_and_ai_ranking.md を参照。
```

実装内容:
- 7因子スコアリング（GPS距離・カテゴリ優先度・写真集中度・メモ一致・タイトル一致・評価・複数グループボーナス）
- OpenAI API を使った候補ランキング（候補テキストリストのみ送信、座標は送信しない）

---

## Step 4: Phase 12.5E — Places UI 画面実装

```text
docs/phase12_5_place_intelligence/06_ui_flow.md を参照。
```

実装画面:
- SCR-PLACE-001: places 一覧画面（`app/(app)/notes/[noteId]/places/index.tsx`）
- SCR-PLACE-002: 候補確認画面（`app/(app)/notes/[noteId]/places/[placeGroupId].tsx`）
- SCR-PLACE-004: 手動入力画面（`app/(app)/notes/[noteId]/places/manual.tsx`）

---

## Step 5: Phase 12.5F — Map SDK 本格化

```text
docs/phase12_5_place_intelligence/provider_tests/05_map_sdk_decision_note.md を参照。
```

実装内容:
- react-native-maps 導入（EAS Development Build が必要）
- `<MapView>` + `<Marker>` で PlaceGroup ピン表示
- Android 向け Google Maps API キー取得

---

## Phase 12.5C への移行プロンプト

Phase 12.5C を開始する場合は、次の Claude Code セッションに以下を渡す:

```
Phase 12.5C: Cloud Functions — enrichNotePlaces を実装してください。

参照ドキュメント:
- docs/phase12_5_place_intelligence/04_cloud_functions_api_design.md
- docs/phase12_5_place_intelligence/05_candidate_scoring_and_ai_ranking.md
- docs/phase12_5_place_intelligence/03_data_model.md

実装内容:
1. functions/src/place/ ディレクトリに enrichNotePlaces.ts を作成
2. Google Places API (New) Nearby Search を呼び出す
3. PlaceGroupDoc / PlaceCandidateDoc を Firestore に保存する
4. GOOGLE_PLACES_API_KEY は defineSecret() 経由で参照する

完了条件:
- npx tsc --noEmit が Exit 0（functions/ 配下）
- Functions deploy 前に dry-run または emulator テストを実施
- Firebase deploy はユーザーが実施
```
