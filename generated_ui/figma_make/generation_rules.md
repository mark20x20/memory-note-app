# Figma Make 生成ルール — Memory Note / 思い出ノート

> **方針（Phase 4.5 後）**: Figma Make は有料ツールのため**使える場合のみ任意で使用する**。
> Figma Make がなくても実装を進めてよい。
> Figma Make を使わない場合は、`ui_design_system.md` と `reference_map.md` を参照して Claude / Codex が直接 React Native 実装を行う。
> 手動で作成した UI 案やスクリーンショットがある場合も、同じフォルダ構成（`generated_ui/figma_make/phaseX_xxx/`）に保存してよい。

## 1. 生成単位

### 1回の生成で扱う画面数

- 原則 **1〜3画面** を1セットとして生成する
- 密接に関連する画面（例: 生成プレビュー + タイトル編集 + 日記編集）はセットにしてよい
- 関係のない画面を同時に生成しない

### Phaseごとの生成対象（任意）

> 以下は Figma Make が使える場合の参考情報です。生成しなくても各 Phase の実装を進められます。

| Phase | 任意生成対象画面 |
|---|---|
| Phase 4.5（完了） | Home / Create / Note Detail / Settings の参照確認 |
| Phase 5 | Create Note (作成開始 / プレビュー) |
| Phase 6 | Photo Selection / Upload Progress / Processing |
| Phase 7 | Upload Progress 詳細（再試行含む）|
| Phase 8 | Map View / Note Detail の地図セクション |
| Phase 9 | AI Preview / Title Edit / Diary Edit |
| Phase 10 | Note Detail 詳細 / Note Edit / Photo List |
| Phase 11 | Members / Invite / Permissions |
| Phase 12 | Share Card Settings / Preview / Share Sheet |
| Phase 13 | Calendar / Search / On This Day |
| Phase 14 | Settings 詳細（権限説明 / プライバシー / 規約）|

---

## 2. 保存場所とフォルダ構成

生成したFigma Make出力（プロンプト・説明・採用判断）は以下に保存する。

```
generated_ui/
└── figma_make/
    ├── reference_map.md                    # 画面ID↔ルート対応表（全Phase共通）
    ├── ui_design_system.md                 # UIデザインシステム定義
    ├── figma_make_common_prompt.md         # 共通プロンプト集
    ├── generation_rules.md                 # 本ファイル
    ├── implementation_rules.md             # 実装反映ルール
    ├── phase_plan.md                       # Phase計画
    ├── screen_priority.md                  # 画面優先順位
    │
    ├── phase5_memory_note_creation/        # Phase 5 生成物
    │   ├── 01_create_start_screen.md
    │   ├── 02_photo_selection_screen.md
    │   ├── 03_create_preview_screen.md
    │   └── 04_figma_output_notes.md
    │
    ├── phase6_upload_processing/           # Phase 6 生成物
    │   ├── 01_upload_progress_screen.md
    │   ├── 02_processing_screen.md
    │   └── 03_figma_output_notes.md
    │
    ├── phase8_map/                         # Phase 8 生成物
    │   ├── 01_note_map_screen.md
    │   └── 02_figma_output_notes.md
    │
    └── phase9_ai_generation/              # Phase 9 生成物
        ├── 01_ai_preview_screen.md
        ├── 02_ai_title_edit_screen.md
        ├── 03_ai_diary_edit_screen.md
        └── 04_figma_output_notes.md
```

---

## 3. ファイル名ルール

- 形式: `XX_screen_name.md`（XX は 2桁のゼロパディング連番）
- 例: `01_create_start_screen.md`, `02_photo_selection_screen.md`
- 最後のファイルは `NN_figma_output_notes.md`（採用・不採用・保留の判断記録）

---

## 4. 各生成物ファイルの記載内容

```markdown
# [画面名]

## 画面ID
SCR-XXX-001

## 生成日時
YYYY-MM-DD

## 参照したmd
- final_spec/04_ui_ux/03_ui_visual_direction.md
- generated_ui/figma_make/figma_make_common_prompt.md
- generated_ui/figma_make/ui_design_system.md

## 使用したプロンプト
[Figma Makeに貼ったプロンプト全文]

## 生成結果の説明
[生成されたUIの説明・気づき]

## 採用判断
- 採用 / 不採用 / 保留

## 採用理由 / 不採用理由
[理由の記録]

## 実装への反映メモ
[React Native実装に落とす際の注意点]
```

---

## 5. 採用 / 不採用 / 保留の基準

| 判断 | 基準 |
|---|---|
| 採用 | UIデザインシステムに沿っており、実装の参考として使える |
| 保留 | 良い部分があるが修正が必要。再生成または手修正で使える |
| 不採用 | UIスタイルが方針と合わない（SNS風、旅行予約風など）|

---

## 6. Figma Make を使う場合のチェックリスト（任意）

生成前に確認すること:

- [ ] `figma_make_common_prompt.md` の共通ベースプロンプトを先頭に貼る
- [ ] 対象画面IDと `reference_map.md` のルートを確認する
- [ ] `ui_design_system.md` の該当セクションを確認する
- [ ] 生成する画面に合わせた追加プロンプトを用意する

生成後に確認すること:

- [ ] `ui_design_system.md` の評価基準でレビューする
- [ ] 採用 / 不採用 / 保留を記録する
- [ ] `figma_output_notes.md` に判断と理由を記録する
- [ ] 採用した場合は `reference_map.md` の「任意UI草案保存場所」列を更新する

---

## 7. Figma Make を使わない場合のフロー（標準）

Figma Make なしで実装を進める手順:

1. `reference_map.md` で対象画面の予定ルートと実装Phaseを確認する
2. `ui_design_system.md` のカラー / 余白 / カード / ボタン / フォームルールを確認する
3. `implementation_rules.md` のコード規約を確認する
4. React Native で実装する（`colors.ts` トークン必須）
5. `npx tsc --noEmit` + `npx expo lint` でチェック
6. `reference_map.md` の実装状態を更新する
