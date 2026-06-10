# AI Ops Agent Design v2

## 1. 目的

本設計は、Memory Note App / 思い出ノートアプリ の Release v1 以降において、  
**AIが運用保守を補助しつつ、半自動で安全に運用管理を行うための Agent 群**を定義するものです。

狙いは以下です。

- 障害・異常・コスト増加を早期検知する
- 日次/週次の運用レポートを自動化する
- 問い合わせ対応や定型運用の負荷を減らす
- 価格・制限・機能フラグの変更提案をAIに作らせる
- ただし、**本番の危険操作は必ず人間承認**にする
- AIが勝手に本番コード変更・本番デプロイ・課金変更・データ削除をしない

---

## 2. AI Opsの基本方針

### 2.1 基本原則

| 原則 | 内容 |
|---|---|
| AIは補助、最終判断は人間 | AIは検知・分析・提案・ドラフトまで |
| 危険操作禁止 | 本番変更、削除、制裁、課金変更は自動実行しない |
| 承認前提設計 | 変更は必ず `ops_approvals` を経由する |
| 監査可能性 | すべての提案・承認・反映を記録する |
| 最小送信 | AIへは必要最小限の非機微データのみ送る |
| 安全側デフォルト | 迷ったら停止、制限強化、保留 |
| コスト可視化 | Firebase / OpenAI / Map API / Storage / Functions を横断監視 |
| ストア整合重視 | サブスク価格や商品IDは App Store Connect / Play Console と整合させる |
| 端末・個人情報保護 | 写真本体、精密GPS、認証情報はAIへ送らない |
| 分離責務 | Admin Dashboard は操作UI、Cloud Functions は実行基盤 |

### 2.2 AI Opsの役割分担

- **AI**: 異常検知、要約、比較、提案、ドラフト作成、優先度付け
- **人間**: 承認、実行、例外判断、法務/課金/削除/停止判断
- **Cloud Functions**: 監査付きの実行、制限チェック、Config反映
- **Streamlit Dashboard**: 可視化、承認待ち、変更案の確認、操作実行

### 2.3 運用対象

AI Ops は以下を監視対象とします。

- Firebase Analytics
- Crashlytics
- Cloud Functions logs
- Firestore audit_logs
- usage_limits
- app_config
- subscription_plans
- support tickets
- app store reviews
- cost logs

---

## 3. Agent一覧

必須エージェントは以下です。

1. **Monitoring Analyst Agent**
2. **Cost Watch Agent**
3. **Incident Triage Agent**
4. **Security Review Agent**
5. **Release Review Agent**
6. **User Feedback Analyst Agent**
7. **Maintenance Planner Agent**
8. **Pricing Impact Analyst Agent**
9. **Support Draft Agent**

必要に応じて補助エージェントも追加可能ですが、v1の運用設計では上記を中核とします。

---

## 4. Agent別責務表

