# Monitoring Alerting Spec v2  
Memory Note App / 思い出ノートアプリ  
Release v1 以降の運用向け

---

## 1. 目的

本仕様は、Memory Note App / 思い出ノートアプリ の本番運用において、  
**障害・品質劣化・コスト増・セキュリティ異常・ユーザー体験低下** を早期検知し、  
**AI Ops による分析・提案** と **人間による最終判断** を両立するための監視・アラート設計です。

主な目的は以下です。

- 主要機能の失敗を早く検知する
- 収益性を損なうコスト増を早く検知する
- 位置情報・共有・権限まわりの事故を防ぐ
- AI の失敗や暴走を抑える
- 問い合わせやレビュー悪化を早く把握する
- AI Ops が一次分析を行い、運用担当者の判断を支援する
- 危険な操作は必ず人間承認にする

---

## 2. 監視対象

以下を必須監視対象とします。

### 2.1 アプリ品質
- App crash rate
- ANR / freeze rate
- login failure
- photo upload failure
- AI generation failure
- share card generation failure
- note save failure
- permission denied rate
- app startup failure

### 2.2 Backend品質
- Cloud Functions error
- Cloud Functions timeout
- Firestore read/write volume
- Firestore permission errors
- Storage usage
- Storage upload/delete failures
- invitation create/accept failures
- delete flow failures

### 2.3 コスト
- OpenAI API cost
- Map API cost
- Firebase cost
- Storage cost
- Cloud Functions cost

### 2.4 事業・継続利用
- subscription conversion
- churn
- trial-to-paid conversion
- renewal failure
- revenue trend

### 2.5 サポート・評判
- support tickets
- app store reviews
- review rating trend
- support SLA breach

### 2.6 セキュリティ・権限
- unauthorized access attempts
- role mismatch
- deleted-note access attempts
- invitation abuse
- suspicious config changes
- emergency stop usage

---

## 3. Metrics一覧

