# UI-8 Next Steps

## 完了確認チェックリスト

- [x] viewer.tsx の placeGroupId / initialIndex 挙動を確認
- [x] `canOpenGroupedPhotoViewer` ヘルパー作成
- [x] flows/[placeGroupId].tsx: hero photo に `hasGroupPhotoIds` 条件分岐追加
- [x] flows/[placeGroupId].tsx: strip photos に `hasGroupPhotoIds` 条件分岐追加
- [x] flows/[placeGroupId].tsx: fallback style `stripThumbFallback` (opacity: 0.75) 追加
- [x] map.tsx: photo strip に `canViewGroupPhotos` 条件分岐追加
- [x] map.tsx: fallback style `photoThumbFallback` (opacity: 0.75) 追加
- [x] places/[placeGroupId].tsx: 変更不要 (既に Image のみ) を確認
- [x] preview.tsx: 変更不要 (placeGroupId を渡していない) を確認
- [x] viewer.tsx: 変更不要 (呼び出し側で解決) を確認
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## 次フェーズ候補

### UI-9: AI日記再生成を preview.tsx に追加

- preview の AI日記セクションに「再生成」ボタンを追加
- 条件: `canGenerateAiDiary(note, uid) === true`
- AiDiarySection コンポーネントを preview に移植またはインライン実装

### UI-10: places/[placeGroupId].tsx の photo strip に viewer 遷移追加

- 現在は `<Image>` のみ
- `canOpenGroupedPhotoViewer(group)` を使って条件付きで viewer を開く
- group.photoIds が必要

### UI-11: viewer.tsx の fallback URL 対応

- photoPreviewURLs のみの写真でも viewer を開けるようにする
- viewer が URL 配列を受け取れるよう拡張
- PhotoDoc が存在しない場合のフォールバック表示
