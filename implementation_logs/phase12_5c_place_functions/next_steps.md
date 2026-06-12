# Phase 12.5C Place Intelligence Cloud Functions — Next Steps

## フェーズ完了条件

Phase 12.5C は以下がすべて完了した時点で Phase 12.5D に進む。

- [x] `place/types.ts` 型定義作成
- [x] `place/placesClient.ts` Google Places API クライアント実装
- [x] `place/placeScoring.ts` 簡易スコアリング実装
- [x] `place/placeUtils.ts` GPS グルーピング実装
- [x] `place/placeFunctions.ts` 5 callable 実装
- [x] `index.ts` に re-export 追加
- [x] `npm run build` in `firebase/functions` が Exit 0
- [x] `npx tsc --noEmit` が Exit 0
- [x] `npx expo lint` が Exit 0
- [x] `GOOGLE_PLACES_API_KEY` が `defineSecret()` で参照されている
- [x] 実装ログ作成

---

## Step 1: Firebase deploy（人間が実施）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

# Functions + Rules + Storage を一括 deploy
npx firebase-tools deploy --only functions,firestore:rules,storage --project memory-note-app-dev

# Functions のみ deploy する場合
npx firebase-tools deploy --only functions --project memory-note-app-dev
```

---

## Step 2: Callable テスト（実機 or Emulator）

deploy 後に以下の callable を Firebase Console または Expo アプリから呼び出して動作確認する。

```
enrichNotePlaces({ noteId: "<既存ノートID>", forceRefresh: false })
→ 期待: { success: true, placeGroupsCreated: N, status: "completed" }

getPlaceCandidatesForGroup({ noteId: "...", placeGroupId: "..." })
→ 期待: { candidates: [...], cacheHit: true|false }

selectPlaceCandidate({ noteId: "...", placeGroupId: "...", candidateId: "..." })
→ 期待: { success: true, updatedLabel: "...", updatedCategory: "..." }

updatePlaceGroupManually({ noteId: "...", placeGroupId: "...", label: "浅草寺", category: "tourist_attraction" })
→ 期待: { success: true }

refreshPlaceCandidates({ noteId: "...", placeGroupId: "..." })
→ 期待: { candidatesCount: N, refreshedAt: "..." }
```

---

## Step 3: Phase 12.5D — 候補スコアリング / AI ランキング実装

```text
参照ドキュメント:
- docs/phase12_5_place_intelligence/05_candidate_scoring_and_ai_ranking.md
```

実装内容:
- 7因子スコアリング（GPS距離・カテゴリ優先度・写真集中度・メモ一致・タイトル一致・評価・複数グループボーナス）
- OpenAI API を使った候補ランキング（候補テキスト・メモ・タイトルのみ送信、座標は送信しない）
- areaLabel の生成（Geocoding API または OpenAI）
- ユーザー単位日次カウンター（I4 対応）
- refreshPlaceCandidates のレート制限（I9 対応）

---

## Step 4: Phase 12.5E — Places UI 画面実装

```text
参照ドキュメント:
- docs/phase12_5_place_intelligence/06_ui_flow.md
```

実装画面:
- SCR-PLACE-001: places 一覧画面（`app/(app)/notes/[noteId]/places/index.tsx`）
- SCR-PLACE-002: 候補確認画面（`app/(app)/notes/[noteId]/places/[placeGroupId].tsx`）
- SCR-PLACE-004: 手動入力画面（`app/(app)/notes/[noteId]/places/manual.tsx`）

UI から呼び出す callable: `enrichNotePlaces`, `selectPlaceCandidate`, `updatePlaceGroupManually`, `refreshPlaceCandidates`

---

## Step 5: deleteNote 連鎖削除の統合（I8 対応）

Phase 12.5E 実装後または並行して:
- ノート削除 Cloud Function に Admin SDK `recursiveDelete` を追加
- `place_groups` + `candidates` サブコレクションを連鎖削除

---

## Phase 12.5D への移行プロンプト

Phase 12.5D を開始する場合は、次の Claude Code セッションに以下を渡す:

```
Phase 12.5D: 候補スコアリング / AI ランキング実装

参照ドキュメント:
- docs/phase12_5_place_intelligence/05_candidate_scoring_and_ai_ranking.md
- docs/phase12_5_place_intelligence/04_cloud_functions_api_design.md

実装対象:
1. firebase/functions/src/place/placeScoring.ts の簡易スコアリングを7因子に拡張
2. OpenAI を使った候補ランキング（候補テキスト・メモ・タイトルのみ送信）
3. areaLabel の生成
4. usage_counters/{uid}/places_api_calls/{YYYYMMDD} による日次制限

完了条件:
- npm run build in firebase/functions が Exit 0
- Firebase deploy はユーザーが実施
```
