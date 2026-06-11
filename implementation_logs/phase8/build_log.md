# Phase 8 Build Log — Map / Place Grouping

**Date:** 2026-06-12
**Status:** Complete

## 作業内容

### 新規作成ファイル

| ファイル | 概要 |
|---|---|
| `src/features/map/types/index.ts` | 地図用型定義（PhotoLocation, PlaceGroup, MapBounds, NormalizedPoint） |
| `src/features/map/utils/locationUtils.ts` | 位置情報ユーティリティ（抽出・範囲計算・正規化・簡易グルーピング） |
| `src/features/map/components/MapPreview.tsx` | 地図風プレビューコンポーネント（React Native View ベース） |
| `implementation_logs/phase8/build_log.md` | このファイル |
| `implementation_logs/phase8/decisions.md` | 設計決定記録 |
| `implementation_logs/phase8/issues.md` | 既知の問題・制約 |
| `implementation_logs/phase8/next_steps.md` | 次フェーズへの引き継ぎ |

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `app/(app)/notes/[noteId].tsx` | 地図プレースホルダーを MapPreview に置き換え、import 追加 |
| `generated_ui/figma_make/reference_map.md` | SCR-MAP-001, SCR-NOTE-001 ステータス更新 |

### インストールパッケージ

なし（外部地図 SDK 不使用）

## 実装内容詳細

### locationUtils.ts

- `getPhotoLocationsFromPhotos(photos)` — latitude/longitude が null/undefined/NaN の写真を除外
- `getMapBounds(locations)` — 表示範囲計算（1点の場合は SINGLE_POINT_EXTENT=0.005度 の固定幅、端パディング 10%）
- `normalizeLocationToPoint(location, bounds)` — 緯度経度 → 0〜1 正規化（y は北が小さくなるよう反転）
- `groupNearbyLocations(locations)` — 閾値 0.002度（約220m）以内の写真を同グループ化

### MapPreview.tsx

- 位置情報あり: ティール背景（colors.mapAccentLight）+ グリッド線 + ピンバッジ + 枚数バッジ
- 位置情報なし: empty 表示（アイコン + 案内文）
- ピンは PlaceGroup 単位で絶対配置
- 外部 SDK なし、React Native View のみで実装

### [noteId].tsx 変更点

- `getPhotoLocationsFromPhotos` で写真から位置情報を抽出
- 地図プレースホルダーを `<MapPreview locations={photoLocations} height={180} />` に置き換え
- photosLoading 中はローディング表示
- styles から不要な mapPlaceholder 関連スタイルを削除（placeholderCaption は AI 日記セクションで継続使用）

## 確認コマンド結果

```
npx tsc --noEmit  → ユーザー確認待ち
npx expo lint     → ユーザー確認待ち
```

## GPS 符号処理確認

Phase 6/7 では `latitude` / `longitude` を EXIF から抽出して保存済み。
`GPSLatitudeRef` (N/S) / `GPSLongitudeRef` (E/W) の符号変換が Phase 6 の `usePhotoPicker.ts` で
対応済みかどうかは issues.md に記録（Phase 9 以降で本格確認予定）。
