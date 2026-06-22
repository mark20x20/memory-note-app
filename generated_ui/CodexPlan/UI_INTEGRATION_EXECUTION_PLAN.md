# Memory Note App UI統合 実行手順書

## 0. 目的

このドキュメントは、これまで実装してきた Memory Note App のバックエンド・機能群を、共有済みのUI設計・画面モックに合わせて段階的に統合するための実行手順書です。

今回のUI統合では、単に見た目を差し替えるのではなく、既存の実データ・既存の機能を活かしながら、以下の方向へ整理します。

```text
写真中心の思い出体験
Preview / Edit の責任分離
Flow / Place / Map / Members の画面整理
既存バックエンドとの安全な接続
段階的なUI置き換え
```

## 1. 前提

### 1.1 現在の技術スタック

```text
React Native + Expo
Expo Router
TypeScript
Firebase Auth
Firestore
Firebase Storage
Firebase Cloud Functions v2
Google Places API
Google Routes API
OpenAI API
```

### 1.2 現在の主要データ

```text
users/{uid}
users/{uid}/entitlements/premium
users/{uid}/route_usage/{yyyyMMdd}

memory_notes/{noteId}
memory_notes/{noteId}/photos/{photoId}
memory_notes/{noteId}/place_groups/{placeGroupId}
memory_notes/{noteId}/place_groups/{placeGroupId}/candidates/{candidateId}
memory_notes/{noteId}/route_segments/{segmentId}
```

### 1.3 UI統合で守る方針

```text
Preview は見る画面
Edit は直す画面
Map はナビではなく思い出の移動を見る画面
Place は候補確認と修正の画面
Flow は1つの時間・場所のまとまりを見る画面
Members は管理画面ではなく共有関係をやさしく見せる画面
```

### 1.4 すぐにはやらないこと

```text
RevenueCat 本実装
Transitの乗換詳細
運賃表示
出発時刻設定
複数ルート候補
EAS / Android本番ビルド
大規模なFirestoreスキーマ変更
```

---

## 2. 実行前の共通手順

各フェーズを始める前に、必ず以下を実行します。

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git status
```

`working tree clean` であることを確認します。

もし未追跡ファイルや不要ファイルがある場合は、内容を確認してから削除します。

```powershell
git status
```

不要ファイルだけなら以下で削除できます。

```powershell
git clean -f
```

---

## 3. 全体フェーズ構成

UI統合は以下の順番で進めます。

```text
UI-0: UI統合準備・共通トークン確認
UI-1: Preview / Edit Shell Integration
UI-2: Edit Tab Panels 接続
UI-3: Flow Detail / Place Detail 統合
UI-4: Map UI Polish
UI-5: Full Photo Viewer / Members / Onboarding
UI-6: Share Card Polish
UI-7: UI統合後の全体QA
```

---

# UI-0: UI統合準備・共通トークン確認

## 目的

共有済みのUI設計に沿って、既存アプリのデザイン基盤を確認し、今後の画面統合で使う共通コンポーネントの方針を決めます。

## 対象

```text
src/shared/components/ui/
src/shared/theme/
app/(app)/
src/features/memoryNotes/
src/features/photos/
src/features/placeIntelligence/
```

## ブランチ作成

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git checkout -b phase-ui0-design-foundation-audit
```

## Codexに依頼する内容

```text
UI Foundation / Layout Rules / screen_specs を参照し、既存の shared UI / theme / screen layout を確認してください。

目的:
- 既存の色・余白・カード・ボタン・チップ・ヘッダー実装を洗い出す
- 新UI統合で再利用できるものを整理する
- 追加すべき共通コンポーネントを提案する
- まだ実装は最小限に留める

作成してほしいログ:
implementation_logs/ui0_design_foundation_audit/build_log.md
implementation_logs/ui0_design_foundation_audit/decisions.md
implementation_logs/ui0_design_foundation_audit/issues.md
implementation_logs/ui0_design_foundation_audit/next_steps.md

実行:
npx tsc --noEmit
npx expo lint
```

## 受け入れ条件

```text
既存の共通UI構成が把握できている
追加すべき共通コンポーネントが整理されている
既存画面を壊していない
TypeScript Exit 0
Expo lint Exit 0
```

## 完了後

