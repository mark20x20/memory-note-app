# UI Design System — Memory Note / 思い出ノート

## 1. ブランド印象

このアプリが目指す印象:

- **やさしい** — 角が立たず、過剰に主張しない
- **上品** — 余白・色・影が洗練されている
- **少しあたたかい** — クリーム系背景、コーラルアクセント
- **記憶を大切にする雰囲気** — 写真が主役、情報は補助
- **写真が主役** — テキストよりも写真が先に目に入る構成
- **日本の生活感に馴染む** — 過度な英語表記を避け、日本語が自然
- **旅行アプリっぽすぎない** — 予約・検索ではなく記録・振り返りの文脈
- **SNSっぽい派手さは避ける** — いいね/フォロワー/通知バッジ感を出さない
- **でも共有すると映える** — SNSカードは上品に完成度が高い

---

## 2. デザイン原則

1. **情報密度は中程度** — 1画面に詰め込みすぎない
2. **余白で上質さを出す** — 要素間のスペースを惜しまない
3. **写真と地図は補助関係** — 写真が一番大きく、地図はコンテキスト補完
4. **カード単位で情報を整理** — セクションごとにカードで囲む
5. **重要操作は親指で届く** — メインCTAは画面下部か中央下寄り
6. **エラー・空状態も美しく** — 「申し訳ありません」ではなく「作ってみよう」の文脈
7. **一貫したトークン使用** — `colors.ts` のセマンティックトークンを必ず使う

---

## 3. カラーパレット

### 実装トークン（`src/shared/theme/colors.ts`）

| 用途 | トークン | 値 |
|---|---|---|
| 背景（クリーム） | `colors.background` | `#FAF7F2` |
| カード背景 | `colors.surface` | `#FFFFFF` |
| 薄い面（アイボリー） | `colors.surfaceIvory` | `#F4EEE6` |
| 暖かい面 | `colors.surfaceWarm` | `#FFF9F4` |
| メインアクセント（コーラル） | `colors.primary` | `#F26B5B` |
| コーラル濃 | `colors.primaryDark` | `#D4503F` |
| コーラル淡 | `colors.primaryLight` | `#FEF0EE` |
| 地図アクセント（ティール） | `colors.mapAccent` | `#4FA8A1` |
| ティール淡 | `colors.mapAccentLight` | `#E6F4F3` |
| テキスト（メイン） | `colors.textPrimary` | `#2E2A27` |
| テキスト（サブ） | `colors.textSecondary` | `#7A746D` |
| テキスト（補助・薄） | `colors.textTertiary` | `#B8AD9F` |
| テキスト（無効） | `colors.textDisabled` | `#D9CDBF` |
| 区切り線 | `colors.border` | `#E8DED4` |
| フォーカス枠線 | `colors.borderFocus` | `#F26B5B` |
| 成功 | `colors.success` | `#10B981` |
| 警告 | `colors.warning` | `#F59E0B` |
| エラー | `colors.error` | `#EF4444` |

### カラー使用ルール

- コーラルは「主要ボタン」「アクティブ状態」「重要強調」のみに限定する
- ティールは「地図」「位置情報」「スポット」関連にのみ使う
- 背景色は `background`（クリーム）を基本とし、カード内は `surface`（白）
- ダークモードは実装しない（v1スコープ外）
- グラデーションは使わない（単色フラット）

---

## 4. フォント方針

### 基本方針

- システムフォントを使用（iOS: San Francisco / Android: Roboto）
- 日本語テキストが自然に読めることを最優先
- カスタムフォントの追加は Phase 16 以降で検討

### 文体

- タイトル・ボタン: 太め（`fontWeight: '700'` または `'600'`）
- 本文・説明文: 通常（`fontWeight: '400'` または `'500'`）
- 補助・ラベル: 細め（`fontWeight: '400'`）

---

## 5. 文字サイズ

