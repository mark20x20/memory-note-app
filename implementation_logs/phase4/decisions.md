# Phase 4 技術的決定事項

## D1: カラーパレットを完全にコーラル+ティール系に移行

**決定**: `colors.ts` の `primary` を blue `#4A90D9` → coral `#F26B5B` に変更。

**理由**:
- 仕様書 `03_ui_visual_direction.md` のブランド方針（warm, soft, calm / coral accent）と一致させるため
- Auth 画面は独自スタイル（ハードコードされた `#4A90D9`）のため影響なし
- `(app)/_layout.tsx` と `app/index.tsx` の ActivityIndicator も `#4A90D9` ハードコードのため影響なし
- Phase 4 で app shell 全体のトーンを統一する適切なタイミング

**影響範囲**:
- `ScreenHeader.tsx` の戻るボタン: blue → coral
- `EmptyState.tsx` のボタン: blue → coral
- `LoadingState.tsx` のインジケータ: blue → coral
- `home.tsx`, `create/index.tsx`, `notes/[noteId].tsx`, `settings.tsx`: 間接的に coral 適用

---

## D2: Home の EmptyState を独自実装に変更

**決定**: 共通の `EmptyState` コンポーネントを使わず、`home.tsx` 内でインライン実装。

**理由**:
- ホームの空状態は「できること」の feature hints カードが必要で、汎用 `EmptyState` では対応が難しい
- 汎用コンポーネントを過度に拡張するより、ホーム専用レイアウトとして書くほうが明確
- `EmptyState` コンポーネント自体は他の汎用用途（検索結果なし等）のために保持

---

## D3: Detail 画面に noteId を自然な補助表示として配置

**決定**: `noteId` を画面下部に `fontSize: 11`, `color: colors.textTertiary` で小さく表示。

**理由**:
- Phase 3 まではデバッグ的な monospace 表示だったが、本番 UI に馴染む形に変更
- 実データ取得前のデバッグ支援として有用
- Phase 9 実装時に自然に削除 or 「ノート情報」セクションに統合できる配置

---

## D4: Create 画面の写真選択ボタンを disabled で残す

**決定**: 写真選択ボタンを `opacity: 0.4` + `disabled: true` で表示。削除しない。

**理由**:
- Phase 5 で本実装するため、ルート・コンポーネント構造を維持する
- UI上でどこに写真選択が入るかが視覚的に分かることがPhase 5実装時の指針になる
- 完全に消すよりも「近日実装」の雰囲気が伝わる

---

## D5: SafeAreaView の認証画面は今回触らない

**決定**: `app/(auth)/*.tsx` の `SafeAreaView` は Phase 4 で変更しない。

**理由**:
- Phase 3 で `(app)` 側は `react-native-safe-area-context` に移行済み
- 認証フローを壊すリスクを避けるため、最小修正の原則を適用
- Auth 画面の SafeAreaView 警告は許容範囲として残す（Phase 14 で対応予定）