```powershell
git status
git add .
git commit -m "Audit UI foundation for integration"
git push -u origin phase-ui0-design-foundation-audit

git checkout main
git pull origin main
git merge phase-ui0-design-foundation-audit
git push origin main
```

Firebase deploy は不要です。

---

# UI-1: Preview / Edit Shell Integration

## 目的

UI統合の中心となる Preview / Edit の骨格を作ります。

このフェーズでは、まだ全機能を完成させる必要はありません。まずは以下を作ります。

```text
notes/[noteId]/preview.tsx
edit.tsx のタブ構成
Preview / Edit 間の遷移
共通ヘッダー
共通タブバー
共通保存バー
```

## ブランチ作成

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git checkout -b phase-ui1-preview-edit-shell
```

## 実装対象ファイル

新規作成候補:

```text
app/(app)/notes/[noteId]/preview.tsx

src/features/memoryNotes/components/preview/NotePreviewScreenContent.tsx
src/features/memoryNotes/components/preview/PreviewHeroSection.tsx
src/features/memoryNotes/components/preview/PreviewMetaBlock.tsx
src/features/memoryNotes/components/preview/PreviewMemoryNoteCard.tsx
src/features/memoryNotes/components/preview/PreviewBottomActions.tsx

src/features/memoryNotes/components/edit/NoteEditScreenContent.tsx
src/features/memoryNotes/components/edit/EditTabBar.tsx
src/features/memoryNotes/components/edit/EditSaveBar.tsx
src/features/memoryNotes/types/edit.ts
```

変更候補:

```text
app/(app)/notes/[noteId]/edit.tsx
app/(app)/notes/[noteId]/index.tsx
```

## Codexに依頼する内容

```text
Phase UI-1: Preview / Edit Shell Integration を実装してください。

目的:
- preview.tsx を新規追加する
- edit.tsx にタブ型の編集シェルを導入する
- Preview と Edit の責任を分離する
- 既存の note / photos / placeGroups を読み込んで仮表示する
- まだ写真並び替え・Flow分割・場所候補の完全編集は実装しない

Preview:
- 写真中心
- タイトル
- 日付
- 場所
- Flow概要
- Map preview
- Memory memo
- 編集するボタン

Edit:
- タブ: 概要 / 写真 / 流れ / 場所 / メモ
- まずはタブ切り替えと各タブのプレースホルダー
- 概要タブだけ既存title/memo等と軽く接続
- 保存処理は既存機能を壊さない範囲で最小限

注意:
- Previewに confidence / system status / technical warning を出さない
- Editに修正機能を集約する
- 既存の note detail / edit の導線を壊さない
- Firebase Functions は変更しない
- Firestore Rules は変更しない

ログ:
implementation_logs/ui1_preview_edit_shell/build_log.md
implementation_logs/ui1_preview_edit_shell/decisions.md
implementation_logs/ui1_preview_edit_shell/issues.md
implementation_logs/ui1_preview_edit_shell/next_steps.md

実行:
npx tsc --noEmit
npx expo lint
```

## 受け入れ条件

```text
preview.tsx が追加される
preview で既存noteの写真・タイトル・日付・メモが表示される
edit.tsx にタブバーが表示される
概要 / 写真 / 流れ / 場所 / メモ のタブが切り替わる
Preview から Edit へ遷移できる
Edit から Preview へ戻れる
既存の note detail が壊れていない
TypeScript Exit 0
Expo lint Exit 0
```

## 完了後

```powershell
git status
git add .
git commit -m "Add preview edit shell UI"
git push -u origin phase-ui1-preview-edit-shell

git checkout main
git pull origin main
git merge phase-ui1-preview-edit-shell
git push origin main
```

Firebase deploy は不要です。

---

# UI-2: Edit Tab Panels 接続

## 目的

Edit画面の各タブに、既存機能を段階的に接続します。

## ブランチ作成

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git checkout -b phase-ui2-edit-tabs-data-binding
```

## 実装対象

```text
概要タブ
写真タブ
流れタブ
場所タブ
メモタブ
```

## 新規作成候補

```text
src/features/memoryNotes/components/edit/panels/OverviewEditPanel.tsx
src/features/memoryNotes/components/edit/panels/PhotosEditPanel.tsx
src/features/memoryNotes/components/edit/panels/FlowsEditPanel.tsx
src/features/memoryNotes/components/edit/panels/PlacesEditPanel.tsx
src/features/memoryNotes/components/edit/panels/MemoEditPanel.tsx

src/features/memoryNotes/hooks/useNoteEditDraft.ts
```

