# UI-9 Design Decisions

## 1. 既存実装を最大限活かし、差分のみ修正する

**決定:** Phase 12 で実装済みの `share.tsx` / `ShareCardPreview` / `PhotoCollage` / `useShareCardCapture` を保持し、
仕様書との差分のみを修正する。

**理由:**
- `useShareCardCapture` (captureRef → MediaLibrary / Sharing) は動作ずみ
- `PhotoCollage` の 1/2/3/4枚対応レイアウトは仕様書の要件を満たす
- 不要な書き直しはリグレッションリスクを高める

## 2. デフォルトフォーマットを portrait (4:5) に変更

**決定:** `useState<ShareCardFormat>('portrait')` に変更。

**理由:**
- 仕様書明記: "Recommended Default: default to 4:5"
- "strongest balance between photo impact and readability"
- Instagram feed で最も多用されるフォーマット

## 3. 場所情報は visitedPlacesSummary を使う

**決定:** `note.visitedPlacesSummary.areaLabel` または `topPlaceLabels[0]` を使う。

**理由:**
- `usePlaceGroups` を share 画面に追加すると、余分なリアルタイム購読が発生する。
- `visitedPlacesSummary` は NoteDoc に非正規化されており、追加購読不要。
- フィールドが存在しない場合は location hint を非表示にする（graceful fallback）。

## 4. cardWrapper の borderRadius を 24 に設定 (仕様は 32)

**決定:** `borderRadius: 24`。仕様書の 32 よりやや小さく。

**理由:**
- 仕様書: "card radius: 32"
- React Native の preview では 32 がかなり丸くなり、content がはみ出す可能性。
- 24 で十分なプレミアム感を出せる。
- キャプチャ対象の card 自体は `borderRadius: 0` のため、保存画像には影響しない。

## 5. PhotoCollage は最大 4 枚のまま維持

**決定:** PhotoCollage を 1 枚表示に変更しない。

**理由:**
- 仕様書は "one main photo" を推奨しているが、2〜4 枚の collage の方が「思い出感」が出る。
- 1 枚のみでは写真が少ないノートと多いノートで体験が分かれない。
- 既存実装で 1 枚のとき: 大きく表示、2 枚: 左右、3 枚: 2:1 比率 — 自然なレイアウト。
- 大改修にあたるため UI-9 スコープ外。

## 6. サブタイトル "思い出をきれいにまとめる" を header 下に配置

**決定:** ScreenHeader コンポーネントは変更せず、`share.tsx` 内に独立したサブヘッダー View を追加。

**理由:**
- ScreenHeader は共有コンポーネントであり、subtitle prop の追加は他画面に影響する可能性。
- share.tsx 固有のサブタイトルを独立 View で追加する方が安全で最小変更。
