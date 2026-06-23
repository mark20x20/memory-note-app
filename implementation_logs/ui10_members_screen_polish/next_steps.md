# UI-10 Next Steps

## 完了確認チェックリスト

- [x] ヘッダータイトルが "メンバー" になっている
- [x] Note Summary Card が表示される (カバー写真 / タイトル / 日付 / 共有状態 / メンバー数)
- [x] カバー写真がない場合はプレースホルダーが表示される
- [x] Member list が表示される (avatar / name / role badge)
- [x] オーナーのアバターがハイライト (primary border) される
- [x] 「あなた」バッジが表示される
- [x] ROLE_LABELS がすべて日本語 (オーナー / 編集者 / 閲覧者)
- [x] role badge が各メンバーに表示される
- [x] owner は role change / remove ボタンが表示される
- [x] editor/viewer は role change / remove ボタンが非表示
- [x] Invite Card が owner に表示される
- [x] viewer notice が非 owner に表示される (🔒 アイコン付き)
- [x] Role guide セクションが表示される (オーナー / 編集者 / 閲覧者)
- [x] エラーバナーがタップで閉じられる
- [x] existing: addMember / updateRole / removeMember ロジックが維持される
- [x] existing: Alert 確認ダイアログが維持される
- [x] preview.tsx → members.tsx 導線が確認済み
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## 次フェーズ候補

### UI-11: Members ロール変更 UI の改善

- 「閲覧者に / 編集者に」トグルボタン → ActionSheet/BottomSheet セレクタ
- 3段階 (editor → viewer → editor) ではなく明示的な選択に

### UI-12: 退出 (leave) 機能追加

- 非 owner ユーザーが自分でノートから退出できるボタンを追加
- `useManageNoteMembers` に `leaveNote` を追加

### AI日記再生成 / preview.tsx 強化

- canGenerateAiDiary gating で preview に「AI日記を生成」ボタンを追加
- edit.tsx 以外からの AI 再生成パスを設ける

### Share Card mini map

- share card 内に地図位置情報ヒントを追加
- visitedPlacesSummary の topPlaceLabels 座標を MapView で表示