## 各タブの接続方針

### 概要タブ

```text
title
date label
summary location
cover photo
```

最初は title と memo 保存だけでもよいです。

### 写真タブ

```text
photo thumbnails
cover selection
full viewer entry
```

この段階ではドラッグ並び替えは後回しでもよいです。

### 流れタブ

```text
place_groups を Flow として表示
startAt / endAt
label
photoPreviewURLs
eventMemo
```

分割・結合はボタンだけ配置し、既存 route に逃がしてもよいです。

### 場所タブ

```text
selected place
candidate listへの導線
地図で確認
手動修正への導線
```

### メモタブ

```text
note memo
AI diary text
保存
```

AI rewrite は後回しでよいです。

## Codexに依頼する内容

```text
Phase UI-2: Edit Tab Panels Data Binding を実装してください。

目的:
- UI-1で作ったEditタブに実データを接続する
- 既存のmemory note, photos, place_groups, candidatesを利用する
- 1画面に機能を詰め込まず、タブごとに責任を分ける
- 保存処理は安全なものから接続する

注意:
- 大規模なFirestore schema変更はしない
- Flow分割/結合/写真移動は必要なら既存画面への導線に留める
- まずは表示と安全な編集を優先する

ログ:
implementation_logs/ui2_edit_tabs_data_binding/build_log.md
implementation_logs/ui2_edit_tabs_data_binding/decisions.md
implementation_logs/ui2_edit_tabs_data_binding/issues.md
implementation_logs/ui2_edit_tabs_data_binding/next_steps.md

実行:
npx tsc --noEmit
npx expo lint
```

## 受け入れ条件

```text
概要タブでtitle等が表示される
写真タブで写真一覧が表示される
流れタブでFlow/place_groupsが表示される
場所タブで現在の場所情報が表示される
メモタブでメモ編集UIが表示される
保存できる範囲が明確
未実装機能はボタンだけか導線として扱う
TypeScript Exit 0
Expo lint Exit 0
```

## 完了後

```powershell
git status
git add .
git commit -m "Bind edit tabs to note data"
git push -u origin phase-ui2-edit-tabs-data-binding

git checkout main
git pull origin main
git merge phase-ui2-edit-tabs-data-binding
git push origin main
```

Firebase deploy は不要です。

---

# UI-3: Flow Detail / Place Detail 統合

## 目的

Flow単位・Place単位の詳細画面を、共有されたUIイメージに近づけます。

## ブランチ作成

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git checkout -b phase-ui3-flow-place-detail-integration
```

## 対象

```text
app/(app)/notes/[noteId]/flows/[placeGroupId].tsx
app/(app)/notes/[noteId]/places/[placeGroupId].tsx
```

## 実装内容

### Flow Detail

```text
hero photo
time range
place label
mini route preview
related photos
flow memo
編集する
場所を確認
```

### Place Detail

```text
selected place card
candidate list
mini map
related photos
この場所にする
地図で確認
手動で修正
```

## Codexに依頼する内容

```text
Phase UI-3: Flow Detail / Place Detail Integration を実装してください。

目的:
- Flow Detailを1つの章として見えるUIにする
- Place Detailを候補確認・場所修正に集中したUIにする
- 既存のplace_groups / candidates / photosを利用する
- 既存のselectPlaceCandidate / updatePlaceGroupManuallyを壊さない

実装:
- Flow hero
- Flow meta card
- Related photo strip
- Place confirmation card
- Candidate list
- Mini map preview
- Action buttons

注意:
- 新しいFunctionsは作らない
- Firestore Rulesは変更しない
- UI接続を優先する

ログ:
implementation_logs/ui3_flow_place_detail_integration/build_log.md
implementation_logs/ui3_flow_place_detail_integration/decisions.md
implementation_logs/ui3_flow_place_detail_integration/issues.md
implementation_logs/ui3_flow_place_detail_integration/next_steps.md

実行:
npx tsc --noEmit
npx expo lint
```

## 受け入れ条件

```text
Flow Detailが写真中心で表示される
Place Detailが候補確認画面として機能する
候補選択が壊れない
手動修正導線が残る
TypeScript Exit 0
Expo lint Exit 0
```

---

# UI-4: Map UI Polish

## 目的

すでに作ったルート機能を、Memory NoteらしいMap UIに整えます。

## ブランチ作成

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git checkout -b phase-ui4-map-ui-polish
```

