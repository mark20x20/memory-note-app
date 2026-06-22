# UI-0 Design Foundation Audit — Decisions

## UI統合の基本方針

1. **既存ファイル構成を維持** — 新規作成より既存ファイルの改修を優先する
2. **feature-basedアーキテクチャ継続** — `src/features/` 配下の分割を維持
3. **共通コンポーネントはsharedに集約** — 画面固有ロジックを `src/shared/components/ui/` に漏らさない
4. **段階的統合** — 全画面一括作り替えは行わず、UI-1→UI-7 の順に進める
5. **デザイントークン優先使用** — `src/shared/theme/` のトークンをインラインスタイル代わりに使う。新しいトークンが必要な場合はUIフェーズ内でthemeを拡張する

## Preview/Edit 分離方針

- **Preview** (`app/(app)/notes/[noteId]/preview.tsx` — 新規作成):
  - 感情的に思い出を読む画面
  - 生成ステータス・confidence・チェックリストは出さない
  - ヒーロー写真 + フロータイムライン + メモ + 静かな「編集する」CTA
  - 既存の `VisitTimelineSection`, `EventMapPreview` をそのまま流用する

- **Edit** (`app/(app)/notes/[noteId]/edit.tsx` — リファクタ):
  - タブ構成: Overview | Photos | Flows | Places | Memo
  - 中央集権的なドラフト状態 (`useNoteEditDraft` hook)
  - スティッキー保存バー (`EditSaveBar`)
  - 現在のフラットフォームを5パネル構成に分割する

- **Detail/Index** (`app/(app)/notes/[noteId]/index.tsx`):
  - UI-1では原則触らない
  - UI-7 Integration QA で Preview へのリダイレクト/統合を検討

## 共通コンポーネント方針

### 既存コンポーネント — 継続使用 (変更最小限)
| Component | 用途 | 変更要否 |
|-----------|------|---------|
| AppButton | Primary/Secondary/Ghost CTA | 軽微 — radius調整検討 |
| AppText | テキスト表示 | UI-1でvariant拡張 |
| Card | カード表示 | UI-1でradius修正 (12→20) |
| Screen | SafeArea/ScrollView wrapper | そのまま |
| ScreenHeader | ヘッダー | そのまま |
| LoadingState | ローディング | そのまま |
| EmptyState | 空状態 | そのまま |
| ErrorState | エラー状態 | そのまま |

### UI-1で追加する共通コンポーネント候補
| Component | 用途 | 優先度 |
|-----------|------|--------|
| EditTabBar | Edit画面のタブナビゲーション (5タブ) | 必須 |
| StickyBottomBar | 保存/キャンセルのスティッキーバー | 必須 |
| SectionCard | セクション区切りカード (radius 24) | 必須 |
| InlineStatusBadge | ステータス表示バッジ | 中 |

### UI-2以降で追加する共通コンポーネント候補
| Component | 用途 | フェーズ |
|-----------|------|---------|
| AppIcon | アイコンラッパー (Feather/Ionicons統一) | UI-2 |
| IconButton | アイコンのみボタン | UI-2 |
| PhotoThumbnailReorderList | 写真並び替えリスト | UI-2 |
| SegmentedTabs | 2-3択セグメント切替 | UI-3 |
| Chip | 状態/ラベルチップ | UI-3 |

### 判断理由
- AppIcon / IconButton はUI-0では作らない: まず画面シェルを作り、実際に使う場面を確認してから最小実装する
- Chip は既存画面 (map.tsx等) で独自実装しているが、共通化はUI-3以降

## アイコン方針

**ライブラリ**: `@expo/vector-icons` を継続使用 (既存コードがこれを使っている)

**使用アイコンセット**:
- `Feather`: edit, plus, x, share, users, image, clock, file-text, check
- `Ionicons`: chevron-back, calendar-outline, image-outline, location-outline, settings-outline
- `MaterialCommunityIcons`: map-outline, walk, car-outline, train, route (map.tsx で既に使用中)

**ラッパー方針**:
- UI-0では AppIcon/IconButton を作らない
- UI-2で画面実装が増えてから最小限のラッパーを作る
- 理由: 早期抽象化より実際の使用パターンから設計する

## UI-1で優先する画面

1. **`preview.tsx` 新規作成** (最優先)
   - 現状: ファイル自体が存在しない
   - 作成: NotePreviewScreenContent + PreviewHeroSection + PreviewMetaBlock + PreviewBottomActions
   - 流用: VisitTimelineSection, EventMapPreview (既存)
   - ナビゲーション: edit.tsx / map.tsx / members.tsx へのリンク

2. **`edit.tsx` タブ構造シェル** (次点)
   - 現状: フラットフォーム (title/memo/noteType/aiDiary/flow-recreation)
   - 変更: EditTabBar + EditSaveBar + 5パネルの骨格
   - データバインディングはUI-2で実装 (UI-1はシェルのみ)

## デザイントークン拡張方針

### colors.ts — 拡張不要
全てのspec色はcode内に存在する。transit用 `#D97B4F` のみ map.tsx 内にインライン定数として既にある。

### typography.ts — UI-1でvariant追加
AppText に variant prop を追加し、spec準拠のサイズを拡張:
```
display: 28
screenTitle: 24
cardTitle: 18
bodyMd: 15 (specの「body」= 15)
micro: 11
```
既存 h1(32)/h2(26)/h4(17) は削除しない — 既存スクリーンが使っている可能性がある。

### spacing.ts / borderRadius — UI-1でxxl追加
```
borderRadius.xxl: 24 (radius.cardLarge)
```
Card.tsx の borderRadius: 12 → borderRadius.xl (20) に修正する。
