# Google Places API — Secret / Billing 設定チェックリスト

## Google Cloud Console チェックリスト

### A. プロジェクト・Billing 設定

- [ ] Google Cloud プロジェクトが Memory Note App の Firebase プロジェクトと同一か確認
  - Firebase Console → プロジェクト設定 → Google Cloud プロジェクト ID を確認
- [ ] **Billing（課金）が有効になっているか**
  - Google Cloud Console → Billing → プロジェクトにアタッチされているか確認
  - 有効でないと Places API は動作しない
- [ ] **Budget Alert（予算アラート）を設定したか**
  - Google Cloud Console → Billing → Budgets & alerts
  - 推奨設定: 月 $20 でアラート通知 / 月 $50 でサービス一時停止

### B. API の有効化

- [ ] **Places API (New) が有効になっているか**
  - Google Cloud Console → APIs & Services → Enabled APIs
  - "Places API (New)" を検索して有効化
- [ ] **Maps JavaScript API は不要** (Cloud Functions 経由のため)
- [ ] **Geocoding API は必要に応じて有効化**（フォールバック用）
- [ ] **不要な API が有効になっていないか確認**
  - 有効な API が多いほど漏洩リスクが増える
  - 最小限のAPIのみ有効化する

### C. APIキーの作成と制限設定

- [ ] **Places API 専用の APIキーを新規作成したか**
  - Google Cloud Console → APIs & Services → Credentials → Create Credentials → API Key
  - **既存の Firebase API キーとは別に作成する**
- [ ] **API 制限を設定したか**
  - APIキー → Edit → API restrictions → Restrict key
  - 対象: **Places API (New)** のみ選択（Geocoding も使う場合は追加）
- [ ] **アプリケーション制限は「なし」（テスト時）または IP 制限（本番時）**
  - テスト時: Cloud Functions の IP が固定されていないため「なし」でOK
  - 本番時: Firebase Cloud Functions の送信元 IP は変動するため、Google推奨は「なし + API制限のみ」

### D. 利用量の上限設定

- [ ] **Quota（利用量上限）を設定したか**
  - Google Cloud Console → APIs & Services → Places API (New) → Quotas
  - 推奨: Nearby Search: 10,000 req/day を上限に設定
- [ ] **Rate Limit の確認**
  - デフォルト: 600 req/min（超過するユースケースなら問題なし）

---

## Firebase Secret Manager チェックリスト

### コマンド手順（PowerShell）

```powershell
# 1. functions ディレクトリに移動
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app

# 2. Secret を設定（キーを貼り付ける。ログに残らない入力プロンプトが表示される）
npx firebase functions:secrets:set GOOGLE_PLACES_API_KEY --project memory-note-app-dev

# 3. 設定確認（値は表示されない）
npx firebase functions:secrets:get GOOGLE_PLACES_API_KEY --project memory-note-app-dev
```

**注意:**
- コマンド実行時に対話プロンプトが表示される → キーを貼り付けて Enter
- キーをチャット・Slack・メール・ドキュメントに貼り付けない
- `.env` ファイルに書かない
- git に含めない（`.gitignore` で除外済みを確認）

### Secret の確認

```powershell
# Secret のリストを確認（値は表示されない）
npx firebase functions:secrets:list --project memory-note-app-dev
```

期待される出力:
```
OPENAI_API_KEY@latest
GOOGLE_PLACES_API_KEY@latest
```

---

## Cloud Functions での使用方法（実装時の参照）

Phase 12.5C の実装時に、以下のパターンで Secret を参照する。

```typescript
// firebase/functions/src/index.ts への追加（Phase 12.5C で実装）
import { defineSecret } from 'firebase-functions/params';

const GOOGLE_PLACES_API_KEY = defineSecret('GOOGLE_PLACES_API_KEY');

// Functions の定義に secrets を追加
export const enrichNotePlaces = onCall(
  {
    secrets: [GOOGLE_PLACES_API_KEY, OPENAI_API_KEY],  // ← 追加
  },
  async (request) => {
    const apiKey = GOOGLE_PLACES_API_KEY.value();  // ← 実行時に取得
    // ...
  }
);
```

**絶対禁止:**
- `process.env.GOOGLE_PLACES_API_KEY` での参照（Secret Manager 経由でないため非推奨）
- `console.log(apiKey)` でのキー出力
- レスポンスボディへのキー混入

---

## Phase 12.5C での利用予定 API

| Cloud Function | 使用 API | 呼び出しパターン |
|---|---|---|
| `enrichNotePlaces` | Places Nearby Search | ノートの全写真GPSグループを一括処理 |
| `getPlaceCandidatesForGroup` | Places Nearby Search | PlaceGroup 単位の候補取得 |
| `refreshPlaceCandidates` | Places Nearby Search | 既存候補の強制再取得 |

---

## セキュリティ確認チェック（最終）

- [ ] Places API キーが `.env` ファイルに含まれていないか
- [ ] Places API キーが `app.json` / `app.config.js` に含まれていないか
- [ ] Places API キーが `package.json` に含まれていないか
- [ ] Places API キーがソースコードにハードコードされていないか
- [ ] `git log --all -S "PLACES"` で過去の commit に含まれていないか確認

```powershell
# git 履歴にキーが含まれていないか確認
git log --all --oneline | ForEach-Object { git show $_.Split(' ')[0]:firebase/functions/src/index.ts 2>$null } | Select-String "GOOGLE_PLACES"
```

---

## 本番環境と開発環境の分離

| 環境 | Firebase プロジェクト | Secret | APIキー |
|---|---|---|---|
| 開発 (dev) | memory-note-app-dev | `GOOGLE_PLACES_API_KEY` (dev 用) | 制限緩め（テスト用） |
| 本番 (prod) | memory-note-app (prod) | `GOOGLE_PLACES_API_KEY` (prod 用) | 制限厳格（IP/API制限） |

Phase 12.5C の実装では、まず dev 環境のみで動作確認する。
