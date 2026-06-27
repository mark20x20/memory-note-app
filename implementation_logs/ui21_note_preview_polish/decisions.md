# UI-21 Note Detail / Preview Screen Polish — 設計メモ

## 主要変更点

### 1. ScreenHeader → カスタムヘッダー

**旧実装**: `ScreenHeader` (空タイトル + rightElement で編集ボタン)
**新実装**: インラインカスタムヘッダー (back + edit ボタン)

- 背景: `colors.surface` / ボーダー: `colors.border`
- 戻るボタン: ivory ラウンドボタン (40×40)
- 編集ボタン: `colors.primaryLight` 背景 + coral テキスト
- Loading / Error 時も同じ `MinimalHeader` コンポーネントを使用
- `ScreenHeader` import を削除（不要になった）

理由: ScreenHeader は bottom border がありウォーム感が出にくい。他画面（Create / Onboarding）と統一したカスタムヘッダーにした。

### 2. ヒーロー写真: 360px → 300px

**旧**: `heroImage.height: 360`
**新**: `heroImage.height: 300`

理由: 仕様書「hero photo height: 320 to 360」の下限近辺に調整。スクロールせずに Meta / Quick Actions が見えるようにした。

### 3. photo placeholder を warmに

**旧**: 📷 emoji + "写真がまだありません"（opacity: 0.3の絵文字）
**新**: ivory 背景の角丸フレーム内に 📷 emoji + ヒントテキスト（編集誘導）

### 4. Place summary chip を Meta に追加

`note.visitedPlacesSummary?.topPlaceLabels?.[0]` を 📍 chip として表示。
- 背景: `colors.mapAccentLight` (teal light)
- テキスト: `colors.mapAccent`
- 最大幅: 180px (numberOfLines=1)

### 5. Quick Actions をセクション3に移動（Meta 直後）

**旧**: スクロール最下部（流れ・地図・メモ・AI日記の後）
**新**: Meta セクション直後（スクロール不要で即アクセス）

内容（上から）:
- ✏️ 編集する（canEdit の場合のみ）
- 🗺 地図で見る
- ↗ 共有カードを作成
- UI-16B ルールの メンバー / メンバーと共有する

既存の `handleConvertToShared`（Alert → members.tsx 遷移）は変更なし。

### 6. Photo Strip を独立セクションへ

**旧**: `heroContainer` 内に埋め込み（最大5枚 + overflow ボタン）
**新**: 独立した横スクロールセクション（全写真、initialIndex 正確に渡す）

- thumbnail size: 88×88px（変更なし）
- 全写真を表示（旧は slice(1,5) の4枚のみ）
- 各 tap → `viewer?initialIndex=${idx}`（idx は notePhotos 配列の正確なインデックス）

### 7. AI日記の全状態表示

**旧**: `completed || edited` のみ表示（それ以外は非表示）
**新**: 4つの状態を全て表示

| 状態 | 表示 |
|---|---|
| `generating` | ActivityIndicator + 「AI日記を生成中です...」 |
| `completed / edited` | AI日記テキスト（contentCard） |
| `failed` | 「AI日記の生成に失敗しました」+ 編集画面リトライ hint |
| `null / idle` | 「AI日記はまだ作成されていません」+ 編集画面hint |

AI再生成ボタンは出さない（UI-7 / UI-11 方針を維持）。

### 8. Memo の空状態

**旧**: `note.memo` が null/空の場合は非表示
**新**: 「まだメモはありません」+ 編集誘導 hint（canEdit の場合のみ）

### 9. CTA 文言変更

**旧**: 「編集する」
**新**: 「このノートを編集する」

## 変更しなかったもの

- `useNoteDetail` / `useNotePhotos` / `usePlaceGroups` (hooks) — 変更なし
- `VisitTimelineSection` コンポーネント — props 変更なし
- `EventMapPreview` コンポーネント — props 変更なし
- `handleConvertToShared` ロジック — UI-16B 維持
- `canEdit` / `isOwner` 判定ロジック — 変更なし
- `notes/[noteId]/index.tsx` redirect — 変更なし

## 共有UX (UI-16B) の維持確認

| 条件 | 表示 | 動作 |
|---|---|---|
| `noteType === 'shared'` | 「メンバー」 | members.tsx へ push |
| `noteType === 'personal'` + isOwner | 「メンバーと共有する」 | Alert → members.tsx（noteType 変更なし） |
| `noteType === 'personal'` + not owner | 非表示 | — |
