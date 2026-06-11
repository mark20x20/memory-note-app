# Phase 4.5 技術的決定事項

## D1: notes/[noteId] のルート構造を nest 型に決定

**決定**: `app/(app)/notes/[noteId].tsx`（単一ファイル）から、将来的に `app/(app)/notes/[noteId]/index.tsx`（ディレクトリ型）に移行する方針を確定。

**理由**:
- Phase 8 以降で `notes/[noteId]/map`, `notes/[noteId]/edit`, `notes/[noteId]/photos` 等のサブルートが必要になるため
- Expo Router では `[noteId].tsx` と `[noteId]/` は共存できないため、早めに方針を確定する
- 現時点では `[noteId].tsx` のまま維持し、Phase 8 実装時に移行する

**影響範囲**:
- Phase 8 以降のファイル追加時に `notes/[noteId].tsx` → `notes/[noteId]/index.tsx` の移行が必要
- 移行前に既存の navigation / Link を確認して壊れないようにする
- この移行は `reference_map.md` の「注意」欄に明記済み

---

## D2: 共有関連ルートを notes/[noteId]/ 配下に集約

**決定**: メンバー管理・招待・権限変更をフラットなパス（`/(app)/share/members` など）でなく、ノートスコープのパス（`/(app)/notes/[noteId]/members`）に集約する。

**理由**:
- 共有操作は常に特定のノートに対して行われる
- `noteId` がルートパラメータとして自然に伝播される
- フラットなパスにすると `noteId` をクエリパラメータで渡す必要があり、型安全性が下がる
- Expo Router の file-based routing を最大限活用できる

**影響範囲**:
- `/(app)/share/members` → `/(app)/notes/[noteId]/members` に変更
- Phase 11 実装時はこのルート構成に従う

---

## D3: ActivityIndicator の色を colors.primary に修正（Phase 4.5 唯一のコード変更）

**決定**: `app/index.tsx` と `app/(app)/_layout.tsx` の `ActivityIndicator` の色を `"#4A90D9"` (blue) → `colors.primary` (coral) に修正する。

**理由**:
- Phase 4 で `colors.ts` を coral テーマに更新したが、この2ファイルは修正漏れだった（Phase 4 issues.md I2 として記録済み）
- Phase 4.5 の「許容する小さな修正」に該当する
- 認証フロー・画面遷移に影響しない安全な変更

**影響範囲**:
- `app/index.tsx`: ActivityIndicator が coral に
- `app/(app)/_layout.tsx`: ActivityIndicator が coral に
- `import { colors }` を追加したが既存ロジックは変更なし

---

## D4: Figma Make 生成物は phaseX_xxx/ ディレクトリに格納

**決定**: `generated_ui/figma_make/` 配下に Phase ごとのサブディレクトリを作り、生成物を保存する。

**理由**:
- Phase が進むにつれて生成物が増えるため、フラットに置くと管理できなくなる
- Phase に紐づいた命名（`phase5_memory_note_creation/`）で検索しやすくなる
- 各 Phase の「完了時にどんな Figma 出力があったか」を後から確認しやすい

**フォルダ命名ルール**: `phase{番号}_{snake_case_phase_name}/`

---

## D5: notes/[noteId].tsx の移行は Phase 8 まで現状維持

**決定**: 現在の `app/(app)/notes/[noteId].tsx` は Phase 7 完了まで変更しない。Phase 8（Map実装）のタイミングで `notes/[noteId]/index.tsx` へ移行する。

**理由**:
- 現時点でサブルートが不要なため、今移行するとリスクだけあってメリットがない
- Phase 8 で `notes/[noteId]/map.tsx` が必要になる時点でまとめて移行するのが自然
- この方針は `reference_map.md` のルートグループ構成の「注意」欄に記録済み
