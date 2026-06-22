# UI-3B Next Steps

## 完了確認チェックリスト

- [x] preview.tsx が実データで表示される (hero / title / date / timeline / map / memo / aiDiary)
- [x] VisitTimelineSection が preview で canEdit=false で正しく表示
- [x] EventMapPreview が preview で正しく表示（photoLocations フォールバック付き）
- [x] getPhotoLocationsFromPhotos が正しく使われている
- [x] preview → edit 導線確認 (header "編集" + 下部 CTA)
- [x] edit → preview 導線確認 (edit.tsx header "プレビュー" ボタン)
- [x] preview → map 導線確認 (EventMapPreview の "地図で見る")
- [x] preview → photo viewer 導線確認 (hero tap + thumbnail strip tap)
- [x] flow detail → place detail 導線確認 ("場所を確認・編集" + header ボタン)
- [x] place detail → manual correction 導線確認 ("手動で修正")
- [x] place detail → map 導線確認 ("地図で確認" → map.tsx 存在確認済み)
- [x] index.tsx と preview.tsx の役割重複をログに整理
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## UI-7 向け (index.tsx / preview.tsx 統合)

**判断すべきこと:**
1. どちらをデフォルト閲覧画面にするか
   → 推奨: `preview.tsx`（感情的閲覧、hero photo 360h、編集 CTA が自然）
2. `index.tsx` を廃止するか、用途を絞るか
   → `index.tsx` は管理機能（メンバー管理、AI再生成）を含むため、完全廃止は難しい
   → 統合案: `preview.tsx` に AI再生成ボタンを追加し、`index.tsx` を廃止
3. ルート `/(app)/notes/[noteId]` のデフォルト画面をどちらにするか
   → 現状: `index.tsx`。UI-7 以降で `preview.tsx` に切り替えるか検討

---

## 次フェーズ候補

### UI-4: Map 画面ポリッシュ
- map.tsx は Phase 12.5H-7A で実装済み
- Premium ルートモード / 混合モードの UI をプレビュー品質に整える
- Place cards horizontal scroll のタップで flow detail に遷移

### UI-5: Photo Viewer / Flow フィルタリング対応
- flows/[placeGroupId].tsx の hero photo タップ時に `placeGroupId` をビューアーに渡す
- viewer.tsx はすでに `placeGroupId` パラメータに対応済み（機能実装済み、渡し忘れを修正するだけ）

### UI-6: eventMemo 編集 UI
- places/[placeGroupId].tsx から削除された eventMemo 編集を flows/[placeGroupId].tsx に追加
- `updatePlaceGroupManuallyCallable` を呼ぶシンプルな TextInput + 保存ボタン

### UI-7: index.tsx / preview.tsx 統合
- デフォルト閲覧画面を決定
- 必要に応じて AiDiarySection / メンバー管理を preview.tsx に統合
- 廃止する画面のルートを redirect に変換