| Metric | Source | Threshold | Alert Level | Action |
|---|---|---|---|---|
| App crash rate | Crashlytics | 直近24hでセッション比 2%超 | Warning | AI Opsが端末別・バージョン別に要因分析し、人間へ通知 |
| App crash rate | Crashlytics | 直近24hでセッション比 5%超 | Critical | 即時通知、該当リリースの影響確認、必要ならロールバック提案 |
| App startup failure | Analytics / Crashlytics | 1時間で継続増加 | Warning | 起動導線・認証導線を重点確認 |
| login failure | Firebase Auth / Analytics | 直近24hで失敗率 5%超 | Warning | プロバイダ別に分析、UI文言確認 |
| login failure | Firebase Auth / Analytics | 直近24hで失敗率 15%超 | Critical | 認証障害の可能性として即通知 |
| photo upload failure | Cloud Functions / Storage logs | 直近24hで 3%超 | Warning | 圧縮処理・Storage・権限を確認 |
| photo upload failure | Cloud Functions / Storage logs | 直近24hで 10%超 | Critical | アップロード停止検討、ユーザー影響通知 |
| AI generation failure | Cloud Functions logs | 直近24hで 5%超 | Warning | OpenAI応答、プロンプト、レート制限を確認 |
| AI generation failure | Cloud Functions logs | 直近24hで 15%超 | Critical | AI機能一時停止提案、フォールバック強制 |
| share card generation failure | Cloud Functions logs | 直近24hで 5%超 | Warning | フォント、レンダリング、Storageを確認 |
| share card generation failure | Cloud Functions logs | 直近24hで 15%超 | Critical | 共有カード生成を停止または制限 |
| note save failure | Firestore logs / Analytics | 直近24hで 3%超 | Warning | 保存フローを重点調査 |
| note save failure | Firestore logs / Analytics | 直近24hで 10%超 | Critical | データ損失リスクとして即対応 |
| permission denied rate | Firestore Security Rules logs | 直近24hで急増 | Warning | Rules変更、UI不整合、権限バグを調査 |
| permission denied rate | Firestore Security Rules logs | 短時間に大量発生 | Critical | 権限事故の可能性として緊急確認 |
| Cloud Functions error rate | Cloud Functions logs | 直近1hで 5%超 | Warning | 関数別に切り分け |
| Cloud Functions error rate | Cloud Functions logs | 直近1hで 15%超 | Critical | 関数停止/切り戻し検討 |
| Cloud Functions timeout rate | Cloud Functions logs | 直近1hで 3%超 | Warning | 重い処理・外部API遅延を確認 |
| Cloud Functions timeout rate | Cloud Functions logs | 直近1hで 10%超 | Critical | AI・画像生成・地図系を優先確認 |
| Firestore read volume | Usage logs | 前週平均比 +30% | Warning | クエリ増加・一覧の再取得を調査 |
| Firestore read volume | Usage logs | 前週平均比 +80% | Critical | キャッシュ不足やループ取得を確認 |
| Firestore write volume | Usage logs | 前週平均比 +30% | Warning | 再生成ループや重複保存を調査 |
| Firestore write volume | Usage logs | 前週平均比 +80% | Critical | 書き込み暴走の可能性 |
| Storage usage | Storage usage logs | 週次増加率が想定超過 | Warning | 大容量ノート・原本混入を調査 |
| Storage usage | Storage usage logs | 月次予算の 80% 到達 | Critical | 上限調整検討、原本保存状況確認 |
| OpenAI API cost | Billing logs | 日次予算の 70% 到達 | Warning | 再生成抑制、プロンプト見直し提案 |
| OpenAI API cost | Billing logs | 日次予算の 100% 超過 | Critical | AI機能制限または緊急停止提案 |
| Map API cost | Billing logs | 月次予算の 70% 到達 | Warning | Geocodingキャッシュ確認 |
| Map API cost | Billing logs | 月次予算の 100% 超過 | Critical | 逆ジオコーディング頻度抑制 |
| Firebase cost | Billing logs | 月次予算の 80% 到達 | Warning | 主要コスト要因の特定 |
| Firebase cost | Billing logs | 月次予算の 100% 超過 | Critical | 追加制限の検討 |
| Cloud Functions cost | Billing logs | 前週比 +40% | Warning | 重い関数・再試行暴走を確認 |
| Cloud Functions cost | Billing logs | 前週比 +100% | Critical | 機能停止候補を提示 |
| subscription conversion | Analytics / Billing | 目標比 -20% | Warning | 課金導線・価格表現を確認 |
| subscription conversion | Analytics / Billing | 目標比 -40% | Critical | プラン訴求と価格整合を再評価 |
| churn | Billing / Analytics | 直近月で急増 | Warning | 解約理由の要約をAI Opsが作成 |
| churn | Billing / Analytics | 前月比 +50% | Critical | 価格/機能変更の影響確認 |
| renewal failure | Store / Billing | 失敗率 5%超 | Warning | ストア課金連携・通知を確認 |
| renewal failure | Store / Billing | 失敗率 15%超 | Critical | 課金整合性の緊急確認 |
| support tickets | Support system | 24hで急増 | Warning | 問い合わせ分類をAI Opsが実施 |
| support tickets | Support system | 重大カテゴリが連続発生 | Critical | 障害起点として調査 |
| app store reviews | App Store / Play Console | 平均評価 4.0未満 | Warning | レビュー要約と改善点抽出 |
| app store reviews | App Store / Play Console | 平均評価 3.5未満 | Critical | 重大UX/障害の可能性として対応 |
| unauthorized access attempts | Audit logs / Rules logs | 短時間に連続発生 | Warning | 権限設計または攻撃を調査 |
| unauthorized access attempts | Audit logs / Rules logs | 異常増加 | Critical | 緊急確認、人間通知 |
| suspicious config changes | Audit logs | production設定変更試行 | Warning | 変更内容と承認状況を確認 |
| suspicious config changes | Audit logs | 未承認の重要設定変更 | Emergency | 即時停止、承認経路確認 |

---

## 4. Alert Level