## 現在使える機能

```text
直線
徒歩
車
公共交通
区間別
route_segments
place_groups
numbered pins
mixed route
premium entitlement
quota
```

## 実装内容

```text
map blockの見た目整理
route mode chips整理
selected place card
photo preview row
route summary card
failed routeの表示整理
premium lock UIのデザイン整理
debug logの整理
```

## Codexに依頼する内容

```text
Phase UI-4: Map UI Polish を実装してください。

目的:
- Mapをナビ画面ではなく、思い出の移動をたどる画面として整理する
- 既存のwalking/driving/transit/mixed route機能は維持する
- 写真カードと場所カードを地図の下に配置する
- failed routeは「直線で表示」と分かるようにする
- Premium lock UIを柔らかくする

注意:
- ルート詳細、運賃、乗換詳細は実装しない
- Google Routes API側は変更しない
- Functionsは原則変更しない

ログ:
implementation_logs/ui4_map_ui_polish/build_log.md
implementation_logs/ui4_map_ui_polish/decisions.md
implementation_logs/ui4_map_ui_polish/issues.md
implementation_logs/ui4_map_ui_polish/next_steps.md

実行:
npx tsc --noEmit
npx expo lint
```

## 受け入れ条件

```text
Mapが思い出画面らしくなる
ルートチップが分かりやすい
区間別モードが壊れない
公共交通が壊れない
failed fallbackが分かる
TypeScript Exit 0
Expo lint Exit 0
```

---

# UI-5: Full Photo Viewer / Members / Onboarding

## 目的

補助画面を追加し、写真閲覧・共有メンバー・初回導線を整えます。

## ブランチ作成

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git checkout -b phase-ui5-supporting-screens
```

## 対象画面

```text
Full Photo Viewer
Members
Onboarding
```

## 実装候補

```text
app/(app)/notes/[noteId]/photos/viewer.tsx
app/(app)/notes/[noteId]/members.tsx
app/(auth)/onboarding.tsx
```

## Codexに依頼する内容

```text
Phase UI-5: Supporting Screens を実装してください。

目的:
- Full Photo Viewerを追加する
- Members画面を共有UIとして整える
- Onboarding画面を追加または整理する

優先順:
1. Full Photo Viewer
2. Members
3. Onboarding

注意:
- Membersは既存の招待/権限Functionsを使う
- Onboardingは最初は表示導線だけでもよい
- 写真ビューアは保存処理を持たない

ログ:
implementation_logs/ui5_supporting_screens/build_log.md
implementation_logs/ui5_supporting_screens/decisions.md
implementation_logs/ui5_supporting_screens/issues.md
implementation_logs/ui5_supporting_screens/next_steps.md

実行:
npx tsc --noEmit
npx expo lint
```

## 受け入れ条件

```text
写真を全画面で見られる
Members画面が開ける
ロール表示が分かる
Onboardingが表示できる
TypeScript Exit 0
Expo lint Exit 0
```

---

# UI-6: Share Card Polish

## 目的

SNS共有用の一枚絵生成画面を、UI設計に合わせて整えます。

## ブランチ作成

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git checkout -b phase-ui6-share-card-polish
```

## 対象

```text
Share Card screen
OS Share Sheet
image export
1:1 / 4:5 / 9:16
```

## Codexに依頼する内容

```text
Phase UI-6: Share Card Polish を実装してください。

目的:
- 共有カード画面をUI設計に寄せる
- 1:1 / 4:5 / 9:16 の選択を見やすくする
- 写真・タイトル・日付・場所・メモを美しく配置する
- OS Share Sheet連携は既存機能を利用する

注意:
- テンプレを増やしすぎない
- まずは4:5をデフォルトにする
- 細かい編集機能は実装しない

ログ:
implementation_logs/ui6_share_card_polish/build_log.md
implementation_logs/ui6_share_card_polish/decisions.md
implementation_logs/ui6_share_card_polish/issues.md
implementation_logs/ui6_share_card_polish/next_steps.md

実行:
npx tsc --noEmit
npx expo lint
```

## 受け入れ条件

