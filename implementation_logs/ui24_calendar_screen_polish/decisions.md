# UI-24 Calendar Screen Polish — 設計メモ

## 主要設計決定

### 1. カレンダーはカスタムグリッド（外部ライブラリなし）

理由:
- `package.json` を変更しないという制約
- 思い出ノートアプリに必要な機能は「月グリッド表示 + 日付選択 + dot indicator」のみ
- スケジュール機能（ドラッグ・複数日選択・イベント時間軸）は不要

実装:
- `getMonthMeta(year, month)` で最初の曜日インデックスと日数を計算
- cells 配列 = `[...null × firstDay, 1, 2, ..., daysInMonth]` + 7の倍数に末尾補完
- 週ごとに分割してレンダリング

### 2. 日付キーに `note.createdAt` を使用

`NoteDoc` に `memoryDate` / `visitDate` / `noteDate` などの「思い出日付」フィールドが存在しない。
`createdAt` が唯一の日付フィールドのため、これを使用。

日付キー形式: `YYYY-MM-DD`（ローカルタイムで生成）

```typescript
function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
```

UTC vs ローカル: `Timestamp.toDate()` はローカルタイムで解釈されるため一貫。

### 3. ヘッダー構成

カスタムヘッダー（UI-21〜23 と同一パターン）:
- 左: ivory ラウンド戻るボタン (40×40)
- 中央: "カレンダー" + "日付から思い出を振り返る"
- 右: "今日" ボタン（primaryLight 背景、クリックで today に戻る）

「今日」ボタンを右に配置することで、プレビュー/編集の "プレビュー" ボタンと同じ位置に action を置く統一感。

### 4. ノートドット indicator

ドット仕様:
- 4px 丸、`colors.primary` (coral)、opacity 0.7
- ノートが2件以上の日は2つのドットを横並びで表示
- 選択日（coral background）では白ドット

spec に "soft coral dot" と指定されており、teal より coral の方が適切と判断。
（teal は場所/マップ系のアクセントとして使用しているため）

### 5. NoteCard デザイン

Home の NoteCard と同じ要素を使用:
- coverPhotoURL → 140px 高さ cover image
- 写真なし → 100px ivory placeholder + 📷 emoji
- 右上に共有バッジ (teal)
- 下部に title / place chip / photo count

高さを Home (180px) より低め (140px) にしたのは、カレンダー画面では複数カードが縦並びになる可能性があるため。

### 6. 空状態

日付選択後の空状態 (`EmptyDayState`):
- 今日選択: "まだ今日の思い出はありません"
- それ以外: "この日の思い出はまだありません"
- 説明: "別の日を選ぶか、新しい思い出を作れます"
- CTA: "📷　思い出ノートを作る" → `/(app)/create`

spec の推奨文言 "この日にはまだ思い出がありません" / "別の日を選ぶか、新しい思い出を作れます" を採用。

### 7. データソース

`useMemoryNotesList()` をそのまま使用。
- owner + member 両方のノートを取得（Phase 11 の shared note 対応維持）
- `useMemo` で `notes → Map<dateKey, NoteDoc[]>` に変換
- 選択日の dateKey で O(1) 検索

新しい Firestore クエリは追加しない。

## 変更しなかったもの

- `useMemoryNotesList` — 変更なし
- `NoteDoc` 型 — 変更なし
- Home / Preview / Edit / Settings 画面 — 変更なし
- BottomTab navigation（既存の _layout.tsx）— 変更なし
