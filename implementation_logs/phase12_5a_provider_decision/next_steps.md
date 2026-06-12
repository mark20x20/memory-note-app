# Phase 12.5A Provider Decision — Next Steps

## フェーズ完了条件

Phase 12.5A は以下がすべて完了した時点で Phase 12.5B に進む。

- [ ] Google Places API New が有効化されている
- [ ] Billing が有効で Budget Alert が設定済み
- [ ] `GOOGLE_PLACES_API_KEY` が Firebase Secret Manager に登録済み
- [ ] テストスクリプトを実行し、テスト結果を記録した
- [ ] 採用判断が「採用」または「条件付き採用」になった

---

## Step 1: Google Cloud Console の設定（人間が実施）

### 1-1. Places API New の有効化

```
URL: https://console.cloud.google.com/apis/library
検索: "Places API" → "Places API (New)" を選択 → 有効化
```

### 1-2. Billing の有効化

```
URL: https://console.cloud.google.com/billing
対象プロジェクト: memory-note-app-dev
→ Billingアカウントをリンク
```

### 1-3. Budget Alert の設定

```
URL: https://console.cloud.google.com/billing/budgets
→ Create Budget
→ プロジェクト: memory-note-app-dev
→ 金額: $20（アラート） / $50（上限）
→ Email アラートを設定
```

### 1-4. Places API 専用 APIキーの作成

```
URL: https://console.cloud.google.com/apis/credentials
→ Create Credentials → API Key
→ 名前: memory-note-places-api-dev
→ API 制限: Places API (New) のみ
→ アプリケーション制限: なし（テスト用）
```

---

## Step 2: Firebase Secret Manager への登録（PowerShell）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

# Secret を設定（対話プロンプトでAPIキーを入力）
npx firebase functions:secrets:set GOOGLE_PLACES_API_KEY --project memory-note-app-dev

# 設定確認（値は表示されない）
npx firebase functions:secrets:list --project memory-note-app-dev
```

---

## Step 3: テストスクリプトの実行

```powershell
# APIキーを環境変数に設定（ファイルには書かない）
$env:GOOGLE_PLACES_API_KEY="YOUR_API_KEY_HERE"

# テスト実行
node scripts/place-intelligence/test-google-places-nearby.mjs

# テスト後、環境変数を削除
Remove-Item Env:GOOGLE_PLACES_API_KEY
```

---

## Step 4: テスト結果の記録

スクリプトの出力を以下のファイルに貼り付けて記録する:

```
docs/phase12_5_place_intelligence/provider_tests/02_google_places_test_results_template.md
```

「採用判断」セクションに結果を記入する。

---

## Step 5: 採用判断

| 判断 | 条件 | 次のアクション |
|---|---|---|
| **採用** | 浅草寺・金閣寺等で期待キーワードがヒット、日本語名称がある | Phase 12.5B に進む |
| **条件付き採用** | 大部分はヒット、一部英語のみ | スコアリング設計で英語名称にも対応してから Phase 12.5B |
| **要再検討** | 主要観光地でも期待候補が出ない | Foursquare テストを実施してから判断 |

---

## Step 6: Phase 12.5B への移行プロンプト

採用判断が出たら、次の Claude Code セッションに以下を渡す:

```
Phase 12.5B: Data Model / Firestore Schema を実装してください。

参照ドキュメント:
- docs/phase12_5_place_intelligence/03_data_model.md

実装内容:
1. src/features/map/types/index.ts に PlaceGroupDoc / PlaceCandidateDoc / VisitedPlacesSummary 型を追加
2. src/core/repositories/placeGroupRepository.ts を新規作成
3. firebase/firestore.rules を更新

完了条件:
- npx tsc --noEmit が Exit 0
- npx expo lint が Exit 0
- Firestore Rules が文法エラーなし
```

---

## 残課題（Phase 12.5A で未実施）

| 課題 | 理由 | 対応タイミング |
|---|---|---|
| Foursquare との実テスト比較 | Google Places が期待通りであれば不要 | Phase 12.5C 実装前（必要なら） |
| Google Maps ToS 最新確認 | ブラウザで確認が必要 | Phase 12.5C 実装前 |
| Android Maps API キー取得（Map SDK用） | Phase 12.5F まで不要 | Phase 12.5F 実装前 |
| EAS Build の development profile 確認 | Phase 12.5F まで不要 | Phase 12.5E 完了後 |

---

## Phase 11 デプロイリマインダー

Phase 12.5B に進む前に、**Phase 11 の未デプロイ変更を先にデプロイする**ことを推奨。

```powershell
# Phase 11 の Functions + Rules（まだデプロイしていない場合）
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools deploy --only functions,firestore:rules,storage --project memory-note-app-dev
```
