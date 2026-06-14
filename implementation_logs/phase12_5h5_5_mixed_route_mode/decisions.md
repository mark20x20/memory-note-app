# Phase 12.5H-5.5 Decisions

## 区間別モードを追加する理由

実際の旅行・移動記録では、全区間が同じ移動手段とは限らない。
例: #1→#2 は車、#2→#3 は徒歩 のような混在ルートを記録したい需要がある。
Phase 12.5H-5 で walking/driving のインフラが動作確認できたので、
次のステップとして区間ごとの移動手段選択を実装する。

## 全体モードを残す理由

「全区間を同じ移動手段で」というユースケースも引き続き多い。
全体モードを廃止すると既存ユーザーの UX が壊れる。
チップを `[直線][徒歩][車][区間別][公共交通]` とすることで、
区間別モードは追加オプションとして共存する。

## segmentTravelModes を GenerateNoteRoutesInput に追加する理由

Cloud Functions 側でルートを生成するため、どの区間に何のモードを使うかを
サーバーに伝える必要がある。
既存の `travelMode` フィールドをオプショナルにし、
`segmentTravelModes?: SegmentTravelModeInput[]` を追加する方式なら
既存の全体モード呼び出しを変更せずに区間別モードに対応できる。

## transit を disabled 表示にする理由

- Google Routes API の TRANSIT モードは Phase 12.5H-6 で実装予定
- ただし UI 上は存在を示す（将来対応することをユーザーが把握できる）
- 選択した場合は Functions 側でスキップ（throw しない）
- UI 上は `disabled` 表示＋"次フェーズ対応予定" メモを表示

## 未生成区間を直線 fallback にする理由

- ルート生成前や生成失敗時に地図が何も表示されないと UX が悪い
- 区間別モードでは per-pair フォールバックとして gray dashed 直線を表示
- どの区間のルートが取得できていないかを視覚的に把握できる

## RouteSegmentSummary に travelMode を追加する理由

区間別モードでは、Firestore から取得した全セグメントを
「各区間の選択モードに一致するもの」でフィルタして表示する必要がある。
そのため、セグメントの travelMode をクライアントに返す必要がある。

## getNoteRouteSegments で travelMode 省略時に全件返す設計を採用した理由

区間別モードでは walking と driving の両方のセグメントが混在している。
travelMode フィルタなしで全件取得することで、
クライアント側で選択モードに一致するセグメントを効率的にフィルタできる。
