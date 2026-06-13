# Phase 12.5G-1 Issues

## 既存PlaceGroupにはstartAt/endAtがない

Phase 12.5G-1 以前に作成された PlaceGroup には startAt / endAt / sortOrder がない。
- sortOrder がない → 配列 index（Firestore の取得順 = createdAt 昇順）でフォールバック
- startAt がない → 時刻表示なし（null チェックで処理済み）
- coverPhotoURL がない → 既存 null を保持（既存フィールドなので影響なし）

既存ノートを新しいイベント構造にするには `forceRefresh=true` で再推定が必要。

## 撮影時刻がない写真の扱い

takenAt がない写真は createdAt でフォールバックし、
それもない場合は「末尾グループ」に追加される。
結果として撮影時刻なし写真は startAt=null のグループに集まる可能性がある。
この挙動は意図的（時刻不明な写真を強制的に特定の順番に押し込まない）。

## イベント分割しきい値は暫定

- 距離: 80m（商業施設・観光地をカバーするサイズ感）
- 時間: 90分（食事・観光での滞在時間として妥当）

実機テストで「分割されすぎ」「まとまりすぎ」の場合は調整が必要。
`placeUtils.ts` の `EVENT_DISTANCE_THRESHOLD_METERS` / `EVENT_TIME_THRESHOLD_MS` を変更する。

## APIコスト増加の可能性

以前の groupNearbyLocations は「写真枚数が多いグループ優先で最大5件」だったが、
groupPhotosByTimeAndDistance は「時系列先頭から最大5件」になる。
旅行写真が多い場合はグループ数が増え、Places API コールが増える可能性がある。
ログ出力で `eventGroups=N` を確認できる。

## 既存ノートはforceRefreshしないと新しいイベント構造にならない

`enrichNotePlaces({ noteId, forceRefresh: false })` はキャッシュチェックで早期リターンするため、
既存 PlaceGroup が残り続ける。forceRefresh=true を明示的に呼び出すことで再生成される。
ユーザーが Places 画面で「写真から場所を推定」ボタンを押すと forceRefresh なしで呼ばれるため、
既存データがある場合は手動でキャッシュ無効化が必要。