```text
共有カード画面が開ける
4:5表示が美しく見える
1:1 / 9:16も選べる
画像保存/共有導線が壊れない
TypeScript Exit 0
Expo lint Exit 0
```

---

# UI-7: UI統合後の全体QA

## 目的

UI統合後、既存機能が壊れていないか確認します。

## ブランチ作成

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git checkout -b phase-ui7-integration-qa
```

## 確認項目

```text
ログイン
ノート作成
写真選択
アップロード
AI日記生成
Preview表示
Edit表示
写真タブ
流れタブ
場所タブ
メモタブ
Flow Detail
Place Detail
Map
徒歩ルート
車ルート
公共交通ルート
区間別ルート
Members
Share Card
Calendar
Home
Settings
権限 owner/editor/viewer
Premium lock
Premium手動付与
Quota
```

## Codexに依頼する内容

```text
Phase UI-7: UI Integration QA を実施してください。

目的:
- UI統合後の主要導線を確認する
- TypeScript / lint / routing errorを確認する
- 壊れている画面・未接続画面を一覧化する
- すぐ直すべき問題と後回しでよい問題を分ける

ログ:
implementation_logs/ui7_integration_qa/build_log.md
implementation_logs/ui7_integration_qa/decisions.md
implementation_logs/ui7_integration_qa/issues.md
implementation_logs/ui7_integration_qa/next_steps.md

実行:
npx tsc --noEmit
npx expo lint
```

## 受け入れ条件

```text
壊れている導線が一覧化されている
即修正対象が分かる
後回し対象が分かる
TypeScript Exit 0
Expo lint Exit 0
```

---

# 4. 各フェーズ共通のチェックコマンド

## TypeScript

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

npx tsc --noEmit
```

## Lint

```powershell
npx expo lint
```

## Functions build

Functionsを触ったときだけ実行します。

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app\firebase\functions

npm run build

cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
```

## Expo起動

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

$env:Path = "C:\Program Files\nodejs;$env:Path"

npx expo start -c
```

---

# 5. Deploy判断

## App側だけ変更

Firebase deploy は不要です。

```text
例:
tsx
components
styles
hooks
screen UI
```

必要なのは Expo再起動だけです。

```powershell
npx expo start -c
```

## Functionsを変更

Functions deploy が必要です。

```powershell
npx firebase-tools deploy --only functions --project memory-note-app-dev
```

## Firestore Rulesを変更

Rules deploy が必要です。

```powershell
npx firebase-tools deploy --only firestore:rules --project memory-note-app-dev
```

## Firestore Indexesを変更

Indexes deploy が必要です。

```powershell
npx firebase-tools deploy --only firestore:indexes --project memory-note-app-dev
```

## Functions + Rules

```powershell
npx firebase-tools deploy --only functions,firestore:rules --project memory-note-app-dev
```

---

# 6. Git運用ルール

各フェーズは必ずブランチを切って実装します。

```powershell
git checkout main
git pull origin main
git checkout -b <branch-name>
```

実装後:

```powershell
git status
git add .
git commit -m "<commit message>"
git push -u origin <branch-name>
```

main統合:

```powershell
git checkout main
git pull origin main
git merge <branch-name>
git push origin main
```

---

# 7. 優先順位の最終判断

次に最初に着手するべきものは以下です。

```text
UI-0: UI統合準備・共通トークン確認
```

ただし、UI設計はすでにかなり整っているため、実装を進めたい場合は以下から始めてもよいです。

```text
UI-1: Preview / Edit Shell Integration
```

おすすめは、まず UI-0 を短く実施してから UI-1 に進むことです。

理由:

```text
共通コンポーネントの確認なしに画面実装を始めると、デザインのばらつきが出やすい
Preview / Edit は今後の中心画面なので、最初に設計基盤を確認しておく方が安全
```

---

# 8. 今回の実行順

実際には以下の順で進めます。

```text
1. UI-0: UI Foundation Audit
2. UI-1: Preview / Edit Shell
3. UI-2: Edit Tab Data Binding
4. UI-3: Flow / Place Detail
5. UI-4: Map UI Polish
6. UI-5: Supporting Screens
7. UI-6: Share Card Polish
8. UI-7: Integration QA
```

まず次に実行するコマンド:

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

git checkout main
git pull origin main
git checkout -b phase-ui0-design-foundation-audit
```

その後、UI-0のCodex依頼文を渡して開始します。
