# Phase 9 Issues — AI Generation via Cloud Functions

## I1: OpenAI APIキーの Secret Manager 設定はユーザーが手動実行が必要

**状況:** `OPENAI_API_KEY` は Firebase Secret Manager に保管する設計だが、  
実際に登録するコマンドをエージェントが実行することはできない（セキュリティ上の理由）。

**対応（ユーザー実行）:**
```bash
npx firebase-tools functions:secrets:set OPENAI_API_KEY
# プロンプトで API キーを入力
```

**代替（旧来方式、非推奨）:**
```bash
npx firebase-tools functions:config:set openai.api_key="sk-..."
```

---

## I2: firebase/functions npm install がエージェント実行環境では不可

**状況:** エージェントが動作している bash 環境では npm コマンドが利用できないため、  
`firebase/functions/node_modules` が未インストールの状態。

**対応（ユーザー実行）:**
```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app\firebase\functions
npm install
npm run build
```

---

## I3: Functions のデプロイはユーザーが手動実行が必要

**状況:** Functions のデプロイ（`firebase deploy --only functions`）はエージェントから実行できない。

**対応（ユーザー実行）:**
```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx firebase-tools deploy --only functions --project <project-id>
```

---

## I4: OpenAI APIキー漏洩リスク（継続）

**状況:** OpenAI API キーは高価値の資産。漏洩すると第三者に無制限に使われるリスクがある。

**対応済み:** コードに APIキーを一切記載していない。Secret Manager を使う設計。

**対応（未実施）:** Secret Manager のローテーション設定は Phase 15 で検討。

---

## I5: Cloud Functions v2 と v1 の料金・制限の違い

**状況:** Firebase Functions v2 は Cloud Run ベース。v1 と料金体系が異なる。  
Phase 9 の使用量では無視できるが、将来的に確認が必要。

**対応:** Phase 15 の Analytics / Monitoring で監視する。

---

## I6: AI ハルシネーション

**状況:** LLM は入力にない情報を創作することがある。

**対応済み:** System Prompt で「入力にないことを書かない」を明示。  
場所は「グループ数」のみ渡し、具体的な地名は送らない。temperature=0.7。

---

## I7: Firestore の onSnapshot コスト増加

**状況:** `useNoteDetail` が `onSnapshot` でリアルタイム購読を使うため、  
`getNoteById`（1回取得）より Firestore の読み取りコストが増加する。

**影響:** ノート詳細画面を開いている間、変更があるたびに読み取りが発生する。  
通常の使用では無視できる水準（1ドキュメントの監視）。

**対応:** Phase 15 で監視する。

---

## I8: Functions リージョンと Functions URL

**状況:** `firebase/functions/src/index.ts` ではリージョンを明示指定していない。  
モバイル側の `client.ts` は `ENV.FIREBASE_FUNCTIONS_REGION`（デフォルト: `asia-northeast1`）を使う。  
Functions v2 はデプロイ時にリージョンを指定する必要がある。

**対応:** `onCall` の第1引数にリージョン設定を追加する必要がある場合：
```typescript
export const generateMemoryDiary = onCall(
  { secrets: [openaiApiKey], region: 'asia-northeast1' },
  async (request) => { ... }
);
```

デプロイ後に Functions URL を確認して、モバイル側のリージョン設定と一致しているかを確認すること。

---

## I9: AiDiarySection の Timestamp instanceof チェック

**状況:** `AiDiarySection.tsx` の `formatTimestamp` 関数で `instanceof Timestamp` を使用している。  
Firestore の `onSnapshot` から返ってくる `Timestamp` は通常 Firebase JS SDK の `Timestamp` クラスのインスタンスだが、  
エミュレーター環境やデータ変換の際に異なる型が返る可能性がある。

**対応:** `instanceof` チェックに加えて `ts.toDate` の存在確認で防御済み（AiDiarySection.tsx の型定義を参照）。

---

## I10: GPS 符号処理（Phase 8 からの継続課題）

**状況:** `usePhotoPicker.ts` の GPS 符号変換（N/S/E/W）が確認されていない。  
日本国内（北緯・東経）は問題なし。海外写真（南半球・西経）で緯度経度が逆になる可能性。

**対応:** Phase 10 以降で `usePhotoPicker.ts` を確認・修正予定。
