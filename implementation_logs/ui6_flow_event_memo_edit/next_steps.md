# UI-6 Next Steps

## 完了確認チェックリスト

- [x] `useState` / `useEffect` が React からインポートされている
- [x] `TextInput` が React Native インポートに追加されている
- [x] `updatePlaceGroupManuallyCallable` がインポートされている
- [x] `isEditingMemo` / `memoText` / `isSavingMemo` / `memoSaveError` の4状態が追加されている
- [x] `useEffect` で `group.eventMemo` → `memoText` を同期 (編集中はスキップ)
- [x] `handleSaveMemo` が `updatePlaceGroupManuallyCallable` を呼ぶ
- [x] Section 3 が常時表示 (メモなし時は空状態カード)
- [x] `userCanEdit` 時のみ「編集 / 追加」ボタンが表示される
- [x] TextInput が multiline / maxLength 300 / autoFocus
- [x] 文字数カウンター `{memoText.length} / 300`
- [x] 保存中は ActivityIndicator / ボタン disabled
- [x] エラー時はエラーテキスト表示
- [x] キャンセル時は memoText を group.eventMemo にリセット
- [x] `__DEV__` 限定 warn のみ追加
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## 次フェーズ候補

### UI-7: index.tsx / preview.tsx 統合

- preview.tsx をデフォルト閲覧画面に昇格
- index.tsx の管理機能 (AiDiary / メンバー管理) を preview.tsx に統合またはモーダル化
- /(app)/notes/[noteId] のデフォルトを preview.tsx に切り替え

### UI-8: photoPreviewURLs フォールバック時の viewer 整合

- photo strip で photoIds がない場合に placeGroupId を viewer に渡さない
- または viewer 側で photoPreviewURLs にも対応する
