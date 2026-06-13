# Phase 12.5E-2 Places UI Polish — Build Log

## 日時
2026-06-13

## ステータス
完了（Firebase deploy 未実施）

---

## 作成ファイル一覧

| ファイル | 内容 |
|---|---|
| `implementation_logs/phase12_5e2_places_ui_polish/build_log.md` | 本ファイル |
| `implementation_logs/phase12_5e2_places_ui_polish/decisions.md` | 設計決定事項 |
| `implementation_logs/phase12_5e2_places_ui_polish/issues.md` | 既知の課題 |
| `implementation_logs/phase12_5e2_places_ui_polish/next_steps.md` | 次のステップ |

---

## 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/features/placeIntelligence/components/VisitedPlacesSection.tsx` | 「候補を再取得」ボタンを `__DEV__` 限定に変更。カードタップ全体ではなく「候補を確認・変更」明示ボタンに変更。カテゴリタグ表示追加。 |
| `app/(app)/notes/[noteId]/places/index.tsx` | PlaceGroupカードにカテゴリタグ表示追加。「候補を確認・変更」明示ボタン追加。「手動で場所を追加」ボタン削除。viewer 向け「詳細を見る」ボタン追加。 |
| `app/(app)/notes/[noteId]/places/[placeGroupId].tsx` | 手動入力バナーを上部に移動。候補番号 (#1, #2, ...) 追加。カテゴリタグ表示追加。カテゴリフィルタチップ（横スクロール）追加。priority/other 分類を廃止し distanceMeters 昇順で統一表示。 |
| `app/(app)/notes/[noteId]/places/manual.tsx` | コメント更新のみ（遷移元限定の注意書き追加）。 |

---

## 削除ファイル一覧

なし

---

## 変更差分サマリー

### `VisitedPlacesSection.tsx`

- 「候補を再取得」ボタン: 本番 UI から削除 → `__DEV__` のみ表示（破線ボーダーのサブボタン）
- グループカードの変更:
  - `TouchableOpacity` 全体タップ → `View` + 内部に「候補を確認・変更」ボタン
  - カテゴリタグ（teal ライトバックグラウンド）を追加
  - 写真枚数を metaText として表示
- `descText` （「近くの施設候補です...」）を削除（カードが情報を保持するため不要に）

### `places/index.tsx`

- グループカードの変更:
  - `TouchableOpacity` 全体タップ → `View` + 明示ボタン
  - カテゴリタグ追加
  - owner/editor: 「候補を確認・変更」ボタン
  - viewer + 確認済み: 「詳細を見る」ボタン
  - viewer + 未確認: ボタンなし（閲覧のみ）
- 「手動で場所を追加」ボタン削除（placeGroupId なしでは保存不可のため）

### `places/[placeGroupId].tsx`

- 手動入力の位置: 候補リスト最下部 → 画面上部のバナーへ移動
  - 「候補にない場合 / 正しい場所がなければ、場所名を手動で入力できます。/ [手動で入力]」
- カテゴリフィルタ: 横スクロール ScrollView でフィルタチップを表示
  - 候補が0件のカテゴリは非表示
  - フィルタ後0件: 「このカテゴリの候補はありません」
- 候補番号: 元の candidates 配列（distanceMeters 昇順）での index + 1
- 候補カードの変更:
  - 左端に丸バッジで `#N` 表示（選択中は teal 塗りつぶし）
  - カテゴリタグ（ivory バックグラウンド）追加
  - priority / other 分類廃止: candidates を distanceMeters 昇順で一覧表示
- 選択ボタン: 若干サイズを縮小（minWidth 64→60, font 13→12）

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