| Agent | 役割 | 入力データ | 出力 | 自動実行可否 | Human Approval |
|---|---|---|---|---|---|
| Monitoring Analyst Agent | 日次・週次の健全性監視、異常傾向の要約 | Analytics, Crashlytics, Cloud Functions logs, cost logs, usage_limits | daily report, anomaly summary, alert candidates | 可（分析のみ） | 不要 |
| Cost Watch Agent | 各種コスト監視、増加兆候の検知 | cost logs, app_config, usage_limits, Cloud Functions logs, Firestore usage | cost report, threshold alerts, cost reduction proposals | 可（提案まで） | 変更反映時は必要 |
| Incident Triage Agent | 障害の一次切り分け、優先度分類、影響範囲整理 | Crashlytics, logs, audit_logs, support tickets, Analytics | incident summary, severity, suspected cause, next actions | 可（分類のみ） | 修復反映や停止解除は必要 |
| Security Review Agent | 権限逸脱、監査異常、危険操作候補の検知 | audit_logs, app_config, security-related logs, role changes | security alert, suspicious activity report, containment proposal | 可（検知のみ） | 制裁・ルール変更は必要 |
| Release Review Agent | リリース前後の回帰・品質・リスク評価 | Crashlytics, Analytics, Cloud Functions logs, app_config diff, release notes | release risk report, go/no-go recommendation | 可（提案のみ） | 本番リリース判断は必要 |
| User Feedback Analyst Agent | 問い合わせ・レビュー・不満点の分類と傾向分析 | support tickets, app store reviews, Analytics | feedback summary, issue clusters, UX pain points | 可（分析のみ） | 不要 |
| Maintenance Planner Agent | 低リスク保守タスクの提案、定型作業の計画 | Monitoring reports, cost reports, incident summaries, usage trends | maintenance task proposal, priority queue, schedule draft | 可（提案のみ） | 実施承認が必要な場合あり |
| Pricing Impact Analyst Agent | 価格変更・プラン変更の影響予測 | subscription_plans, app_config, sales/cancellation metrics, reviews, support tickets | pricing impact report, scenario comparison, risk notes | 可（分析のみ） | 価格変更反映は必要 |
| Support Draft Agent | 問い合わせ返信文の下書き作成 | support tickets, FAQ, policies, incident summaries | support response draft, escalation suggestion | 可（下書きのみ） | 送信前確認が必要 |

---

## 5. 入力データ設計

AI Ops は、機微情報を避けつつ、運用判断に必要な最小限のデータを使います。

### 5.1 主要入力ソース

#### 1) Crashlytics
- crash count
- affected app version
- affected device model
- stack trace summary
- crash frequency
- screen name
- release version

#### 2) Analytics
- app_open
- note_create_start / note_save_complete
- photo_upload_complete
- ai_generate_start / ai_generate_success
- share_card_generate
- share_sheet_open
- retention / conversion / funnel metrics

#### 3) Cloud Functions logs
- function name
- success/failure
- latency
- timeout
- retry count
- API error code
- requestId
- sanitized payload summary

#### 4) Firestore audit_logs
- actor userId
- actor role
- operation type
- target resource
- approval status
- timestamp
- source (dashboard/function)
- result

#### 5) usage_limits
- user daily AI count
- note daily AI count
- share card generation count
- rate-limited count
- storage quota usage
- plan-based allowance usage

#### 6) app_config
- feature flags
- AI rate limits
- storage limits
- emergency stop flags
- default UI labels
- plan visibility
- remote config-like settings

#### 7) subscription_plans
- plan id
- plan name
- monthly/yearly price
- quota
- feature entitlements
- store product id mapping
- availability status

#### 8) support tickets
- category
- severity
- device / platform
- short issue summary
- current status
- response SLA
- related note (if needed, IDのみ)

#### 9) app store reviews
- store name
- rating
- review text summary
- version
- sentiment tag
- topic tag

#### 10) cost logs
- Firebase auth/firestore/storage/functions cost
- OpenAI API cost
- Map / Geocoding API cost
- cloud resource trend
- daily and monthly spend
- budget threshold usage

### 5.2 追加の推奨入力
- release version history
- feature flag change history
- incident history
- approval history
- rollout history
- maintenance backlog
- FAQ updates

---

## 6. AIへ送ってよいデータ

AIへ送ってよいのは、**運用上必要で、個人を特定しない、または十分に匿名化・要約されたデータ**です。

### 6.1 送信可能データ
- 集計済み Analytics 指標
- Crashlytics のクラッシュ概要
- Cloud Functions のエラー概要
- コスト集計値
- Feature flag の状態
- `app_config` の設定値
- `subscription_plans` のプラン定義
- FAQ/テンプレート文
- 監査ログの操作種別・結果
- サポートチケットの要約
- ストアレビューの要約
- 変更前後差分の要約
- ルール違反の検知結果

