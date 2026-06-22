# UI-0 Design Foundation Audit — Issues

## Resolved

None (audit-only phase).

## Open

### Issue 1: `preview.tsx` が存在しない
- **Severity**: Critical
- **Symptom**: `app/(app)/notes/[noteId]/preview.tsx` ファイルが存在しない。UI仕様では Preview が主要な閲覧サーフェスとして定義されているが、実装がない。
- **Impact**: UI-1で新規作成が必要
- **Risk**: `index.tsx` (現在の primary) との役割分担を明確にしないと重複が生じる

### Issue 2: `edit.tsx` がフラットフォーム (タブなし)
- **Severity**: High
- **Symptom**: 現在の edit.tsx は title/memo/noteType/aiDiary/flow-recreation のフラットフォーム。UI仕様の5タブ構成 (Overview/Photos/Flows/Places/Memo) とは大きく異なる。
- **Impact**: UI-1でシェルリファクタ、UI-2でデータバインディングが必要
- **Risk**: 既存機能 (flow-recreation, AI diary生成) の移植先タブ選定が必要

### Issue 3: `Card.tsx` の borderRadius が 12 でスペック外
- **Severity**: Medium
- **Symptom**: `Card.tsx` は `borderRadius: 12` をハードコードしている。スペックは主要カード 20-24、既存テーマも xl=20。
- **Impact**: UI-1で Card.tsx の radius を修正するか、SectionCard などの別コンポーネントを用意する
- **Risk**: Card を使っている画面に見た目の変化が生じる (テストで確認が必要)

### Issue 4: タイポグラフィスケールの不一致
- **Severity**: Medium
- **Symptom**: code typography は 32/26/20/17/16/14/13/12 のスケール。spec は 28/24/20/18/15/14/13/12/11 を要求。4サイズ欠落 (display/screenTitle/cardTitle/micro)、body が 16 vs 15 でずれている。
- **Impact**: UI-1 で AppText を拡張する
- **Risk**: 既存の h1/h2/h4 を削除すると既存画面が壊れる → 追加のみ行う

### Issue 5: borderRadius.xxl (24) が未定義
- **Severity**: Low
- **Symptom**: spec の `radius.cardLarge = 24` に対応するトークンが spacing.ts にない。xl=20, full=9999 はあるが 24 がない。
- **Impact**: UI-1 で `borderRadius.xxl = 24` を追加する
- **Risk**: 低い (新規追加のみ)

### Issue 6: 共通 TabBar / StickyBottomBar コンポーネントが未実装
- **Severity**: High (UI-1ブロッカー)
- **Symptom**: `src/shared/components/ui/` に EditTabBar / StickyBottomBar が存在しない
- **Impact**: UI-1 の edit.tsx タブシェル実装ができない
- **Risk**: 各画面が独自実装 → UI-2以降で重複が生じる可能性がある

### Issue 7: `index.tsx` と `preview.tsx` の役割重複リスク
- **Severity**: Medium
- **Symptom**: index.tsx が現在 "主要な閲覧画面" として機能している。preview.tsx を追加すると2画面が同じデータを表示する重複リスクがある。
- **Impact**: UI-7 Integration QA で統合/リダイレクト方針を決定する
- **Risk**: ユーザーが index.tsx と preview.tsx のどちらに遷移するか混乱する可能性

### Issue 8: `AppIcon` / `IconButton` 共通コンポーネントが未実装
- **Severity**: Low (現状は各スクリーンが直接 Ionicons 等を使っている)
- **Symptom**: アイコン呼び出しが各画面に散在している
- **Impact**: UI-2以降で統一ラッパーを作る
- **Risk**: 低い (既存動作に影響しない)

### Issue 9: Calendar スクリーンが未実装
- **Severity**: Low (UI-5 スコープ)
- **Symptom**: `app/(app)/calendar.tsx` またはそれに相当するファイルが存在しない
- **Impact**: UI-5 Supporting Screens で実装
- **Risk**: ボトムナビゲーションにカレンダータブが出ていない可能性

### Issue 10: `useNoteEditDraft` フックが未実装
- **Severity**: High (UI-2ブロッカー)
- **Symptom**: Edit画面の中央集権的なドラフト状態管理フックが存在しない
- **Impact**: UI-1ではシェルのみ、UI-2でデータバインディング時に実装
- **Risk**: 5タブ間での unsaved changes 管理が複雑になる可能性

### Issue 11: `onboarding.tsx` がUI仕様の新デザインに未対応
- **Severity**: Low (UI-5 スコープ)
- **Symptom**: `app/(auth)/onboarding.tsx` は存在するが、新UI仕様のウォームなデザイン・3ステップストーリー構成には対応していない
- **Impact**: UI-5 で再デザイン
- **Risk**: 既存ユーザーへの影響は低い (新規ユーザーのみ通る画面)
