# UI-5 Next Steps

## 完了確認チェックリスト

- [x] MapView ref が追加されている (`const mapRef = useRef<MapView>(null)`)
- [x] `<MapView ref={mapRef} ...>` で ref が渡されている
- [x] ピンタップで camera が該当 PlaceGroup へ移動する (`selectGroup(group)`)
- [x] タイムラインタップで camera が該当 PlaceGroup へ移動する (`selectGroup(group)`)
- [x] Selected Place Card / Photo Row が選択に合わせて更新される (setSelectedGroupId が内包)
- [x] 初期表示の地図 region が壊れていない (initialRegion は変更なし)
- [x] 安全ガード: mapRef.current / latitude / longitude の null / 0 チェック
- [x] route behavior が変更されていない
- [x] `__DEV__` 限定 log のみ追加 (`[map] animateToSelectedGroup`)
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## 次フェーズ候補

### UI-6: eventMemo 編集 UI (flows/[placeGroupId].tsx)

- places/[placeGroupId].tsx から削除した eventMemo 編集を flow detail に追加
- `updatePlaceGroupManuallyCallable` で保存
- TextInput + 文字数カウント + 保存ボタン

### UI-7: index.tsx / preview.tsx 統合

- preview.tsx をデフォルト閲覧画面に昇格
- index.tsx の管理機能 (AiDiary / メンバー管理) を preview.tsx に統合またはモーダル化
- /(app)/notes/[noteId] のデフォルトを preview.tsx に切り替え

### UI-8: photoPreviewURLs フォールバック時の viewer 整合

- photo strip で photoIds がない場合に placeGroupId を viewer に渡さない
- または viewer 側で photoPreviewURLs にも対応する
