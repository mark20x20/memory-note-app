# Phase 12.5F-1 Map SDK / Numbered Pins — Build Log

## 日時
2026-06-13

## ステータス
完了（Firebase deploy 未実施）

---

## 導入パッケージ

| パッケージ | バージョン | 導入方法 |
|---|---|---|
| `react-native-maps` | `^1.20.1` | `npm install react-native-maps --legacy-peer-deps` |

※ `npx expo install` は react@19.1.0 との peer dependency 競合で失敗。`--legacy-peer-deps` で回避。

---

## 作成ファイル一覧

| ファイル | 内容 |
|---|---|
| `app/(app)/notes/[noteId]/map.tsx` | 地図画面（react-native-maps MapView + 番号付き Marker + 下部カード + 旅順プレビュー） |
| `implementation_logs/phase12_5f_map_numbered_pins/build_log.md` | 本ファイル |
| `implementation_logs/phase12_5f_map_numbered_pins/decisions.md` | 設計決定事項 |
| `implementation_logs/phase12_5f_map_numbered_pins/issues.md` | 既知の課題 |
| `implementation_logs/phase12_5f_map_numbered_pins/next_steps.md` | 次のステップ |

---

## 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/features/placeIntelligence/components/VisitedPlacesSection.tsx` | completed状態のヘッダーに「地図で見る」リンク追加 |
| `app/(app)/notes/[noteId]/places/index.tsx` | ScreenHeader の rightElement に「地図で見る」ボタン追加 |
| `package.json` | `react-native-maps` 追加 |
| `package-lock.json` | 自動更新 |

---

## 削除ファイル一覧

なし

---

## 変更差分サマリー

### `map.tsx` (新規作成)

- `MapView` + `Marker` で PlaceGroup を表示
- `NumberedMarkerView`: カスタム View マーカー（確認済み=teal塗り / 要確認=白地tealボーダー）
- `calcRegionForGroups`: 全ピンが入る Region を自動計算（padding 30%）
- 下部 ScrollView に：
  - 横スクロール PlaceGroup カード（番号バッジ・カテゴリタグ・確認バッジ・写真枚数・操作テキスト）
  - 旅順プレビュー（縦タイムラインリスト、仮の表示順）
  - 位置情報なし件数の案内
- 空状態: PlaceGroup なし / 位置情報なし の2パターン

### `VisitedPlacesSection.tsx`

- completed状態のヘッダー右側を「地図で見る · すべて見る」に変更
- `sectionHeaderLinks` / `sectionHeaderDivider` スタイル追加

### `places/index.tsx`

- `ScreenHeader` の `rightElement` に「地図で見る」ボタンを追加（groups.length > 0 のとき表示）
- `mapLinkText` スタイル追加

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
