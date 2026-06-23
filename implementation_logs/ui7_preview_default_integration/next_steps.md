# UI-7 Next Steps

## 完了確認チェックリスト

- [x] index.tsx と preview.tsx の機能差分が整理されている
- [x] index.tsx が `<Redirect>` に置き換わっている
- [x] `canManageMembers` が preview.tsx にインポートされている
- [x] `userCanManageMembers` が preview.tsx で計算されている
- [x] 地図導線 (→ map.tsx) が preview.tsx に追加されている
- [x] 共有カード導線 (→ share.tsx) が preview.tsx に追加されている
- [x] メンバー導線 (→ members.tsx) が preview.tsx に追加されている
- [x] メンバー導線は `note.noteType === 'shared' || userCanManageMembers` 条件付き
- [x] 既存の「編集する」CTA は変更なし
- [x] home.tsx / create/index.tsx は変更なし (index redirect で自動誘導)
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## 次フェーズ候補

### UI-8: photoPreviewURLs フォールバック時の viewer 整合

- photo strip で photoIds がない場合に placeGroupId を viewer に渡さない
- または viewer 側で photoPreviewURLs にも対応する

### UI-9: AI日記再生成を preview.tsx に追加

- preview の AI日記セクションに「再生成」ボタンを追加
- 条件: `canGenerateAiDiary(note, uid) === true`
- AiDiarySection コンポーネントを preview に移植またはインライン実装

### UI-10: create 完了後の遷移確認

- `create/index.tsx` → `router.replace(/(app)/notes/${noteId})` の history 挙動を実機確認
- 問題があれば create 側を `/preview` に直接変更する
