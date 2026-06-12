# Phase 9 Next Steps — AI Generation via Cloud Functions

## Phase 9 完了前の必須確認事項

### 1. Functions の依存パッケージインストールとビルド

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app\firebase\functions
npm install
npm run build
```

ビルドが成功すると `lib/` ディレクトリに JavaScript ファイルが生成される。

### 2. OpenAI API キーを Secret Manager に登録

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools functions:secrets:set OPENAI_API_KEY
# プロンプトで API キーを入力（画面には表示されない）
```

### 3. リージョン設定の確認

`client.ts` の `FIREBASE_FUNCTIONS_REGION`（デフォルト: `asia-northeast1`）と  
Functions のデプロイリージョンが一致していることを確認する。

必要に応じて `firebase/functions/src/index.ts` に `region` を追加：
```typescript
export const generateMemoryDiary = onCall(
  { secrets: [openaiApiKey], region: 'asia-northeast1' },
  async (request) => { ... }
);
```

### 4. Firebase Functions のデプロイ

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools deploy --only functions --project <project-id>
```

### 5. TypeScript / Lint チェック（モバイル側）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx tsc --noEmit
npx expo lint
```

### 6. Expo Go での手動確認フロー

```
ログイン → ノート詳細を開く

【idle 状態の確認】
→ AI 日記セクションに「✨ AI日記を生成する」ボタンが表示される

【generating 状態の確認】
→ ボタンをタップ → 「AI日記を生成中...」に変わる（ActivityIndicator 表示）
→ ボタンが消えることを確認

【completed 状態の確認】
→ 数秒後、生成された日記テキストが表示される
→ 「生成日」と「再生成」ボタンが表示される
→ 写真・地図・メモが正常に表示されていることを確認

【failed 状態の確認（APIキー未設定等でテスト）】
→ エラーカードと「再試行」ボタンが表示される
→ 写真・地図・メモは引き続き正常表示される

【再生成の確認】
→ 「再生成」ボタンをタップ → generating → completed のサイクルを確認
```

---

## Phase 10 推奨事項（次フェーズ）

- AI 日記テキストの手動編集機能（Note Detail / Edit 画面）
- `aiDiaryStatus: 'edited'` ステータスの追加（ユーザー編集後の区別）
- Reverse Geocoding による場所名推定（AI プロンプトの品質向上）
- GPS 符号処理（GPSLatitudeRef/GPSLongitudeRef）の本格確認
- `react-native-maps` / `expo-maps` への MapPreview 置き換え
- 写真削除フロー
- ノート削除フロー

## Phase 11 推奨事項

- 共有ノートでの AI 日記生成権限（Owner のみ or Editor も可）
- Functions の権限チェックは現在 `owner || member` → Phase 11 で役割に応じた制御に変更

## Phase 15 推奨事項

- AI 生成回数の Firebase Analytics 記録
- ユーザーごとの生成上限実装
- Cloud Monitoring での異常検知アラート
- `ai_generation_runs` サブコレクションの追加（コスト監査）
- Functions リージョンのコスト最適化確認

## Functions リージョン について

`generateMemoryDiary` のリージョン設定は `onCall` の第1引数で指定する（未指定の場合はデフォルトリージョン）。  
デプロイ後に Functions コンソールで実際のリージョンを確認し、  
モバイル側の `ENV.FIREBASE_FUNCTIONS_REGION`（`.env` / `app.config.ts`）と一致させること。
