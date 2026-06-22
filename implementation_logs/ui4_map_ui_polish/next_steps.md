# UI-4 Next Steps

## 完了確認チェックリスト

- [x] map.tsx が memory-led な UI に整理（Selected Place Card / photo strip / reordered route chips）
- [x] 直線 / 徒歩 / 車 / 公共交通 / 区間別 が壊れていない
- [x] mixed mode が `getNoteRouteSegments({ noteId })` のみを送る（変更なし）
- [x] single mode が valid travelMode のみを送る（変更なし）
- [x] straight mode で routeSegments call しない（変更なし）
- [x] Selected Place Card が表示される（数字バッジ / 場所名 / 時間 / カテゴリ / 確認バッジ）
- [x] 関連写真 Row が表示される（最大8枚、タップ → viewer with placeGroupId）
- [x] failed route が直線 fallback と分かる表示（"この区間はルートを取得できませんでした"）
- [x] Flow Detail の viewer 遷移に placeGroupId が渡る（hero + strip の両方）
- [x] console.warn を `__DEV__` 限定に
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## 次フェーズ候補

### UI-5: Map Camera Animation / Photo-to-Pin 連動

- ピンタップ時に MapView.animateToRegion でカメラを移動
- `mapRef = useRef<MapView>(null)` を map.tsx に追加

### UI-6: eventMemo 編集 UI (flows/[placeGroupId].tsx)

- places/[placeGroupId].tsx から削除された eventMemo 編集を flow detail に追加
- `updatePlaceGroupManuallyCallable` で保存

### UI-7: index.tsx / preview.tsx 統合

- index.tsx を廃止または縮小する判断
- preview.tsx をデフォルト閲覧画面に昇格

### UI-8: photoPreviewURLs fallback 時の viewer 整合

- `group.photoIds` がない場合の photo strip tap 挙動を改善
- placeGroupId を渡さずに all photos viewer を開くか、そもそもタップ無効にするか判断
