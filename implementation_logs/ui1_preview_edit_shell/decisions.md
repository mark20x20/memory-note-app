# UI-1 Preview / Edit Shell — Decisions

## Preview route を新規作成した理由

`index.tsx` が現在「ノート詳細」として主要閲覧画面を担っているが、UI仕様では Preview は「思い出を読む画面」として明確に分離されている。
- index.tsx は confidence, AI diary status, 管理UIを含んでいる
- Preview は「感情的な閲覧」に特化すべき
- UI-7 の Integration QA で index.tsx → preview.tsx リダイレクトを検討予定
- 今回は新規 `preview.tsx` を追加し、index.tsx は変更しない方針とした

## Edit をタブシェル化した理由

UI仕様は Overview / Photos / Flows / Places / Memo の5タブを要求している。
- フラットフォーム (title/memo/noteType/aiDiary) では写真・場所・フロー管理が混在し扱いにくい
- UI-2でのデータバインディングに向けた土台として、まずタブシェル (パネル構造) を導入
- 既存の保存処理 (`useUpdateNote`) はそのまま維持し、Flows/Places/Photos は placeholder にした

## UI-1ではデータバインディングを限定した理由

- 写真ドラッグ並び替え、Flow分割/結合、Place候補選択は UI-2以降のスコープ
- 今回は "シェル" の確立を優先し、TypeScript Exit 0 / lint Exit 0 を確実に達成することに注力した
- 各パネルは placeholder を表示し、UI-2 で段階的にデータを接続する

## AppIcon を UI-1 で作らなかった理由

UI-0 decisions.md の方針を踏襲:
- 「早期抽象化より実際の使用パターンから設計する」
- preview.tsx / edit.tsx でアイコンを使う場面が限定的だったため、`@expo/vector-icons` を直接使わず、テキストアイコン（矢印）で代用した
- AppIcon/IconButton の共通化は UI-2 以降

## Card.tsx radius を修正した理由 (12 → 20)

- spec は radius.card = 20 を要求
- borderRadius.xl = 20 がテーマに存在する
- 既存画面への影響を確認: Card が使われているのは共通コンポーネントの wrapper のみ、インライン `style` prop での上書きが可能なため修正のリスクは低い
- SectionCard は新規作成せず、Card の radius を正す方針とした

## StickyBottomBar の背景色について

- spec は `rgba(250,247,242,0.94)` を提案しているが、React Native の rgba は blur効果なしでは透過が分かりにくい
- `colors.background` (#FAF7F2) のソリッドカラーを採用し、上部ボーダーで区切りを明示した
- 必要であれば UI-7 ポリッシュで blur/translucent に変更可能
