# Phase 12.5C-3 Place Retrieval Diagnostics / Rework — Decisions

## D1: 候補表示順を distanceMeters 昇順に全レイヤで統一する

**決定:** 以下の4箇所すべてで候補の並び順を `distanceMeters` 昇順（近い順）に統一した。

1. `firebase/functions/src/place/placeFunctions.ts` — `fetchAndSaveCandidates` 内のソート（Phase 12.5C-2 で実施済み）
2. `firebase/functions/src/place/placeFunctions.ts` — `getPlaceCandidatesForGroup` のキャッシュ取得クエリ
3. `src/core/repositories/placeGroupRepository.ts` — `getPlaceCandidatesByGroupId` の Firestore クエリ
4. `app/(app)/dev/place-callable-test.tsx` — `CandidateRow` の表示順

**理由:**
- `confidence desc` で並べると距離が近くても低評価カテゴリ（住宅・道路等）が上位に来ることがある。
- `rankPreference: DISTANCE` を使った Nearby Search の趣旨と一致させる。
- UIで「距離が近い = 訪問した可能性が高い」という直感的な順序をユーザーに提示する。

---

## D2: confidence はユーザー向け順位付けに使わない

**決定:** `confidence` フィールドは保持するが、ソート・優先度判定には使わない。

**役割:**
- 開発用テスト画面の参考情報として表示する（ラベル: `confidence (参考)`）
- 距離が完全に同値の場合のみ tie-breaker として使用する
- Phase 12.5D 以降で UI 廃止またはより精度の高い指標に置き換える候補

**理由:**
- `dist*0.6 + cat*0.3 + rating*0.1` の簡易3因子スコアは、距離順と矛盾するケースを生む
- 精度改善前に `confidence` で並び替えると、逆に精度が悪化する

---

## D3: Text Search fallback は診断後に判断する

**決定:** `searchTextPlaces` helper を `placesClient.ts` に追加したが、本番 Cloud Functions への組み込みは診断スクリプトの結果を見てから次フェーズで判断する。

**理由:**
- Text Search は Nearby Search より 1リクエストあたりのコストが高い（$0.032 vs $0.010 per request）
- まず診断スクリプトで「Wasabi Plus が Nearby で出るか / Text Search でのみ出るか」を確認する
- Text Search で出るなら fallback として組み込む価値あり
- 出なければ別の原因（GPS 精度・Google Maps 未掲載等）を調査する

---

## D4: 写真ごとの場所推定が将来的に必要

**現在のフロー:**
```
photos → GPS グルーピング → 代表座標 → Nearby Search
```

**推奨フロー（将来）:**
```
photo ごとに Nearby Search
→ candidateを placeId で統合
→ PlaceGroup を作る（photoIds / startAt / endAt / sortOrder を保存）
```

**理由:**
- レストランやショッピングモールが密集するエリアでは、複数写真の平均座標（代表点）が実際の店舗からズレやすい
- 旅程のマッループロット・時系列表示には `photoId` 単位の位置情報が必要
- `noteId` レベルの共有は正しい。`photoId` + `takenAt` で個別地点を扱うことで精度と時系列が向上する

**実装時期:** Phase 12.5E 本番 UI 完成後に検討。今フェーズでは方針記録のみ。

---

## D5: AIランキングをスキップする

**決定:** OpenAI / その他 AI によるリランキングは当面実装しない。

**理由:**
```
- 場所特定はおすすめではなく事実確認。AI の「それっぽい」回答は危険
- ユーザーが候補から選ぶ UX の方が安全かつ正確
- 現時点の課題は AI ランキングではなく、Nearby Search の候補取得精度と候補数
- まず Nearby Search / Text Search fallback / 手動入力で解決する
- AI は将来、候補名の要約・日記文への反映・エリアラベル生成で使う
```

**AIランキング利用の想定（将来）:**
- 候補名を日本語に整形・要約する
- ノートのメモ・タイトルと候補名の意味的一致スコア補助
- 複数グループにまたがるエリアラベル生成