| 用途 | サイズ | 備考 |
|---|---|---|
| 画面タイトル（ScreenHeader） | 20px | bold |
| セクション見出し | 18px | semibold |
| カードタイトル | 16px | semibold |
| 本文・入力値 | 15px | regular |
| サブテキスト | 13px | regular, secondary color |
| チップ・バッジ | 12px | medium |
| 補助テキスト・フッター | 11px | regular, tertiary color |

---

## 6. 行間（lineHeight）

- 本文: `fontSize × 1.6`（例: 15px → 24px）
- 見出し: `fontSize × 1.3`（例: 20px → 26px）
- 補助テキスト: `fontSize × 1.4`（例: 13px → 18px）

---

## 7. 余白（spacing）

| 用途 | 値 |
|---|---|
| 画面端パディング | 20px |
| カード内パディング | 16px |
| セクション間マージン | 24px |
| 要素間マージン（密） | 8px |
| 要素間マージン（標準） | 12px |
| 要素間マージン（ゆったり） | 16px |
| カード間ギャップ | 12px |

---

## 8. 角丸（borderRadius）

| 用途 | 値 |
|---|---|
| カード | 16px |
| ボタン（主要） | 12px |
| チップ・バッジ | 20px（pill）|
| 入力フォーム | 10px |
| アバター | 完全円（`borderRadius: size/2`）|
| 写真サムネイル | 8px |
| 底部アクションシート | 20px（上部のみ）|

---

## 9. 影（shadow）

### カード用影

```typescript
// iOS
shadowColor: '#2E2A27',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.08,
shadowRadius: 8,
// Android
elevation: 3,
```

### 浮きボタン（FAB）用影

```typescript
// iOS
shadowColor: '#F26B5B',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 12,
// Android
elevation: 8,
```

---

## 10. カードUI

### 基本カード

- 背景: `colors.surface`（白）
- 角丸: 16px
- パディング: 16px
- 影: 標準カード影
- 枠線: なし（影で浮かせる）

### アイボリーカード

- 背景: `colors.surfaceIvory`
- 角丸: 16px
- パディング: 16px
- 影: なし（背景と馴染ませる）

### 薄枠カード

- 背景: `colors.surface`
- 枠線: `1px solid colors.border`
- 角丸: 12px
- 影: なし

---

## 11. ボタンUI

### 主要ボタン（Primary）

- 背景: `colors.primary`（コーラル）
- テキスト: `colors.textInverse`（白）
- フォント: 16px bold
- 角丸: 12px
- パディング: 16px 24px
- 影: コーラル影

### サブボタン（Secondary）

- 背景: `colors.primaryLight`
- テキスト: `colors.primary`
- フォント: 15px semibold
- 角丸: 12px
- 枠線: なし

### アウトラインボタン（Outline）

- 背景: 透明
- テキスト: `colors.primary`
- 枠線: `1.5px solid colors.primary`
- 角丸: 12px

### テキストボタン（Text only）

- 背景: なし
- テキスト: `colors.primary` または `colors.textSecondary`
- 下線: なし

### 無効状態（Disabled）

- 背景: `colors.gray200`
- テキスト: `colors.textDisabled`
- `opacity: 0.6`

---

## 12. 入力フォーム

- 背景: `colors.surface` または `colors.surfaceIvory`
- 枠線: `1px solid colors.border`
- フォーカス時枠線: `1.5px solid colors.borderFocus`
- 角丸: 10px
- パディング: 12px 16px
- テキスト: 15px, `colors.textPrimary`
- プレースホルダー: `colors.textTertiary`
- ラベル: 13px, `colors.textSecondary`（フィールド上部）

---

## 13. 写真カード

- 写真は `borderRadius: 12px` で角丸表示
- カバー写真（ノート詳細）: 幅100%, height 220px
- グリッドサムネイル: 3列、`(screenWidth - 48) / 3` で算出、正方形
- サムネイル角丸: 8px
- 写真枚数バッジ: 右下に重ね表示（`colors.surface` 背景, 11px テキスト）

---

## 14. 地図カード

