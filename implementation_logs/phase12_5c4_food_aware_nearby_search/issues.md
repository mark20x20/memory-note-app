# Phase 12.5C-4 Food-aware Nearby Search — Issues

## I1: food-related 判定によって API コストが最大2倍になる

**状況:** food-related と判定されたノートでは、1 PlaceGroup あたり2コールが発生する。
- food Nearby Search（200m, includedTypes=restaurant/cafe）
- general Nearby Search（200m）

**影響計算:**
- 1ノート最大5グループ
- food-related の場合: 最大 5 × 2 = 10 コール/ノート
- general の場合: 最大 5 × 1 = 5 コール/ノート
- 両方とも0件の場合は追加で 500m fallback が加わる

**現状:** 日次 API 制限・ユーザーあたりカウンターは未実装（Phase 12.5D 以降で実装予定）。

---

## I2: food-related 判定は軽量ヒューリスティックであり誤判定がある

**状況:** `isFoodRelatedNote` は noteType / title / memo のキーワードマッチのみ。

**誤判定のケース:**
- 「食事制限のある旅行」→ 「食事」が含まれるため food-related と判定される可能性
- 料理教室ノート → food-related と判定されるが、料理店ではない場合もある
- noteType が未設定（空文字・null）の場合は title / memo 頼り

**影響:** food-related 誤判定の場合は余分に1コールが発生するが、候補精度は下がらない（general 検索は常に含まれるため）。

---

## I3: noteType が未整備の場合は memo/title 頼りになる

**状況:** `noteType` フィールドがノードに設定されていない場合、食事関連判定は `title` と `memo` のキーワードに依存する。

**影響:** noteType が整備されるまでは、短いタイトル（例: 「6月旅行」）だけのノートは general 検索のみになる。

**将来対応:** Phase 12.5E でノートタイプ設定 UI が整備されれば精度が上がる。

---

## I4: Text Search fallback はまだ未実装

**状況:** `searchTextPlaces` helper は `placesClient.ts` に追加済みだが、本番 Cloud Functions への組み込みは未実装。

**影響:** food+general Nearby Search（200m/500m）で候補0件の場合でも Text Search は実行されない。

**対応方針:** Phase 12.5E 本番 UI 完成後に必要性を判断して実装する。

---

## I5: 日次 API 制限・レート制限が未実装

**状況:** 以下が未実装:
- ユーザー単位の日次 API コールカウンター
- `refreshPlaceCandidates` のレート制限（1グループ/日3回）

**影響:** 開発テスト中に forceRefresh を繰り返すと Places API のコストが増加する。

**対応方針:** Phase 12.5D で実装予定。

---

## I6: 500m fallback での food 検索は実行されない

**状況:** food-related の場合、200m での food+general 両方が0件の場合は general 500m のみ fallback を実行する。food 500m は実行されない。

**理由:** コスト削減のため。500m 以上の距離では飲食店特定の精度が下がるため、general で取得した候補をユーザーに選ばせる方が妥当。
