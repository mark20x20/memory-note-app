# Phase 12.5E Places UI / User Confirmation — Build Log

## 日時
2026-06-13

## ステータス
完了（Firebase deploy 未実施）

---

## 作成ファイル一覧

| ファイル | 内容 |
|---|---|
| `src/features/placeIntelligence/components/VisitedPlacesSection.tsx` | Detail画面に埋め込む「訪れた場所」セクション |
| `app/(app)/notes/[noteId]/places/index.tsx` | 訪れた場所一覧画面 |
| `app/(app)/notes/[noteId]/places/[placeGroupId].tsx` | 場所候補確認画面 |
| `app/(app)/notes/[noteId]/places/manual.tsx` | 手動場所入力画面 |
| `implementation_logs/phase12_5e_places_ui_confirmation/build_log.md` | 本ファイル |
| `implementation_logs/phase12_5e_places_ui_confirmation/decisions.md` | 設計決定事項 |
| `implementation_logs/phase12_5e_places_ui_confirmation/issues.md` | 既知の課題 |
| `implementation_logs/phase12_5e_places_ui_confirmation/next_steps.md` | 次のステップ |

---

## 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `app/(app)/notes/[noteId]/index.tsx` | `VisitedPlacesSection` のインポートと挿入（地図セクション直後・AI日記セクション直前） |

---

## 削除ファイル一覧

なし

---

## 変更差分サマリー

### `app/(app)/notes/[noteId]/index.tsx`

```diff
+ import { VisitedPlacesSection } from '@/features/placeIntelligence/components/VisitedPlacesSection';

  ...

+ {/* ── 訪れた場所セクション（Phase 12.5E 実装） ── */}
+ <VisitedPlacesSection
+   noteId={noteId}
+   note={note}
+   canEdit={!!userCanEdit}
+ />

  {/* ── AI日記セクション */}
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>AI日記</Text>
    ...
```

### `VisitedPlacesSection.tsx`

- `placeEnrichmentStatus` の値に応じて idle / fetching / completed / failed の4状態を表示
- `placeGroupRepository.subscribePlaceGroupsByNoteId` でリアルタイム監視
- `enrichNotePlacesCallable` で場所推定を呼び出す
- 上位3件の PlaceGroup カードを表示（`userConfirmed` に応じた確認済み/要確認バッジ）
- owner/editor のみ「場所を推定する」「候補を再取得」ボタンを表示
- 「すべて見る」リンクで places一覧画面へ遷移

### `places/index.tsx`（訪れた場所一覧）

- `subscribePlaceGroupsByNoteId` でリアルタイム監視
- owner/editor: 「写真から場所を推定」ボタン・「候補を確認」リンク・「手動で場所を追加」ボタン
- viewer: 確認済み場所のみ遷移可能（未確認グループの候補操作不可）
- 空状態・ローディング状態を表示

### `places/[placeGroupId].tsx`（候補確認）

- `getPlaceGroupById` + `getPlaceCandidatesByGroupId` で初回取得
- 候補を「訪問候補」（restaurant/cafe/tourist_attraction等）と「その他の近隣」に分類して表示
- `selectPlaceCandidateCallable` で候補を確定（userConfirmed=true に更新）
- 選択中の候補に「選択中」バッジ表示
- owner/editor のみ選択ボタンを表示
- 「候補にない場所を手動で入力」で manual 画面へ遷移

### `places/manual.tsx`（手動入力）

- 場所名テキスト入力（最大100文字）
- カテゴリ選択チップ（10種類）
- `updatePlaceGroupManuallyCallable` で保存（userConfirmed=true に更新）
- `placeGroupId` は URL クエリパラメータで受け取る

---

## ビルド・チェック結果

### Root TypeScript チェック
```
npx tsc --noEmit
Exit 0（エラーなし）
```

### Expo Lint チェック
```
npx expo lint
Exit 0（エラー 0件、警告は pre-existing のみ）
```

### Functions build
Cloud Functions は変更なし。ビルド不要。

---

## Firebase deploy

実施していない（ユーザーが実施）。
