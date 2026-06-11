# Phase計画 — Figma Make × React Native 実装

## 1. Phase 4.5 の位置づけ

Phase 4.5 は Phase 4 と Phase 5 の間に入る**中間準備Phase**です。

新機能の実装は行いません。目的は以下です:

- UIデザインシステムを固定し、Phase 5 以降でデザインがブレないようにする
- 未定義だったExpo Routerルートを整理し、画面設計の地図を完成させる
- Figma Make の生成・保存・採用・実装反映のルールを文書化する
- Phase 5 以降でFigma Makeを参照しながら実装できる状態にする

---

## 2. Phase 5 以降でのFigma Makeの使い方（任意）

> **方針変更（Phase 4.5 後）**: Figma Make は有料ツールのため、**使える場合のみ任意で使用する**。
> Figma Make がなくても Phase 5 以降へ進んでよい。
> UIの正は `ui_design_system.md` と `reference_map.md` であり、Claude / Codex はこれらを参照して直接 React Native 実装を進める。

### Figma Make が使える場合（任意フロー）

```
1. 対象Phaseの画面を reference_map.md で確認する
2. figma_make_common_prompt.md の共通プロンプトを準備する
3. 画面別追加プロンプトを書く（figma_make_common_prompt.md §3 参照）
4. Figma Make で生成する（1〜3画面ずつ）
5. 生成物を generated_ui/figma_make/phaseX_xxx/ に保存する
6. 採用 / 不採用 / 保留を判断・記録する
7. 採用されたレイアウトを参照しつつ React Native で実装する
8. 実装後に reference_map.md の実装状態を更新する
```

### Figma Make を使わない場合（標準フロー）

```
1. 対象Phaseの画面を reference_map.md で確認する
2. ui_design_system.md のコンポーネントルールを参照する
3. implementation_rules.md に従って React Native で実装する
4. 実装後に reference_map.md の実装状態を更新する
```

---

## 3. PhaseごとのFigma作成対象と実装対象

> Figma作成は任意です。「Figma作成対象画面」は Figma Make が使える場合の参考情報です。

| Phase | Figma作成対象画面（任意） | 実装対象画面 | Figma作成タイミング（任意） |
|---|---|---|---|
| Phase 5 | Create Start, Photo Selection, Create Preview | SCR-CREATE-001, SCR-CREATE-002 | Phase 5 開始前（任意） |
| Phase 6 | Upload Progress, Processing | SCR-UPLOAD-001, SCR-UPLOAD-002 | Phase 6 開始前（任意） |
| Phase 7 | Upload Progress 詳細, 再試行 | SCR-UPLOAD-001 詳細, SCR-ERR-003 | Phase 7 開始前（任意） |
| Phase 8 | Map View, Note Detail 地図セクション | SCR-MAP-001 | Phase 8 開始前（任意） |
| Phase 9 | AI Preview, Title Edit, Diary Edit, AI Error | SCR-AI-001〜004, SCR-ERR-004 | Phase 9 開始前（任意） |
| Phase 10 | Note Detail 完成版, Note Edit, Photo List | SCR-NOTE-001〜004 | Phase 10 開始前（任意） |
| Phase 11 | Members, Invite, Permissions | SCR-SHARE-001〜005 | Phase 11 開始前（任意） |
| Phase 12 | Share Card Settings, Preview, Share Sheet | SCR-CARD-001〜004 | Phase 12 開始前（任意） |
| Phase 13 | Calendar, Search, On This Day | SCR-MAP-002〜004 | Phase 13 開始前（任意） |
| Phase 14 | Settings 詳細, 権限説明, Privacy, Terms | SCR-SET-002〜005 | Phase 14 開始前（任意） |

---

## 4. Figma作成 → React Native実装の関係

```
Figma Make 生成
      ↓
  採用判断・保存
      ↓
  レイアウト把握
  （どの情報を・どこに・どう並べるか）
      ↓
  既存コンポーネント確認
  （ScreenHeader / Card / Button / EmptyState）
      ↓
  React Native で実装
  （colors.ts トークン使用）
      ↓
  TypeScript / Lint チェック
      ↓
  reference_map.md 更新
```

Figma Make のピクセル値や色コードは**参考程度**に使い、実装は `ui_design_system.md` に従う。

---

## 5. Figma で先に作るが実装を後回しにする画面の扱い

以下のケースでは、Figma 上で設計が進んでいても実装を後回しにする。

| ケース | 対応 |
|---|---|
| Phase スコープ外の画面 | Figma 生成物を `generated_ui/` に保存し、「実装Phase」を記録。当該Phaseが来たら参照する。 |
| バックエンド未実装 | 画面の Placeholder を作り、実データ取得は後Phase で実装 |
| 権限・Firestore Rules 未確定 | 表示制御は Placeholder 状態のまま残す |
| UI仕様未確定 | `issues.md` に記録し、Phase 開始前に決定する |

---

## 6. 画面が未完成でも Phase を進めてよい条件

以下の条件を満たせば、一部画面が未完成でも次 Phase に進める。

1. **コア機能が動作する** — そのPhaseの主目的（写真選択、ノート保存、等）が成立している
2. **認証フローが壊れていない** — ログイン → ホーム遷移が正常
3. **TypeScript / Lint エラーがない** — `npx tsc --noEmit` + `npx expo lint` がクリア
4. **未完成画面が次Phaseに引き継げる** — `next_steps.md` に引き継ぎ事項を記録済み

---

## 7. Phase 5 開始前に確定させること

Phase 5 を開始する前に以下を確定させる。

**必須:**
- [ ] `memory_notes` コレクションの Firestore Security Rules を設定する
- [ ] `memory_notes` のスキーマを確定する
- [ ] `noteRepository.ts` の CRUD インターフェースを定義する
- [ ] Create フローの状態管理（タイトル / メモ）の設計を決める
- [ ] Home 画面のノート一覧表示の設計を決める

**任意（Figma Make が使える場合のみ）:**
- [ ] Phase 5 の Figma Make 生成を実施する（Create Start / Photo Selection / Preview）