### 4.1 Info
- 軽微な変化
- 監視対象の傾向変化
- すぐの対応は不要
- AI Ops がレポートに記録

### 4.2 Warning
- 予兆または軽度の異常
- 放置すると悪化する可能性あり
- AI Ops が分析し、人間へ通知候補を出す
- 原則、営業時間内対応

### 4.3 Critical
- ユーザー影響またはコスト影響が明確
- 早急な確認が必要
- 人間へ即通知
- 変更停止、機能停止、ロールバック提案を含む

### 4.4 Emergency
- セキュリティ事故、データ損失、未承認重要変更の疑い
- 即時対応が必要
- 人間へ緊急通知
- 緊急停止フラグの発動候補を提示
- 解除は Human Approval 必須

---

## 5. AI Opsによる分析

AI Ops は「監視」「要約」「原因候補の提示」「対応案の作成」を担当します。  
ただし、**自動実行はしません**。

### AI Opsの役割
- 指標の異常検知
- 原因候補の要約
- 影響範囲の整理
- 変更候補の提案
- レポート生成
- 問い合わせ分類
- 返信ドラフト作成
- 価格・制限変更の影響分析
- 緊急停止の提案

### AI Opsの出力例
- 「iOS 1.0.3 でログイン失敗が増加。Apple認証失敗が主因候補」
- 「OpenAI cost が増加。AI再生成が特定ノートで集中」
- 「Storage usage 増加。原本保存混入の可能性」
- 「Security Rules の permission denied が増加。Editor権限の更新漏れの可能性」

### AI Opsがしてはいけないこと
- 本番コード変更
- 本番デプロイ
- 課金変更の確定
- Security Rules 変更の確定
- データ削除
- ユーザー制裁
- 緊急停止解除
- プライバシーポリシー変更

### AI Opsの分析粒度
- 日次サマリー
- 週次サマリー
- 影響バージョン別分析
- 機能別分析
- プラン別分析
- 端末別分析
- 地域別分析は必要最小限

---

## 6. 人間通知

### 6.1 通知対象
人間へ通知する対象は以下です。

- admin
- operator
- support
- 重大障害時の責任者

### 6.2 通知チャネル
- Slack / Teams / Email
- 監視ダッシュボード内通知
- 必要に応じてモバイル通知
- 緊急時のみ電話連絡体制を別途用意してよい

### 6.3 通知基準
- Warning: ダッシュボード + 低優先通知
- Critical: 即時通知
- Emergency: 即時通知 + エスカレーション

### 6.4 通知に含めるべき項目
- 何が起きたか
- いつ起きたか
- 影響範囲
- 主要候補原因
- 直近の関連変更
- 推奨アクション
- 承認が必要かどうか

### 6.5 通知に含めないべき項目
- 写真本体
- 精密GPS
- 認証情報
- 招待トークン
- 個人メモ全文
- 不必要な個人情報

---

## 7. Dashboard表示

### 7.1 Overview
- 現在の警告数
- Critical / Emergency 件数
- 主要KPI
- コスト推移
- AI利用量
- 最新インシデント
- 承認待ち件数

### 7.2 監視カード
各カードに以下を表示する。
- 指標名
- 現在値
- 前日比 / 前週比
- しきい値
- 状態色
- 推奨アクション

### 7.3 グラフ
- 24時間推移
- 7日推移
- 月次推移
- 予算消化率
- 失敗率推移

### 7.4 Drill-down
- バージョン別
- 端末別
- 機能別
- ノート種別別
- プラン別

### 7.5 表示原則
- まず異常が見える
- 次に原因候補
- 最後に実行すべき行動
- 運用担当が5分で判断できることを目標にする

---

## 8. Cost Monitoring

### 8.1 監視対象
- OpenAI API
- Firebase Auth
- Firestore
- Storage
- Cloud Functions
- Map API / Geocoding API
- ストア課金手数料

### 8.2 監視ポイント
- 日次コスト
- 月次累計
- 前週比 / 前月比
- 機能別コスト
- ユーザー単位コスト
- ノート単位コスト
- 異常増加の原因候補

