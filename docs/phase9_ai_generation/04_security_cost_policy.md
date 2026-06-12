# Phase 9: Security & Cost Policy

## 1. APIキー管理方針

### 絶対ルール

| ルール | 理由 |
|---|---|
| OpenAI API キーをモバイルアプリに入れない | アプリバイナリは解析可能。キーが漏洩すると無制限に悪用される |
| OpenAI API キーを `.env` に書かない | `.env` は環境変数ファイルであり、誤ってコミットされるリスクがある |
| OpenAI API キーを Git にコミットしない | GitHub に公開されると即座にスキャンツールで発見・悪用される |
| ログに API キーを出力しない | Cloud Logging / Crashlytics にキーが残るリスク |

### 推奨: Firebase Secret Manager

```bash
# Secret Manager に API キーを登録（1回のみ）
firebase functions:secrets:set OPENAI_API_KEY
# プロンプトでキーを入力（画面には表示されない）

# Functions コード内では環境変数として参照
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

Secret Manager を使うと：
- キーは暗号化して Google Cloud に保管される
- Functions の実行時のみ環境変数として注入される
- Firebase Console / IAM で誰がアクセスできるかを管理できる

### 代替: Functions 設定（旧来方式）

Secret Manager が使えない場合の代替：

```bash
# 設定（非推奨・平文で保存される）
firebase functions:config:set openai.api_key="sk-..."

# Functions コード内
const apiKey = functions.config().openai.api_key;
```

**Phase 9 では Secret Manager を優先する。**

## 2. モバイルにAPIキーを入れない理由（詳細）

React Native / Expo アプリはビルドされたバイナリに埋め込まれた文字列が  
ツールで抽出可能（`strings` コマンド等）。さらに：

- App Store / Google Play にリリースすると不特定多数がバイナリを入手できる
- キーを `app.json` / `.env` に入れると `EXPO_PUBLIC_*` 以外も誤って公開される可能性がある
- `EXPO_PUBLIC_*` 変数はクライアントバンドルに含まれ、ブラウザからも参照可能

**結論:** サーバー側（Cloud Functions）でのみ OpenAI API を呼び出す。

## 3. コスト制御

### gpt-4o-mini の料金目安（2026年時点の参考値）

- Input: 約 $0.15 / 1M tokens
- Output: 約 $0.60 / 1M tokens
- 1回の生成 (input ~500 tokens + output ~100 tokens): 約 $0.0001 未満

1万回の生成でも $1 程度。**Phase 9 では最小コストで動作する。**

### Phase 9 でのコスト制御方針

| 施策 | 内容 |
|---|---|
| モデル選択 | `gpt-4o-mini` を使用 |
| max_tokens | 300 に制限（出力の上限を絞る） |
| 入力サイズ制限 | メモは最大 200 文字に切り詰め |
| 撮影日時リスト | 最大 10 件に絞る |
| 1ノート連続生成制限 | 同じノートへの連続呼び出しは `aiDiaryStatus === 'generating'` 中は禁止 |

### Phase 15 以降での本格コスト制御

- Firebase Analytics でノートごとの生成回数を記録
- 1日 / 1ユーザーあたりの生成上限を Cloud Functions 内でチェック
- 異常な呼び出し増加を Cloud Monitoring でアラート
- 課金プランとの連動（無料プラン: 月5回まで等）

## 4. 1ノート連続生成制限（Phase 9 実装）

```typescript
// Functions 入口で generating 中の重複呼び出しを拒否
const currentStatus = noteData.aiDiaryStatus as string | undefined;
if (currentStatus === 'generating') {
  throw new functions.https.HttpsError(
    'already-exists',
    'AI生成が進行中です。しばらくお待ちください'
  );
}
```

モバイル側でも `aiDiaryStatus === 'generating'` のとき再生成ボタンを無効化する（UI制御）。

## 5. ログ方針

| ログレベル | 出力すること | 出力しないこと |
|---|---|---|
| INFO | noteId, uid（末尾4文字のみ可）, 生成成功/失敗 | APIキー, メモ全文, 日記全文 |
| WARN | OpenAI レスポンスが空だった | ユーザーの個人情報 |
| ERROR | OpenAI API エラーコード, Firestore 書き込み失敗 | APIキー, スタックトレース内の機密値 |

```typescript
// 良いログ例
console.log(`[generateMemoryDiary] noteId=${noteId} uid=***${uid.slice(-4)} status=completed`);

// 悪いログ例（やらない）
console.log(`APIキー: ${apiKey}`);
console.log(`生成結果: ${aiDiary}`); // 日記内容そのものは INFO ログに出さない
```

## 6. エラー時方針

- OpenAI API エラー → Firestore に `aiDiaryStatus: 'failed'` + エラーメッセージを保存
- Functions から `HttpsError('internal', ...)` を返す
- モバイル側は catch してエラーUI を表示する
- **ノート閲覧・写真・地図表示は影響を受けない**

生成失敗は独立した状態として扱う。ノート本体のデータ（title, memo, photos）は書き換えない。

## 7. 画像を送らない / Vision を使わない理由

| 理由 | 詳細 |
|---|---|
| コスト | Vision (gpt-4o) は gpt-4o-mini より約 15 倍高価 |
| プライバシー | ユーザーの写真を OpenAI に送ることへの同意説明コスト |
| スコープ | Phase 9 では文章生成の実現が先決 |
| 品質 | タイトル・メモ・日付・枚数だけでも十分な品質の日記が生成できる |

Phase 14（Settings / Privacy / Support）で AI 利用の説明文を追加する際に、  
「写真画像は AI に送信されていない」と説明できることはユーザー信頼に寄与する。

## 8. Firestore Security Rules への影響

Phase 9 では Cloud Functions（Firebase Admin SDK）経由で `aiDiary` フィールドを更新する。  
Admin SDK は Security Rules をバイパスするため、**Rules の変更は不要**。

ただし、将来的にモバイル側から直接 `aiDiary` を書くことを禁止するには、  
Rules で `aiDiary` フィールドの直接書き込みを制限することを検討する（Phase 15 以降）。

## 9. 個人情報の取り扱い

| データ | 送る / 送らない | 理由 |
|---|---|---|
| タイトル | 送る | ユーザーが入力した情報。生成に必須 |
| メモ（最大200文字） | 送る | ユーザーが入力した情報。上限切り詰め |
| 撮影日時 | 送る | 日付情報のみ（時刻まで不要なら "YYYY-MM-DD" のみ） |
| 場所グループ数 | 送る | 「何ヶ所」という数値のみ |
| UID | 送らない | AI 生成には不要 |
| メールアドレス | 送らない | AI 生成には不要 |
| 写真画像 | 送らない | Vision 不使用 |
| 具体的な緯度経度 | 送らない | グループ数のみで十分 |