### 6.2 送信時の整形ルール
- userId は原則ハッシュ化または匿名化
- 写真本体は送らない
- 精密GPSは送らない
- メールアドレスは送らない
- 認証トークンは送らない
- 招待トークンは送らない
- 生の個人メモ全文は送信しない
- 位置情報は市区町村/エリア単位まで丸める
- 問い合わせ本文は必要部分のみ抜粋する
- 可能な限り件数・比率・傾向で送る

### 6.3 送信例
- 「iOS 1.0.3 で写真アップロード失敗率が 3.2% に上昇」
- 「OpenAI 日次利用が前週比 +18%、特定ノートで再生成が集中」
- 「Google Play レビューでログイン失敗の指摘が増加」
- 「storage cost が月初比で +22%」

---

## 7. AIへ送ってはいけないデータ

以下は **原則禁止** です。

- 写真本体
- 圧縮画像の生データ
- サムネイルの原画像
- 精密GPS座標
- 住所レベルの位置情報
- 連絡先
- メールアドレス
- パスワード
- 認証トークン
- OAuthトークン
- 招待トークン
- Firebase Admin SDK秘密鍵
- OpenAI APIキー
- ストア課金の秘密情報
- 支払いカード情報
- ユーザーメモ全文の無制限送信
- 個人制裁判断に必要な生データをAIだけで完結させること
- Security Rules の生コードをAIへ渡して自動反映させること
- 本番データ削除対象の個票をそのまま送ること

---

## 8. AI Ops実行頻度

### 8.1 daily
毎日実行するもの。

- Monitoring Analyst Agent
- Cost Watch Agent
- User Feedback Analyst Agent
- Support Draft Agent
- Security Review Agent の軽量チェック

### 8.2 weekly
週次で実行するもの。

- Release Review Agent
- Pricing Impact Analyst Agent
- Maintenance Planner Agent
- 週次版 Monitoring / Cost / Feedback 集約
- 失敗傾向・継続率・解約傾向レビュー

### 8.3 release before/after
リリース前後で実行するもの。

- Release Review Agent
- Security Review Agent
- Cost Watch Agent
- Incident Triage Agent
- Pricing Impact Analyst Agent

### 8.4 incident triggered
障害検知時に実行するもの。

- Incident Triage Agent
- Monitoring Analyst Agent
- Security Review Agent
- Support Draft Agent

### 8.5 cost threshold triggered
コスト閾値超過時に実行するもの。

- Cost Watch Agent
- Pricing Impact Analyst Agent
- Maintenance Planner Agent
- Monitoring Analyst Agent

---

## 9. AI Ops出力フォーマット

### 9.1 daily report
日次レポートの標準出力。

- date
- overall status
- notable changes
- top anomalies
- cost summary
- user impact summary
- recommended actions
- approval-needed items
- linked evidence

### 9.2 incident summary
障害要約。

- incident id
- severity
- start time / detection time
- affected scope
- suspected cause
- user impact estimate
- current status
- mitigation proposal
- rollback suggestion
- owner / assignee
- approval-needed actions

### 9.3 cost report
コストレポート。

- category
- current spend
- previous period comparison
- trend
- threshold status
- suspected drivers
- reduction options
- recommended config changes
- approval-needed items

### 9.4 release risk report
リリースリスクレポート。

- release version
- changed area
- risk level
- regression signals
- monitoring focus
- go / no-go recommendation
- rollback plan
- approval summary

### 9.5 maintenance task proposal
保守タスク提案。

- task title
- reason
- expected impact
- urgency
- effort estimate
- dependencies
- required approval
- suggested schedule

### 9.6 support response draft
サポート返信ドラフト。

- ticket id
- category
- tone
- draft reply
- suggested internal note
- escalation needed or not
- safety check note

---

## 10. 自動化可能な処理

AIまたは自動ジョブで実行してよいのは、**低リスク・可逆・承認不要の定型処理**です。

### 10.1 自動化可
- 日次集計
- 週次レポート作成
- 異常兆候の検知
- レポートの下書き生成
- 問い合わせ分類
- FAQ候補抽出
- コスト増加要因の推定
- `app_config` 変更案の作成
- 共有前の安全チェック
- 監査ログの集約
- メンテナンスタスクの優先度付け
- 既知障害のテンプレート化