### 8.3 対応
- Warning: 使われ方の分析と抑制提案
- Critical: 機能制限候補の提示
- Emergency: 緊急停止候補の提示

### 8.4 AIの役割
- コスト増の説明文作成
- 価格改定シナリオ比較
- 制限値変更案の提案
- 低コスト化案の提案

### 8.5 人間承認が必要な変更
- AI回数制限の大幅変更
- ストレージ上限変更
- プラン価格変更
- 外部API予算変更
- 本番反映

---

## 9. Security Monitoring

### 9.1 監視対象
- 権限エラー増加
- 不正アクセス試行
- 招待トークン濫用
- Owner以外の削除試行
- Viewer の編集試行
- Security Rules 変更試行
- 緊急停止解除試行
- 未承認 config 変更試行

### 9.2 検知ルール
- 同一 userId からの連続失敗
- 同一 noteId への異常アクセス
- 招待受諾失敗の連続
- 重要設定の未承認変更
- 監査ログ不整合

### 9.3 対応
- AI Ops がパターンを要約
- 人間が真偽を確認
- 必要なら機能停止
- 必要なら承認フローに回す

### 9.4 禁止事項
- AIによる自動制裁
- AIによる自動削除
- AIによる自動ルール改変

---

## 10. User Experience Monitoring

### 10.1 監視対象
- login success rate
- note creation completion rate
- upload completion rate
- AI生成到達率
- share card生成率
- 保存完了率
- 離脱率
- 画面滞在時間
- エラー画面到達率

### 10.2 主なUX異常
- 認証で離脱
- 写真選択後に落ちる
- アップロード中断
- AI結果待ちで離脱
- 地図表示で遅延
- 共有カード生成失敗
- 削除確認で迷う

### 10.3 対応
- AI Ops がファネルを分析
- 人間がUI改善を判断
- 重大な場合は機能フラグで抑制

---

## 11. Scheduled Reports

### 11.1 日次レポート
- 主要KPI
- 失敗率
- コスト
- 障害
- 問い合わせ
- 重要な変更候補

### 11.2 週次レポート
- トレンド比較
- 機能別利用率
- プラン別利用率
- コスト増減
- リスク一覧
- 改善提案

### 11.3 月次レポート
- 収益・解約・転換
- 主要コスト
- ユーザー体験の変化
- セキュリティイベント
- 運用上の改善提案

### 11.4 配信先
- admin
- operator
- support
- 事業責任者

---

## 12. Firestore保存先

監視・アラート・運用レポートは Firestore に保存します。

### 推奨コレクション
- `ops_metrics`
- `ops_alerts`
- `ops_incidents`
- `ops_reports`
- `ops_approvals`
- `ops_actions`
- `audit_logs`
- `app_config`
- `feature_flags`
- `subscription_plans`
- `usage_limits`

### 保存内容の例
- metric 名
- value
- threshold
- alert level
- timestamp
- source
- related entity
- report summary
- approval status
- actor
- before / after

### 保存原則
- 個人情報は最小限
- 写真本体は保存しない
- 精密位置は保存しない
- 認証情報は保存しない

---

## 13. 未決定事項

以下は運用開始前に確定が必要です。

1. 各アラートの最終しきい値
2. 通知チャネルの優先順位
3. 緊急停止の解除条件
4. AI Ops の自動レポート頻度
5. プラン別 AI 回数上限
6. プラン別 Storage 上限
7. サポートのSLA
8. 重大レビュー評価の閾値
9. 本番での Warning の抑制条件
10. コスト超過時の自動停止対象範囲

---

## 14. 運用ルールの要点

- AI Ops は分析と提案まで
- 人間が承認しない限り、本番変更しない
- コスト・セキュリティ・UX を同時に見る
- 迷ったら安全側に倒す
- 緊急停止は強いが、解除は慎重にする
- 監視は「検知」ではなく「行動につながる」ことが重要

必要であれば次に、  
**この仕様をもとにした「具体的な監視ダッシュボード項目一覧」** または  
**Firestore の `ops_*` コレクション設計** まで落とし込めます。