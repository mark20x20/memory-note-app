# Phase 9 Next Steps — AI Generation via Cloud Functions

## Phase 9 実装着手前の確認事項

### 1. Phase 8 の TypeScript / Lint チェック（未完了の場合）

```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx tsc --noEmit
npx expo lint
```

### 2. Firebase Functions のセットアップ確認

`firebase/functions/` ディレクトリの状態を確認する：

```
firebase/functions/
  package.json     ← 存在するか確認
  tsconfig.json    ← 存在するか確認
  src/
    index.ts       ← 既存（スタブのみ）
```

`package.json` が存在しない場合は `firebase init functions` で初期化が必要。  
（既存の `index.ts` を上書きしないよう注意）

### 3. OpenAI API キーの設定方法確認

Firebase Secret Manager を使う場合：

```bash
# firebase-tools がインストールされていることを確認
npx firebase-tools --version

# Secret Manager にキーを登録
npx firebase-tools functions:secrets:set OPENAI_API_KEY
# → プロンプトで API キーを入力
```

Firebase 旧来の `functions:config` を使う場合：

```bash
npx firebase-tools functions:config:set openai.api_key="sk-..."
```

**どちらを使うかは実装前に決定すること。**  
詳細は `docs/phase9_ai_generation/04_security_cost_policy.md` を参照。

---

## Phase 9 実装ステップ

### Step 1: Functions のパッケージ設定

`firebase/functions/package.json` が存在しない場合は作成する。  
必要なパッケージ:

```json
{
  "dependencies": {
    "firebase-admin": "^12.x",
    "firebase-functions": "^6.x",
    "openai": "^4.x"
  },
  "devDependencies": {
    "typescript": "~5.x",
    "@types/node": "^20.x"
  },
  "engines": { "node": "20" }
}
```

### Step 2: generateMemoryDiary Callable Function 実装

`firebase/functions/src/index.ts` に `generateMemoryDiary` を実装する。

実装内容:
- 認証チェック（`context.auth`）
- `noteId` バリデーション
- Firestore からノート・写真メタデータ取得
- owner / member 権限確認
- `aiDiaryStatus: 'generating'` を書き込む
- DiaryContext 組み立て
- OpenAI API 呼び出し
- `aiDiary`, `aiDiaryStatus: 'completed'` を書き込む
- エラー時は `aiDiaryStatus: 'failed'` を書き込む

設計詳細: `docs/phase9_ai_generation/02_cloud_functions_api_design.md`

### Step 3: NoteDoc 型の更新

`src/core/repositories/noteRepository.ts` の `NoteDoc` インターフェースに  
Phase 9 の AI 日記フィールドを追加する（すべて optional）。

設計詳細: `docs/phase9_ai_generation/05_firestore_data_model.md`

### Step 4: useNoteDetail Hook 作成（onSnapshot 版）

`src/features/memoryNotes/hooks/useNoteDetail.ts`（新規）を作成し、  
`memory_notes/{noteId}` を `onSnapshot` でリアルタイム購読する。

現在の `[noteId].tsx` が `getNoteById`（1回取得）を使っているため、  
`onSnapshot` 版に移行して `aiDiaryStatus` の変化を自動反映する。

### Step 5: useGenerateDiary Hook 作成

`src/features/memoryNotes/hooks/useGenerateDiary.ts`（新規）を作成し、  
`httpsCallable(functions, 'generateMemoryDiary')` を呼び出す。

### Step 6: AiDiarySection コンポーネント実装

`src/features/memoryNotes/components/AiDiarySection.tsx`（新規）を作成する。

4状態（idle / generating / completed / failed）の UI を実装する。  
設計詳細: `docs/phase9_ai_generation/06_ui_flow.md`

### Step 7: Detail 画面への統合

`app/(app)/notes/[noteId].tsx` の AI 日記プレースホルダーを  
`<AiDiarySection>` に置き換える。

### Step 8: TypeScript / Lint / Functions ビルド確認

```powershell
# モバイル側
npx tsc --noEmit
npx expo lint

# Functions 側
cd firebase/functions
npm run build  # または npx tsc
```

### Step 9: Firebase Functions デプロイ

```bash
npx firebase-tools deploy --only functions --project <project-id>
```

### Step 10: Expo Go での手動確認フロー

```
ログイン → ノート詳細を開く
→ AI 日記セクションに「AI日記を生成する」ボタンが表示される
→ ボタンをタップ → 「生成中...」に変わる
→ 数秒後、生成された日記テキストが表示される
→ 「再生成」ボタンで再度生成できる
→ 生成中はボタンが無効化される
→ 写真・地図・メモが正常に表示され続けることを確認
```

---

## Phase 10 推奨事項

- AI 日記テキストの手動編集機能（Note Detail / Edit 画面）
- Reverse Geocoding（場所名推定）による生成品質向上
- GPS 符号処理（GPSLatitudeRef/GPSLongitudeRef）の本格確認（Issues I5 from Phase 8）
- `react-native-maps` / `expo-maps` への MapPreview 置き換え
- 写真削除フロー
- ノート削除フロー

## Phase 11 推奨事項

- 共有ノートでの AI 日記生成権限（Owner のみ or Editor も可）
- メンバー管理 UI

## Phase 15 推奨事項

- AI 生成回数の Firebase Analytics 記録
- ユーザーごとの生成上限実装
- Cloud Monitoring での異常検知アラート
- `ai_generation_runs` サブコレクションの追加（コスト監査）
