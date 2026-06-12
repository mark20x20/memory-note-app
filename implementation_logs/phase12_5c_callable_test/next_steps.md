# Phase 12.5C Callable Test — Next Steps

## フェーズ完了条件

Phase 12.5C Callable Test は以下がすべて完了した時点でテスト完了とみなす。

- [x] `src/features/placeIntelligence/api/placeFunctionsClient.ts` 作成
- [x] `app/(app)/dev/place-callable-test.tsx` 作成
- [x] `app/(app)/settings.tsx` に dev-only リンク追加
- [x] `npx tsc --noEmit` が Exit 0
- [x] `npx expo lint` が Exit 0
- [x] 実装ログ作成

---

## Step 1: 実機でのテスト手順

```text
前提:
- Firebase deploy 済み（Phase 12.5C 関数が deploy されていること）
- Firestore Rules が deploy 済み（Phase 12.5B の Rules）
- GPS 付き写真を含むノートが存在すること

1. Expo アプリを実機で起動
2. 設定画面（settings）を開く
3. 「開発用ツール」セクションが表示されることを確認
4. 「開発用: Place Callable Test」をタップ
5. noteId 入力欄に GPS 付き写真を含むノートの ID を貼り付ける
6. 「enrichNotePlaces 実行」ボタンをタップ
7. 期待される結果:
   { success: true, placeGroupsCreated: N, status: "completed" }
8. 画面下部の PlaceGroups セクションに PlaceGroup が表示されることを確認
9. 「Firestore候補」ボタンを押して candidates が表示されることを確認
```

---

## Step 2: GPS なしノートのテスト

```text
1. GPS 付き写真がないノートの noteId を入力
2. 「enrichNotePlaces 実行」ボタンをタップ
3. 期待される結果:
   { success: true, status: "no_gps_data" }
4. PlaceGroups は空欄になることを確認
```

---

## Step 3: forceRefresh テスト

```text
1. 一度 enrichNotePlaces を実行して PlaceGroups が作成されていることを確認
2. forceRefresh トグルを ON にする
3. 再度「enrichNotePlaces 実行」ボタンをタップ
4. PlaceGroups が再作成されることを確認
```

---

## Step 4: 問題なければ Phase 12.5D または Phase 12.5E に進む

### Phase 12.5D（スコアリング / AI ランキング）への移行プロンプト

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

### Phase 12.5E（Places UI 画面）への移行プロンプト

```
Phase 12.5E: Places UI 画面実装

参照ドキュメント:
- docs/phase12_5_place_intelligence/06_ui_flow.md

実装対象:
- SCR-PLACE-001: places 一覧画面（app/(app)/notes/[noteId]/places/index.tsx）
- SCR-PLACE-002: 候補確認画面（app/(app)/notes/[noteId]/places/[placeGroupId].tsx）
- SCR-PLACE-004: 手動入力画面（app/(app)/notes/[noteId]/places/manual.tsx）
```
