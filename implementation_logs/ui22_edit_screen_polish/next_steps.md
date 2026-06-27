# UI-22 Edit Screen Polish — 次のステップ

## 完了した画面

- Onboarding ✓ (UI-18)
- Home ✓ (UI-19)
- Create ✓ (UI-20)
- Preview ✓ (UI-21)
- Edit ✓ (UI-22)

## 次のポリッシュ候補

### UI-23: Settings Screen Polish
- `app/(app)/settings.tsx` の warm デザイン統一
- プロフィール表示、通知設定、ログアウトの warm 化

### UI-23: Members Screen Polish
- `app/(app)/notes/[noteId]/members.tsx` のメンバー招待 UX 改善
- 招待状態（pending / accepted）の warm な表示

### FlowsPanel / PlacesPanel の空状態分岐（優先度: 中）
- `note.placeEnrichmentStatus` を使って「処理待ち」「処理完了0件」を区別
- 処理完了0件の場合は「フロー作成」導線を表示

### MemoPanel minor polish（優先度: 低）
- AI日記セクションの背景色・境界線を他パネルと統一
- generate/regenerate ボタンの warm スタイル調整
