# UI-26 memoryDate 実装 — 設計メモ

## 1. データ型: Timestamp（Firestore）→ Date（UI）

**NoteDoc.memoryDate**: `Timestamp | null | undefined`（Firestore との互換性）
**NoteEditDraft.memoryDate**: `Date | null`（UI での扱いやすさ）
**useCreateNote.memoryDate**: `Date`（常に値あり。初期値: 今日）

変換:
- `noteToInitialDraft`: `note.memoryDate?.toDate() ?? note.createdAt?.toDate() ?? null`
- `saveDraft` / `createNote`: `Timestamp.fromDate(date)` で変換

理由: Timestamp は UI 操作（addDays 等）がしにくい。UI 層は Date を扱い、Firestore 書き込み時のみ Timestamp に変換する。

## 2. 日付優先順位: memoryDate > createdAt > updatedAt

`noteDate.ts` の `getMemoryDate(note)` で統一処理。

```ts
note.memoryDate?.toDate() ?? note.createdAt?.toDate() ?? note.updatedAt?.toDate() ?? null
```

既存ノートは `memoryDate` がない → `createdAt` を使用。動作は UI-26 前と同じ。

## 3. Date Selector UI

既存パッケージのみで実装。外部ライブラリなし（package.json 変更なし）。

**方式**: 左矢印 (‹) / 日付ラベル / 右矢印 (›) の横3列 + 「今日に設定」リンク

デザイン:
- `surfaceIvory` 背景、`border` ボーダー
- ‹ / › ボタンで ±1 日
- 「今日に設定」で今日の深夜0時に設定

Create と OverviewPanel で同じ UI を使用（コードは重複するが、共通コンポーネント化するより最小実装を優先）。

将来的には `MemoryDatePicker` コンポーネントとして抽出し、本格的な日付ピッカーに差し替えやすい構造。

## 4. isDirty 比較: Date.getTime()

```ts
(draft.memoryDate?.getTime() ?? null) !== (original.memoryDate?.getTime() ?? null)
```

理由: `Date` オブジェクトは参照比較では等しくならないため `getTime()` でミリ秒値を比較。

## 5. useCreateNote の初期値

```ts
const today = new Date();
today.setHours(0, 0, 0, 0);  // 深夜0時
```

理由: 日付選択は「日」単位なので、時刻情報を含まない方が直感的。toLocalDateKey でも一貫した YYYY-MM-DD キーを生成できる。

## 6. Firestore Rules 変更不要

`memory_notes` の update rule は:
- `ownerId` が変更されていない
- `members` が変更されていない

の2条件のみ。フィールドの追加制限はない。
`memoryDate` を追加した updateDoc 呼び出しはルールを満たす。

## 7. OverviewPanel の初期表示

```
draft.memoryDate ? formatDateLabel(draft.memoryDate) : (dateStr ? `📅 ${dateStr}` : '—')
```

`draft.memoryDate` は `noteToInitialDraft` で `createdAt` から初期化されるため、通常は必ず値がある。
ただし既存ノートで createdAt も null の場合に `dateStr` (旧 createdAt 表示) → `—` の順でフォールバック。

## 8. Calendar での toLocalDateKey 重複排除

以前は `calendar.tsx` に inline で定義していた `toLocalDateKey` を `noteDate.ts` に移動し import に統一。
`calendar.tsx` 内の `toLocalDateKey` 呼び出し（selectedDateKey / todayKey）も同じ関数を使用するため一貫性が保たれる。
