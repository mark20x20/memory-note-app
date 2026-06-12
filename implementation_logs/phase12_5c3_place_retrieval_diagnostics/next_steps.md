# Phase 12.5C-3 Place Retrieval Diagnostics / Rework — Next Steps

## フェーズ完了条件

Phase 12.5C-3 は以下がすべて完了した時点で完了とみなす。

- [x] Repository の候補取得を `distanceMeters asc` に変更
- [x] `getPlaceCandidatesForGroup` callable のキャッシュクエリを `distanceMeters asc` に変更
- [x] 開発用テスト画面の表示を距離優先に変更
- [x] `searchTextPlaces` helper を `placesClient.ts` に追加
- [x] 診断スクリプト `diagnose-place-retrieval.mjs` を作成
- [x] `npm run build` in `firebase/functions` が Exit 0
- [x] `npx tsc --noEmit` が Exit 0
- [x] `npx expo lint` が Exit 0
- [x] 実装ログ作成

---

## Step 1: Firebase deploy（人間が実施）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools deploy --only functions --project memory-note-app-dev
```

---

## Step 2: 診断スクリプトを実行

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

$env:GOOGLE_PLACES_API_KEY="your-api-key"
node scripts/place-intelligence/diagnose-place-retrieval.mjs
Remove-Item Env:GOOGLE_PLACES_API_KEY
```

---

## Step 3: 診断結果の判断フロー

### ケース A: Nearby Search (T01〜T08) で Wasabi Plus が出た

```text
→ 半径・langCode のどのパターンで出たか記録する
→ Functions の searchNearbyPlaces を同条件に調整する
→ forceRefresh=true で実機再テスト
→ 問題なければ Phase 12.5E へ進む
```

### ケース B: Nearby Search では出なかったが Text Search (T09〜T12) で出た

```text
→ Text Search fallback を次フェーズで実装する
→ 実装方針:
   enrichNotePlaces で Nearby Search 0件または上位 confidence が低い場合に
   searchTextPlaces を fallback として呼び出す
→ 実装後に forceRefresh=true で実機再テスト
```

### ケース C: Nearby / Text Search どちらでも出なかった

```text
→ Google Maps で店舗ページの placeId を確認する
→ Place Details API で直接取得を試みる
→ または updatePlaceGroupManually で手動入力して運用
→ 将来的にはユーザーが store URL / QR コードをスキャンして手動紐付けする UX を検討
```

---

## Step 4: Firestore インデックス確認

`orderBy('distanceMeters', 'asc')` クエリを初回実行する際に Firestore コンソールにインデックス作成リンクが表示される場合がある。

```text
エラー例:
  FAILED_PRECONDITION: The query requires an index.
  https://console.firebase.google.com/... にアクセスしてインデックスを作成してください。
```

リンクをクリックしてインデックスを作成すること。

---

## Step 5: 問題なければ Phase 12.5E 本番 UI へ進む

### Phase 12.5E への移行プロンプト

```
Phase 12.5E: Places UI 画面実装

参照ドキュメント:
- docs/phase12_5_place_intelligence/06_ui_flow.md

実装画面:
- SCR-PLACE-001: places 一覧画面（app/(app)/notes/[noteId]/places/index.tsx）
- SCR-PLACE-002: 候補確認画面（app/(app)/notes/[noteId]/places/[placeGroupId].tsx）
- SCR-PLACE-004: 手動入力画面（app/(app)/notes/[noteId]/places/manual.tsx）

方針:
- 候補表示は distanceMeters 昇順（近い順）
- confidence は開発用参考値として非表示またはサブ表示
- userConfirmed = false のグループは「要確認」バッジを表示
- AIランキングはスキップ
```

---

## Step 6: AIランキングは当面スキップ

AIランキングの再検討は以下の条件が揃った段階で行う。

```text
条件:
- Phase 12.5E 本番 UI が機能している
- Nearby / Text Search での候補精度が十分か判断できるデータが蓄積された
- ユーザーが選択・手動入力できる UX が動作している

将来の AI 活用候補:
- 候補名の日本語整形・要約
- ノートメモとの意味的一致スコアリング
- エリアラベル生成（Geocoding API との比較）
```
