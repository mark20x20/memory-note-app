# UI-24 Calendar Screen Polish — 次のステップ

## 完了した画面

- Onboarding ✓ (UI-18)
- Home ✓ (UI-19)
- Create ✓ (UI-20)
- Preview ✓ (UI-21)
- Edit ✓ (UI-22)
- Settings ✓ (UI-23)
- Calendar ✓ (UI-24)

## 機能改善候補

### memoryDate フィールド追加（優先度: 高）
- `NoteDoc` に `memoryDate: Timestamp | null` を追加
- Create 画面でユーザーが「思い出の日付」を選択できるようにする
- Calendar は `memoryDate ?? createdAt` の優先順で使用
- Firestore Rules / indexes の更新も必要

### 月単位 Firestore クエリ（優先度: 中）
- 現在は全ノートを取得して client-side grouping
- `where('createdAt', '>=', monthStart).where('createdAt', '<', nextMonthStart)` で絞り込み
- インデックス: `createdAt` on `memory_notes` collection

### On This Day セクション（優先度: 低）
- 同じ月日の過去ノートを表示（例: 「1年前の今日」）
- spec の「Optional Month Reflection Block」に相当
- 実装はシンプルな filter で可能

## 次のポリッシュ候補

### UI-25: Map Screen Polish
- `app/(app)/notes/[noteId]/map.tsx` の warm 化
- EventMapPreview の photo 統合

### UI-26: Share Card Screen Polish
- share card 画面の最終仕上げ

### UI-27: Flow Detail / Place Detail Polish
- `flows/[groupId]` / `places/[groupId]` 画面の warm 化