### 10.2 自動化してよいが、実行は人間承認後
- feature flag の変更反映
- AI回数制限の変更反映
- ストレージ上限変更反映
- サブスク価格案の反映
- サポートテンプレ送信
- 緊急停止の解除
- 重要なアラート抑制設定の変更

---

## 11. Human Approval必須処理

以下は必ず人間承認が必要です。

| 処理 | 理由 |
|---|---|
| 本番デプロイ | 影響範囲が大きい |
| 課金仕様変更 | ストア整合が必要 |
| サブスク価格変更 | 売上・審査に影響 |
| プラン範囲変更 | 既存ユーザー影響が大きい |
| AI回数制限の大幅変更 | UX / コストに影響 |
| ストレージ上限変更 | コストと保存継続に影響 |
| Feature Flag 本番反映 | 体験を即時変える |
| Security Rules変更 | アクセス事故リスクが高い |
| データ削除 | 復元不可 |
| ユーザー制裁 | 誤判定・法務リスク |
| プライバシーポリシー変更 | 法務・審査・同意に影響 |
| 利用規約変更 | 同意条件が変わる |
| 緊急停止解除 | 再開判断が重要 |
| app_config の危険値変更 | 誤設定の影響が大きい |
| subscription_plans の商品ID変更 | ストア整合を崩す可能性 |
| Storage retention policy 変更 | 削除・保存に直結 |

### Human Approvalの推奨条件
- 変更前後の差分表示
- 影響ユーザー数の表示
- ロールバック案の提示
- 承認者2名ルール
- 監査ログ自動保存
- 実行時刻の記録

---

## 12. AI Ops用Firestore Collections

以下のコレクションを追加する。

### 12.1 `ops_reports`
日次/週次/リリースレポートを保存する。

例:
- reportId
- reportType: `daily | weekly | release_risk | cost`
- createdAt
- generatedByAgent
- summary
- severity
- recommendedActions
- approvalRequired
- relatedMetricsRef
- status

### 12.2 `ops_alerts`
アラートを管理する。

例:
- alertId
- alertType
- source
- severity
- detectedAt
- message
- evidenceRefs
- assignedTo
- status
- acknowledgedAt
- resolvedAt

### 12.3 `ops_tasks`
運用タスクのバックログ。

例:
- taskId
- taskType
- title
- reason
- priority
- estimate
- dependencies
- suggestedByAgent
- approvalRequired
- status
- owner
- dueDate

### 12.4 `ops_approvals`
承認ワークフロー。

例:
- approvalId
- targetType
- targetId
- requestedBy
- requestedAt
- approvedBy
- approvedAt
- decision: `approved | rejected | pending`
- rationale
- diffSummary
- riskLevel

### 12.5 `support_drafts`
サポート返信案。

例:
- draftId
- ticketId
- channel
- category
- draftText
- tone
- generatedByAgent
- reviewedBy
- status
- sentAt

### 12.6 `cost_snapshots`
コストの時系列記録。

例:
- snapshotId
- date
- firebaseCost
- openAICost
- mapApiCost
- storageCost
- functionsCost
- totalCost
- budgetLimit
- anomalyFlag
- notes

### 12.7 `ai_ops_runs`
AI Ops の実行記録。

例:
- runId
- runType
- agentName
- triggerType
- startedAt
- finishedAt
- inputSummary
- outputSummary
- status
- approvalRequired
- approvalId
- errorCode

---

## 13. AI Ops安全設計

### 13.1 権限設計
- Admin Viewer
- Admin Operator
- Approver
- Super Admin

### 13.2 実行ガード
- 管理者認証必須
- 2段階承認推奨
- 危険操作は二重確認
- 変更差分を常に表示
- 本番/検証を分離
- 緊急停止中は変更を抑止

