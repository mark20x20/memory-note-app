# Phase 12.5G-2 Issues

## 候補地図が多すぎる場合の見づらさ

1つの PlaceGroup に最大20件の候補があるため、小さい候補地図に20個のピンが重なる可能性がある。
現状は distanceMeters 昇順（近い順）で最大20件表示しているが、
地図上では密集して見づらくなる場合がある。
対策案: 候補地図では距離 500m 以内の候補に絞るか、上位5件に表示を制限する。
今回は候補の表示上限を変えていないため、次フェーズで調整する。

## photoPreviewURLsは最大3枚のみ

Cloud Functions での写真収集は最大3枚に絞っている（MAX_PREVIEW_URLS = 3）。
photoPreviewURLs は配列として Firestore に保存されるため、
多数の写真があってもリクエストサイズ・読み取りコストは3枚相当に抑えられる。
4枚目以降の写真サムネイルは Photos サブコレクションから取得する必要がある（未実装）。

## 分割しきい値の最適値は未確定

compact (30min/50m)、standard (90min/80m)、relaxed (180min/120m) は暫定値。
実機テストで「細かくしすぎる」「まとまりすぎる」が発生する場合は数値を調整する。
`placeUtils.ts` の DEFAULT 値または `placeFunctionsClient.ts` の GROUPING_PRESETS を変更する。

## 既存ノートはforceRefreshが必要

Phase 12.5G-2 より前に作成された PlaceGroup には `photoPreviewURLs` がない。
新しい分割しきい値（プリセット選択）も反映されない。
`forceRefresh=true` で再推定することで更新される。
UI 上は「写真から場所を推定」ボタンが forceRefresh なしで呼ぶため、
キャッシュ有効期間（24h）内は変わらない点に注意。

## viewer 直URL制御

viewer が未確認の候補 URL に直接アクセスした場合の制御は現状候補確認画面側で
行っていない（`canEdit` が false でも表示は可能）。
候補地図・候補リストは閲覧できるが「選択」ボタンは非表示。
これは既存の設計と同じ動作であり、今回変更なし。
