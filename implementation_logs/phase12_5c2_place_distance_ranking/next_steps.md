# Phase 12.5C-2 Place Distance Ranking — Next Steps

## フェーズ完了条件

Phase 12.5C-2 は以下がすべて完了した時点で完了とみなす。

- [x] `rankPreference: "DISTANCE"` を `placesClient.ts` に追加
- [x] 保存候補数を10件に変更（`placeFunctions.ts` の2箇所）
- [x] `npm run build` in `firebase/functions` が Exit 0
- [x] `npx tsc --noEmit` が Exit 0
- [x] `npx expo lint` が Exit 0
- [x] AIランキング延期の判断をログに記録
- [x] Phase 12.5D の再定義を記録

---

## Step 1: Firebase deploy（人間が実施）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

npx firebase-tools deploy --only functions --project memory-note-app-dev
```

---

## Step 2: 実機で forceRefresh=true で再テスト

```text
1. 開発用テスト画面を開く（設定 → 開発用: Place Callable Test）
2. 同じ noteId（Wasabi Plus の写真を含むノート）を入力
3. forceRefresh トグルを ON にする
4. enrichNotePlaces を実行
5. 期待: placeGroupsCreated: 1, status: "completed"
6. PlaceGroups の candidates に Wasabi Plus が出るか確認
```

---

## Step 3: Wasabi Plus が出ない場合の対処

候補に出ない場合、以下を順番に試す。

### 3a. 写真のGPS座標を確認

```text
- Firestore の memory_notes/{noteId}/photos を確認
- 写真の latitude / longitude が Wasabi Plus の実際の座標と近いか確認
- Google Maps で座標をプロットして店の位置と比較
```

### 3b. Text Search API を検討

```text
- Google Places API の Text Search（POST /v1/places:searchText）でテキストで検索
- "Wasabi Plus Bukit Jalil" などのクエリで検索
- 実装は Phase 12.5D 以降
```

### 3c. 手動入力で回避

```text
- updatePlaceGroupManually({ label: "Wasabi Plus 山葵日料", category: "restaurant" })
- 開発用テスト画面または Firebase Console から呼び出す
```

---

## Step 4: 問題なければ Phase 12.5E 本番UIへ進む

### Phase 12.5E 実装対象

```text
参照ドキュメント:
- docs/phase12_5_place_intelligence/06_ui_flow.md

実装画面:
- SCR-PLACE-001: places 一覧画面（app/(app)/notes/[noteId]/places/index.tsx）
- SCR-PLACE-002: 候補確認画面（app/(app)/notes/[noteId]/places/[placeGroupId].tsx）
- SCR-PLACE-004: 手動入力画面（app/(app)/notes/[noteId]/places/manual.tsx）

UI から呼び出す callable:
- enrichNotePlaces（「場所を推定する」ボタン）
- selectPlaceCandidate（候補選択）
- updatePlaceGroupManually（手動入力確定）
- refreshPlaceCandidates（候補を再取得）
```

---

## Step 5: AIランキングは当面スキップ

AIランキングは以下の条件が揃った段階で再検討する。

```text
条件:
- Phase 12.5E の本番UI が完成している
- ユーザーが選択できるUXが機能している
- 距離順候補でも正解率が不十分な事例が蓄積された

将来の用途（候補）:
- ノートメモ・タイトルとの意味的一致スコアリング
- 複数グループをまたいだエリアラベル生成
- 候補名の日本語整形・要約
```
