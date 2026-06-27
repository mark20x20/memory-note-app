# UI-22 Edit Screen Polish — 設計メモ

## 主要変更点

### 1. ScreenHeader → カスタムヘッダー

**旧実装**: `ScreenHeader title="編集"` + rightElement で "プレビュー" テキストリンク
**新実装**: インラインカスタムヘッダー (back + center title/subtitle + preview ボタン)

- 背景: `colors.surface` / ボーダー: `colors.border`
- 戻るボタン: `colors.surfaceIvory` ラウンドボタン (40×40)
- タイトル: "ノートを編集" (16px, fontWeight 700)
- サブタイトル: "写真・場所・日記を整えましょう" (11px, textSecondary)
- プレビューボタン: `colors.primaryLight` 背景 + `colors.primary` テキスト (pill 形状)
- Loading / Error 時も同じ backButton スタイルの `minimalHeader` を使用
- `ScreenHeader` import を削除（不要になった）

理由: Onboarding / Create / Preview と統一した warm カスタムヘッダー体験にする。

### 2. OverviewPanel Alert テキスト更新（UI-16B）

**handleRequestConvertToShared**:
- 旧: "このノートを共有しますか？" / "共有ノートに変更すると..." / "共有して招待する"
- 新: "メンバーを招待しますか？" / "メンバーを招待すると、このノートが共有ノートになります。" / "招待へ進む"

理由: UI-16B セマンティクスと一致させる。実際には noteType は招待成功時に CF が変更するため、"共有ノートに変更する" という表現は誤解を招く。

**handleRequestConvertToPersonal**:
- 旧: "個人ノートに戻しますか？" / "メンバー全員がアクセスできなくなります。取り消せません。" / "個人に戻す"
- 新: "このノートを自分だけに戻しますか？" / "メンバーはこのノートを見られなくなります。写真やメモは削除されません。" / "自分だけに戻す"

理由: 「取り消せません」という強すぎる表現を緩め、写真・メモが消えないことを明記し不安を軽減。

### 3. PhotosPanel — stale 開発者ヒントの削除

**削除**: `並び替えはUI-3で実装予定です。` テキスト + `reorderHint` スタイル

理由: ユーザー向けの文言ではない。UI-3 は既に実装フェーズを過ぎており、このテキストは残留物。

### 4. FlowsPanel 空状態テキスト

**旧**: "フローがありません" / "写真をアップロードしてから「この日の流れを再作成」してください。"
**新**: "場所と流れを整理中です" / "写真の情報から、その日の流れを作っています。"

理由: 空状態は「ノート作成直後の処理待ち」が主なケース。ユーザーへのアクション要求より処理中を示す warm なメッセージに変更。

### 5. PlacesPanel 空状態テキスト

**旧**: "場所がありません" / "写真からフローを作成すると、場所が自動で抽出されます。"
**新**: "場所を整理中です" / "写真の位置情報から候補を探しています。"

理由: FlowsPanel と同様、処理中の warm な表現に統一。

## 変更しなかったもの

- `useNoteEditDraft` / `useNotePhotos` / `usePlaceGroups` / `useGenerateDiary` / `useManageNoteMembers` — 変更なし
- `EditTabBar` / `StickyBottomBar` — 変更なし
- `handleSave` / `handleRequestShare` / `handleConvertToPersonal` / `handleDelete` ロジック — 変更なし
- `canEdit` / `canDelete` / `canGenerateAiDiary` / `canManageMembers` 判定 — 変更なし
- `MemoPanel` — 既に4状態 (idle/generating/failed/completed) を実装済みで変更不要
- OverviewPanel の共有設定 UI ボタン構造 — UI-16B 維持
