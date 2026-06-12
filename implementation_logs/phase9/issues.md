# Phase 9 Issues — AI Generation via Cloud Functions

## I1: OpenAI APIキー漏洩リスク

**状況:** OpenAI API キーは高価値の資産。漏洩すると第三者に無制限に使われるリスクがある。

**影響:** APIコストが爆発的に増加する可能性がある。

**対応:**
- Cloud Functions の Secret Manager に保管する（`04_security_cost_policy.md` 参照）
- `.env` / ソースコード / Git に記載しない
- Firebase Console の Secret Manager で定期ローテーションを検討（Phase 15）

---

## I2: OpenAI API コスト

**状況:** gpt-4o-mini は非常に安価だが、ユーザー数が増えると無視できなくなる。

**影響:** 月間コストが予期せず増加する可能性がある（1万ユーザーが月10回生成 = $1 程度）。

**対応（Phase 9）:** 同一ノートの `generating` 中の重複呼び出しを拒否する。

**対応（Phase 15）:** Firebase Analytics でユーザーごとの生成回数を記録し、上限を設ける。

---

## I3: Cloud Functions の課金

**状況:** Firebase Cloud Functions は呼び出し回数・実行時間・メモリで課金される。  
OpenAI API の呼び出し待ち（最大数秒）の間も Functions の実行時間としてカウントされる。

**影響:** 1呼び出しあたり数秒 × 呼び出し回数がコストに影響する。

**対応:** gpt-4o-mini の応答は通常 2〜5 秒。Functions の最小メモリ（256MB）で十分なので  
コストは無視できる水準（100万呼び出しで $0.40 程度）。Phase 15 で監視する。

---

## I4: AI ハルシネーション（事実でないことを断言する）

**状況:** LLM は入力にない情報を創作することがある（場所名・人名・出来事など）。

**影響:** ユーザーが「自分の思い出」として誤った記述を見てしまう。

**対応:**
- System Prompt で「入力にないことを書かない」「具体的な場所名・人名を創作しない」を明示
- 場所情報は「グループ数」のみ渡し、具体的な地名・座標は渡さない
- モデルは temperature=0.7 に設定（0.9 以上は創作が過剰になりやすい）
- 詳細は `03_openai_prompt_design.md` のハルシネーション防止セクションを参照

---

## I5: 生成品質のばらつき

**状況:** メタデータが少ないノート（タイトルのみ、写真0枚等）では生成品質が低くなる可能性がある。

**影響:** ユーザー体験が悪くなる可能性がある。

**対応:** メモが充実しているほど品質が上がることをユーザーに案内する（Phase 14 の UI 文言で対応）。  
Phase 9 では品質の完全保証は目標にしない。

---

## I6: Rate Limit（OpenAI API 側）

**状況:** OpenAI API にはレート制限がある（Tier によるが通常は問題にならない）。  
同時に大量リクエストが来ると `429 Too Many Requests` エラーが発生する。

**影響:** 大量ユーザーが同時に生成ボタンを押すと一時的に失敗する可能性がある。

**対応（Phase 9）:** `aiDiaryStatus: 'failed'` として記録し、再試行ボタンを表示する。  
指数バックオフ・キューイングは Phase 15 以降。

---

## I7: Retry 設計の不備

**状況:** Phase 9 では失敗した場合にユーザーが「再試行」ボタンを手動で押す設計。  
自動リトライは実装しない。

**影響:** 一時的な OpenAI API 障害時にユーザーが手動で再試行する必要がある。

**対応（Phase 9）:** 失敗時は明確なエラーUI + 再試行ボタンを表示する。  
自動リトライは Phase 15 以降に実装する。

---

## I8: 個人情報を送る範囲の判断

**状況:** ノートのメモにはユーザーの個人的な情報が含まれる可能性がある。  
このメモを OpenAI API に送ることはプライバシー上の考慮が必要。

**影響:** ユーザーが OpenAI へのデータ送信に同意していない可能性がある。

**対応:**
- メモは最大 200 文字に切り詰めて送る（全文送信を避ける）
- Phase 14（Settings / Privacy / Support）で「AI 日記生成時にタイトル・メモ・撮影日等のメタデータを利用します」の説明を追加する
- 写真画像は送らない点を明示する

---

## I9: ログにメモ全文を出しすぎない

**状況:** Cloud Functions のログに AI への入力内容（メモ等）を詳細出力すると、  
Cloud Logging に個人情報が残り続けるリスクがある。

**影響:** 情報漏洩リスク、プライバシー規制への抵触リスク。

**対応:**
- `console.log` ではメモ本文・AI 生成結果を出力しない
- ログは noteId・uid（末尾4文字のみ）・成功/失敗ステータスのみ
- 詳細は `04_security_cost_policy.md` のログ方針セクションを参照

---

## I10: firebase/functions/package.json が未作成

**状況:** `firebase/functions/src/index.ts` は存在するが、`firebase/functions/package.json` が見当たらない。  
`firebase functions:shell` や `firebase deploy --only functions` の実行前に確認が必要。

**影響:** Functions のビルドが通らない可能性がある。

**対応:** Phase 9 実装着手前に `firebase/functions/` ディレクトリを確認し、  
`package.json`, `tsconfig.json` が存在するかを確認する。なければ `firebase init functions` で生成する。

---

## I11: onSnapshot vs 1回取得の選択

**状況:** Detail 画面は現在 `getNoteById`（1回取得）を使っている。  
AI 生成中のステータス変化をリアルタイムで反映するには `onSnapshot` が必要。

**影響:** `onSnapshot` に変更すると既存のロード処理を書き直す必要がある。

**対応:** `useNoteDetail` Hook を新規作成し、`onSnapshot` を使う。  
既存の `getNoteById` による取得は削除するか、新 Hook に統合する。  
これは Phase 9 実装時に判断する（Planning では選択肢として記録）。