### 13.3 AIの行動制限
- AIは提案まで
- AIは本番へ直接書き込まない
- AIは削除を実行しない
- AIは課金商品を変更しない
- AIはSecurity Rulesを編集しない
- AIはユーザー制裁を実行しない
- AIはプライバシーポリシーを変更しない

### 13.4 監査
- 全AI Ops実行を `ai_ops_runs` に保存
- 人間承認を `ops_approvals` に保存
- 運用変更を `audit_logs` にも残す
- 変更前後の `app_config` 差分を記録
- 失敗時はエラー分類を保存

### 13.5 失敗時方針
- AI失敗でもレポート生成を止めない
- フォールバック文を返す
- 重大判断は人間へエスカレーション
- 疑義がある場合は保守的判断を採用する

---

## 14. Streamlit Dashboardとの連携

Streamlit は管理者が運用を見て、AI提案を確認し、承認し、反映するための中核UIです。

### 14.1 画面構成案
- Overview
- Alerts
- Cost
- Releases
- Pricing
- Feature Flags
- Support
- Security
- Approvals
- Audit Logs
- Config Editor

### 14.2 Dashboardでできること
- 日次/週次レポート閲覧
- コスト推移グラフ
- AI提案一覧
- 承認待ち一覧
- `app_config` 編集
- Feature Flag 切替
- 価格案比較
- 問い合わせ一覧
- レビュー一覧
- 緊急停止の発動
- 差分確認
- 監査ログ確認

### 14.3 Dashboardでできないこと
- 本番コードの直接編集
- ユーザーデータの即時削除
- 承認なしの課金変更
- Security Rules の直接書換え
- 秘密鍵の表示
- 制裁の自動実行

### 14.4 Streamlit実装上の注意
- 認証を必須化
- IP制限または追加認証
- 重要操作は二段階確認
- 変更案と実反映を分離
- Sandbox環境での試行を可能にする
- `app_config` の反映は Function 経由で監査付きにする

---

## 15. Cloud Functions / Scheduled Functionsとの連携

### 15.1 Scheduled Functions
定期実行で以下を行う。

- daily report 生成
- cost snapshot 取得
- anomaly detection
- support draft 初期案生成
- weekly release risk report
- stale alert 自動整理
- maintenance backlog 更新

### 15.2 Event-driven Functions
以下のイベントで AI Ops をトリガーする。

- Crashlytics急増
- Firestoreエラー増加
- Functions失敗率上昇
- cost threshold 超過
- app_config変更提案
- support ticket急増
- app store review低評価増加
- subscription churn増加

### 15.3 Functionsの責務
- データ集約
- 要約の前処理
- AI呼び出し
- 出力保存
- 承認状態の確認
- 反映前チェック
- 監査ログ書き込み

### 15.4 反映系 Function
反映は必ず承認済みのみ。

- `applyAppConfigChange`
- `applyFeatureFlagChange`
- `applyPricingChange`  
- `applyLimitChange`
- `triggerEmergencyStop`
- `releaseEmergencyStop`
- `createApprovalRequest`
- `finalizeApprovedAction`

---

## 16. 未決定事項

以下は人間が最終判断すべき未決定事項です。

1. `app_config` のキー命名規則
2. Feature Flag の粒度
3. 価格改定時の既存ユーザー保護方針
4. AI回数制限の初期値
5. ストレージ上限の初期値
6. 緊急停止の対象範囲
7. 承認者2名ルールの適用範囲
8. 支援テンプレートの自動送信可否
9. APIごとのコストアラート閾値
10. ストア価格差分の許容範囲
11. 管理者ロールの運用人数
12. 監査ログの保持期間
13. 問い合わせの自動クローズ条件
14. 低評価レビューへの自動返信可否
15. データ削除の保留期間

必要であれば次に、これをそのまま実装用に落とした  
**「AI Ops 用 Firestore データモデル v1」** と  
**「Streamlit 管理画面の画面一覧・権限設計」** まで続けて作成できます。