- 背景: `colors.mapAccentLight` または 実地図
- 角丸: 16px
- 高さ: 140〜180px（ノート詳細内の補助表示）
- ピン: コーラルまたはティール、小さく上品に
- テキストオーバーレイ: `colors.textPrimary` 小サイズ
- 地図単独表示（SCR-MAP-001）: 全画面

---

## 15. チップ（Chip）

### 日付チップ

- 背景: `colors.surfaceIvory`
- テキスト: `colors.textSecondary`, 12px
- 角丸: 20px（pill）
- パディング: 4px 10px

### 場所チップ（ティール）

- 背景: `colors.mapAccentLight`
- テキスト: `colors.mapAccent`, 12px
- 角丸: 20px
- 左にピンアイコン（ティール）

### タグチップ

- 背景: `colors.surfaceIvory`
- テキスト: `colors.textSecondary`, 12px
- 角丸: 20px

### 権限バッジ（Owner / Editor / Viewer）

- Owner: `colors.primary` 背景, 白テキスト
- Editor: `colors.mapAccent` 背景, 白テキスト
- Viewer: `colors.gray200` 背景, `colors.textSecondary` テキスト

---

## 16. CTA（Call to Action）

### ホームCTA（最初の思い出を作る）

- 幅: 画面幅 - 40px
- 背景: `colors.primary`
- 影: コーラル影
- テキスト: 16px bold, 白
- 角丸: 12px
- パディング: 16px

### FAB（Floating Action Button）

- サイズ: 56px × 56px
- 背景: `colors.primary`
- アイコン: `+` 白, 24px
- 角丸: 28px（完全円）
- 位置: 右下（marginBottom: 24px, marginRight: 20px）
- 影: コーラル影（強め）

---

## 17. Bottom Navigation方針

### 構成（Phase 11 で実装）

```
ホーム | 地図 | [作成] | カレンダー | 設定
```

- 中央（作成）はコーラル円形ボタンで強調
- 高さ: 83px（SafeAreaInsets考慮）
- 背景: `colors.surface`（白）
- 区切り線: `colors.border`（上部1px）
- アクティブアイコン: `colors.primary`
- 非アクティブアイコン: `colors.textTertiary`
- ラベル: 10px, アクティブ時 `colors.primary`

---

## 18. Empty / Loading / Error state

### Empty state

- 中央揃え
- イラスト or 大きめ絵文字（60〜80px）
- タイトル: 16px semibold, `colors.textPrimary`
- 説明文: 14px, `colors.textSecondary`
- CTAボタン: Primary ボタン（作成を促す）

### Loading state

- ActivityIndicator: `colors.primary`（コーラル）
- 背景: `colors.background`
- テキスト: 14px, `colors.textSecondary`

### Error state

- エラーアイコン: `colors.error`
- タイトル: 15px semibold, `colors.textPrimary`
- 説明: 13px, `colors.textSecondary`
- 再試行ボタン: Outline ボタン

---

## 19. 日本語文体

- 丁寧語（〜ください、〜できます）は避け、自然な案内文にする
- 否定形より肯定形を優先（「エラーではありません」→「まだノートがありません」）
- 操作ラベルは短く（「作成する」「保存」「削除」）
- エラーメッセージは簡潔に（「保存できませんでした。もう一度お試しください。」）
- AIに関する説明は正直かつ前向きに（「AIが下書きを作ります」）

---

## 20. 禁止デザイン

- ネオンカラー・蛍光色
- グラデーション背景（特に派手なもの）
- ダークモード専用デザイン
- SNSフィード風（いいね/コメント/フォロワー数の表示）
- 旅行予約サイト風（価格・評価星・ブッキングボタン）
- 地図ナビアプリ風（ルート案内・ETA）
- 業務ツール風テーブルUI
- カジノ風グラデーションボタン
- 重いグラスモーフィズム
- ワイヤーフレーム風（色なし、枠だけのUI）
- 過剰なアニメーション・トランジション
- 文字サイズ11px以下のメインコンテンツ
- 情報密度が高すぎる詰め込みUI
