# Admin Dashboard Spec v2

## 1. 目的

Memory Note App / 思い出ノートアプリ の運用・保守・監視・改善を、人間が安全に管理できるようにするための管理ダッシュボード仕様を定義する。

この管理画面の目的は以下です。

- 本番運用の状態を一元監視する
- 価格、プラン範囲、機能フラグ、制限値をコード変更なしで調整する
- AI Ops の提案を確認し、人間が承認・実行する
- Firebase / OpenAI / Map API / Storage / Cloud Functions / Store 課金のコストと異常を監視する
- 問い合わせ、障害、監査ログ、承認待ちをまとめて扱う
- 緊急停止や機能停止を素早く実行できるようにする
- ただし、危険な操作は必ず Human Approval を通す

### この管理画面で実現したいこと
- 運用者が「今なにが起きているか」を一目で把握できる
- 変更対象を `app_config` や `feature_flags` や `subscription_plans` に集約できる
- 変更の反映前に差分と影響を確認できる
- すべての操作を監査ログに残せる
- AIは提案できるが、勝手に本番反映しない

---

## 2. 技術方針

### 採用技術
- **Streamlit**
  - 内部運用画面として迅速に構築する
  - 表示、検索、編集、承認フローを簡潔に実装する
- **Firebase Admin SDK**
  - Firestore / Authentication 関連の管理操作に利用
- **Firestore**
  - `app_config`, `feature_flags`, `subscription_plans`, `ops_reports`, `ops_approvals` などの管理データ保存
- **Firebase Storage**
  - 必要に応じて画像・共有カード・障害証跡の参照
- **Cloud Functions callable / HTTPS**
  - 危険操作や整合性が必要な更新は Functions 経由で実行
- **OpenAI API for AI Ops**
  - 監視要約、レポート作成、返信ドラフト、変更提案に利用
- **Admin authentication**
  - 管理者ログイン必須
  - ロールに応じて画面・操作を制御
- **local / staging / production mode**
  - 環境を切り替えて同一画面を利用

### 推奨実装構成
- Streamlit は **閲覧 + 編集 + 承認UI**
- 実行の中心は **Firestore更新 / Cloud Functions呼び出し**
- 重要変更は `ops_approvals` を経由
- 反映処理は可能な限り **関数化** して監査可能にする

### 環境モード
| mode | 用途 | 接続先 |
|---|---|---|
| local | 開発確認 | Firebase Emulator もしくは開発用プロジェクト |
| staging | 検証 | ステージング Firebase |
| production | 本番運用 | 本番 Firebase |

### 接続切替
- Streamlit 起動時に `mode` を選択
- `mode` ごとに Firebase プロジェクト、OpenAI設定、Store参照先を切替
- 画面上部に常時「現在の接続先」を明示
- production では危険操作に追加確認を要求

---

## 3. 管理画面の対象ユーザー

### 対象ロール
| ロール | 主な利用者 | 権限 |
|---|---|---|
| admin | 最高権限の運用責任者 | すべて閲覧・編集・承認可能 |
| operator | 日次運用担当 | 監視、軽微な設定変更、レポート確認 |
| support | 問い合わせ担当 | サポート、FAQ、チケット対応 |
| viewer | 閲覧専用 | 参照のみ、変更不可 |

### 利用対象
- プロダクトオーナー
- 運用担当
- サポート担当
- 技術担当
- 課金・事業担当
- 必要に応じた責任者

### 前提
- 管理画面は一般ユーザー向けではない
- 管理者認証必須
- ロール別に編集可否を制御する
- 監査ログに `actor`, `role`, `action`, `target`, `before`, `after` を残す

---

## 4. ダッシュボード全体メニュー

Streamlit のサイドバーに以下を必ず持たせる。

1. **Overview**
2. **Users**
3. **Notes**
4. **Storage**
5. **AI Usage**
6. **Cost**
7. **Incidents**
8. **AI Ops Reports**
9. **Subscription Plans**
10. **Feature Flags**
11. **App Config**
12. **Support**
13. **Release Checklist**
14. **Audit Logs**
15. **Approvals**
16. **Settings**

### メニュー設計の意図
- **Overview**: まず全体を見る
- **Users / Notes**: 個別対象を確認する
- **Storage / AI Usage / Cost**: 原価と利用状況を管理する
- **Incidents / Reports**: 異常とAI分析を扱う
- **Plans / Flags / Config**: コード変更なしの運用レバー
- **Support**: 問い合わせ運用
- **Release Checklist / Approvals / Audit Logs**: 変更統制
- **Settings**: 管理者設定と環境切替

---

## 5. Overview画面

### 目的
今のサービス状態を、運用担当が数分で把握できるようにする。

### 表示内容
- 本日の主要KPI
- 直近24時間のエラー増加
- AI利用量
- Storage 増加量
- コスト推移
- 承認待ち件数
- 緊急停止状態
- 重大インシデント件数
- 直近の設定変更履歴

### KPI例
- 新規登録数
- ログイン成功率
- ノート作成数
- 写真アップロード成功率
- 共有カード生成数
- AI生成成功率
- 課金転換率
- 解約率
- 問い合わせ件数

### UI要件
- 上部に「今すぐ見るべきアラート」を固定表示
- 緑/黄/赤で状態を可視化
- しきい値超過時は自動で目立つ表示
- Google Sheets 的ではなく、運用判断しやすいカード構成にする

### 主要アクション
- 詳細レポートへ遷移
- アラートを確認済みにする
- 承認待ちへ遷移
- 緊急停止画面へ遷移

---

## 6. Users管理

### 目的
ユーザー状態、課金状態、利用状況、制裁・削除前提の確認を行う。

### 表示内容
- user一覧
- 表示名
- 登録日
- 最終ログイン
- プラン
- AI利用回数
- Storage利用量
- ノート数
- 共有ノート参加数
- ステータス
- 問い合わせ履歴

### 検索条件
- userId
- 表示名
- email hash
- 登録日
- プラン
- ステータス
- 端末種別
- 課金状態

### 可能な操作
- ユーザー詳細参照
- 利用状況確認
- 監査ログ参照
- サポートメモ追加
- 制限状態確認
- 退会状況確認

### 禁止または Human Approval 必須
- ユーザー制裁
- データ削除
- アカウント停止
- 課金状態の手動改変
- 権限の無断変更

### 表示したい安全情報
- どの機能を何回使ったか
- エラーの有無
- 課金プラン
- 共有ノートでの役割
- 直近アラート有無

---

## 7. Notes管理

### 目的
ノート単位の状態、異常、権限、削除前状況を確認する。

### 表示内容
- noteId
- タイトル
- Owner
- メンバー数
- 写真枚数
- スポット数
- 作成日
- 最終編集日
- 共有状態
- AI生成有無
- 削除状態
- 関連インシデント

### できること
- ノート詳細参照
- メンバー確認
- 写真数・地図情報・AI結果の確認
- 共有カード生成状況確認
- 監査ログ確認
- 運用メモ追加

### 禁止または慎重操作
- ノート削除
- 写真削除
- 権限変更
- 共有停止
- 位置情報の公開設定変更

これらは **Human Approval 必須** とする。

---

## 8. Storage管理

### 目的
Storage 容量、画像数、共有カード残存、一時ファイル残留を監視する。

### 表示内容
- 総使用量
- 圧縮画像容量
- サムネイル容量
- 共有カード容量
- 一時ファイル残留件数
- 原本保存件数
- 削除失敗件数
- 月次増加量

### 表示したい集計
- note別使用量
- user別使用量
- 画像種別別使用量
- 生成済み共有カードの保持数
- 古いファイルの残存数

### 可能な操作
- 参照
- 問題ファイルの確認
- 削除候補の提案作成
- クリーンアップジョブの起票

### Human Approval 必須
- 実データ削除
- 保存期限の大幅変更
- 原本保存ポリシー変更
- Storage上限変更

### UI要件
- 容量推移グラフ
- サイズ上位ノート一覧
- 削除失敗アラート
- 一時ファイル残留警告

---

## 9. AI Usage管理

### 目的
OpenAI 利用量、失敗率、回数制限、プロンプト変更の影響を監視する。

### 表示内容
- 日次AIリクエスト数
- ユーザー別AI回数
- ノート別AI回数
- 生成成功率
- 失敗理由
- レイテンシ
- 429 / 5xx 件数
- コスト見積もり
- モデル別使用量

### 対象機能
- タイトル生成
- 日記生成
- 要約生成
- 返信ドラフト
- 運用レポート要約
- 変更提案のドラフト

### 管理可能項目
- AI回数制限
- AIモデル名
- プロンプトバージョン
- フォールバック文面
- 再試行回数
- しきい値

### 注意
- AIは提案まで
- 画像本体や精密位置情報は送らない
- Sensitive data は原則送らない
- 制限値の大幅変更は Human Approval 必須

---

## 10. Cost管理

### 目的
収益、原価、APIコスト、クラウドコストを横断で見る。

### 対象コスト
- Firebase Authentication
- Firestore
- Firebase Storage
- Cloud Functions
- OpenAI API
- Map API / Geocoding API
- Store課金に伴う手数料・売上
- 外部サービス利用料

### 表示内容
- 今日 / 今週 / 今月の累積コスト
- 予算消化率
- 前月比
- API別コスト
- 機能別コスト
- 予測着地
- 異常増加の要因候補

### 機能
- 予実比較
- しきい値警告
- 高コスト機能ランキング
- コスト削減提案
- レポート生成

### Human Approval 必須
- 価格変更に直結する設定
- ストレージ上限変更
- AI制限の大幅変更
- 外部 API 予算設定変更

---

## 11. Incidents管理

### 目的
障害、異常、重大警告を一元管理する。

### 表示内容
- incidentId
- 発生時刻
- 種別
- 重大度
- 影響範囲
- ステータス
- 原因候補
- 担当者
- 対応履歴
- 解消時刻

### 種別例
- 認証失敗増加
- ノート保存失敗
- 写真アップロード失敗
- AI失敗増加
- 共有カード生成失敗
- Storage 容量逼迫
- 権限エラー増加
- 課金失敗
- 外部API障害

### できること
- 重大度変更
- 対応メモ追加
- AI要約表示
- 関連ログ閲覧
- 対応タスク作成

### 緊急対応
- 緊急停止の提案
- 機能フラグOFFの提案
- 影響範囲の確認

### Human Approval 必須
- 緊急停止解除
- ユーザー影響を伴う恒久対応
- データ削除
- 誤判定に基づく制裁

---

## 12. AI Ops Reports画面

### 目的
AIが作成した日次/週次/月次レポートを確認する。

### レポート種別
- 日次健全性レポート
- 週次運用サマリー
- コストレポート
- 障害分析レポート
- 問い合わせ分類レポート
- 価格変更影響レポート
- リリース評価レポート

### 表示内容
- レポートタイトル
- 対象期間
- 生成AI
- 要約
- 推奨アクション
- 参考データ
- 信頼度
- 承認要否

### 使い方
- AIの提案を見る
- 人間が判断する
- 必要なら Approvals へ送る
- 過去レポートと比較する

---

## 13. Subscription Plans管理

### 目的
サブスクプランをコード変更なしで管理しつつ、ストア整合を保つ。

### 管理対象
- free
- plus
- premium
- 将来の法人プランなど

### 必須項目
- plan一覧
- `free / plus / premium` などの名前
- storage limit
- AI generation limit
- shared note limit
- share card generation limit
- price display
- store product id
- effective date
- active / inactive
- change approval
- App Store / Google Play 連携注意

### 一覧で表示する項目
| 項目 | 説明 |
|---|---|
| plan_key | 内部識別子 |
| plan_name | 表示名 |
| description | 簡易説明 |
| price_display | 画面表示価格 |
| billing_cycle | 月額 / 年額 |
| store_product_id_ios | App Store Connect の商品ID |
| store_product_id_android | Play Console の商品ID |
| storage_limit | 保存上限 |
| ai_generation_limit | AI回数上限 |
| shared_note_limit | 共有ノート上限 |
| share_card_limit | 共有カード上限 |
| active | 有効/無効 |
| effective_from | 適用開始日 |
| effective_to | 適用終了日 |
| approval_status | 承認状態 |

### 重要な注意
- **価格表示の変更はコード変更なしで可能**
- ただし、**実課金商品IDやストア価格は App Store Connect / Play Console と整合が必要**
- ストア側の価格や商品設定とズレた表示はしない
- iOS / Android の課金仕様は各ストアの審査・管理画面を優先する
- 価格変更は必ず Human Approval が必要
- 本番反映前に差分とストア整合を確認する

### 編集可能な項目
- 表示名
- 説明文
- 特典文言
- 上限値
- 有効/無効
- 表示価格
- 適用期間

### Human Approval 必須
- 価格変更
- プラン範囲変更
- 商品ID変更
- 権利内容の変更
- 既存ユーザーへの影響がある変更

---

## 14. Feature Flags管理

### 目的
機能の ON/OFF をコード変更なしで制御する。

### 必須フラグ
- AI generation ON/OFF
- share card ON/OFF
- collaboration ON/OFF
- map feature ON/OFF
- new onboarding ON/OFF
- maintenance mode
- emergency kill switch

### 追加候補
- search ON/OFF
- calendar ON/OFF
- On This Day ON/OFF
- photo upload throttling
- AI retry limit
- sharing limited mode

### UI要件
- フラグ名
- 現在値
- 説明
- 影響範囲
- 最終変更日時
- 最終変更者
- 承認状態

### 危険フラグ
- maintenance mode
- emergency kill switch
- collaboration OFF
- AI OFF
- share card OFF

これらは本番で即時影響が大きいため、変更時は **Human Approval 必須**。

---

## 15. App Config管理

### 目的
アプリ全体の運用値を `app_config` に集約し、コード変更なしで調整する。

### 必須設定
- max photos per note
- max notes per user
- max members per note
- max upload size
- default location blur level
- AI model name
- AI prompt version
- cost limit thresholds

### 追加設定
- note title max length
- note memo max length
- AI retry count
- storage cleanup retention days
- share card retention days
- invite expiry hours
- default locale
- support email
- announcement message

### 編集可否
- 低リスク設定は operator も編集可
- 価格、制限、緊急性の高いものは admin のみ
- 影響大の変更は Human Approval 必須

### 特に重要な設定
| 設定 | 説明 |
|---|---|
| max photos per note | 1ノートあたりの写真上限 |
| max notes per user | 1ユーザーあたりのノート上限 |
| max members per note | 共有ノート人数上限 |
| max upload size | 1ファイルの上限 |
| default location blur level | 位置のぼかしデフォルト |
| AI model name | 利用モデル |
| AI prompt version | プロンプト版数 |
| cost limit thresholds | コスト警告しきい値 |

---

## 16. Support管理

### 目的
問い合わせ、FAQ、テンプレート返信、エスカレーションを管理する。

### 表示内容
- チケット一覧
- ステータス
- 優先度
- カテゴリ
- 対応担当
- 初回受付日時
- 最終更新日時
- 返信ドラフト
- 関連インシデント
- 対応結果

### カテゴリ例
- ログイン
- アップロード失敗
- AI生成
- 共有ノート
- 権限
- 課金
- データ削除
- 共有カード
- 地図/位置情報
- 不具合報告

### 機能
- AIによる分類
- AI返信ドラフト生成
- FAQ候補生成
- エスカレーション
- 対応履歴記録

### 注意
- 個人情報は最小限のみ表示
- 返信送信前に人間確認
- 法務/制裁/課金は Support の独断で行わない

---

## 17. Release Checklist画面

### 目的
リリース前の確認をチェックリスト形式で管理する。

### チェック項目
- 変更差分確認
- QA完了
- Crashlytics 重大クラッシュなし
- Functions 失敗率許容内
- コスト異常なし
- 課金整合確認
- ストア整合確認
- プライバシー文面変更なし
- Security Rules 変更有無確認
- 承認履歴確認

### 表示要素
- チェック項目
- 担当者
- 完了状態
- コメント
- 承認者
- 実施日時

### Human Approval 必須
- 本番デプロイ
- 課金仕様変更
- Security Rules変更
- プライバシーポリシー変更
- 緊急停止解除

---

## 18. Audit Logs画面

### 目的
誰が、いつ、何を、なぜ変更したかを追跡する。

### 記録項目
- actor
- role
- action
- target
- before
- after
- reason
- approval_id
- timestamp
- mode
- result

### 監査対象
- app_config変更
- feature flag変更
- subscription plan変更
- approval実行
- 重要設定反映
- support側の重要操作
- 緊急停止操作

### UI要件
- フィルタ
- タイムライン
- 差分表示
- JSON表示
- 変更前後比較
- 承認履歴へのリンク

---

## 19. Approvals画面

### 目的
危険操作や重要変更の承認フローを管理する。

### 承認対象
- 本番デプロイ
- 課金仕様変更
- Subscription Plans変更
- Feature Flags本番反映
- App Config重要変更
- Security Rules変更
- データ削除
- ユーザー制裁
- プライバシーポリシー変更
- 緊急停止解除

### 承認状態
- pending
- approved
- rejected
- applied
- cancelled
- expired

### 画面で見せるもの
- 申請内容
- 影響範囲
- before/after
- リスク
- ロールバック案
- 承認者
- 実行者
- 対象環境

### ルール
- 重要変更は二段階確認
- 申請と実行を分離
- 承認前に影響範囲を明示
- 失敗時の戻し方を表示

---

## 20. Firestore Collections for Admin Dashboard

管理ダッシュボード用のFirestoreコレクションを用意する。

### 必須コレクション
- `app_config`
- `feature_flags`
- `subscription_plans`
- `plan_entitlements`
- `ops_alerts`
- `ops_reports`
- `ops_tasks`
- `ops_approvals`
- `admin_audit_logs`
- `support_tickets`
- `cost_snapshots`

### 推奨追加
- `admin_users`
- `admin_sessions`
- `release_checklists`
- `incident_timeline`
- `notification_queue`

### 役割
| コレクション | 用途 |
|---|---|
| app_config | 全体設定 |
| feature_flags | 機能 ON/OFF |
| subscription_plans | 価格・プラン定義 |
| plan_entitlements | プラン別権利 |
| ops_alerts | 異常アラート |
| ops_reports | AIレポート |
| ops_tasks | 定型タスク |
| ops_approvals | 承認申請 |
| admin_audit_logs | 監査ログ |
| support_tickets | 問い合わせ |
| cost_snapshots | コスト記録 |

---

## 21. 権限管理

### 管理ロール
- admin
- operator
- support
- viewer

### 権限の基本方針
| 操作 | admin | operator | support | viewer |
|---|---:|---:|---:|---:|
| Overview閲覧 | 可 | 可 | 可 | 可 |
| Users閲覧 | 可 | 可 | 可 | 可 |
| Notes閲覧 | 可 | 可 | 可 | 可 |
| Storage閲覧 | 可 | 可 | 可 | 可 |
| AI Usage閲覧 | 可 | 可 | 可 | 可 |
| Cost閲覧 | 可 | 可 | 不可/限定 | 可 |
| Incidents閲覧 | 可 | 可 | 可 | 可 |
| Reports閲覧 | 可 | 可 | 可 | 可 |
| Plans編集 | 可 | 限定 | 不可 | 不可 |
| Flags編集 | 可 | 限定 | 不可 | 不可 |
| App Config編集 | 可 | 限定 | 不可 | 不可 |
| Support対応 | 可 | 可 | 可 | 不可 |
| Approvals承認 | 可 | 不可/限定 | 不可 | 不可 |
| Audit Logs閲覧 | 可 | 可 | 限定 | 不可 |

### 実装上の注意
- UIで隠すだけでなく、Firestore/Functions側でも権限制御する
- ロール変更は admin のみ
- 管理者アカウントは少数に限定
- セッション期限を短めにする
- 重要画面は再認証を要求する

---

## 22. 危険操作の二重確認

### 対象操作
- 本番デプロイ
- 課金仕様変更
- プラン価格変更
- Security Rules変更
- データ削除
- ユーザー制裁
- プライバシーポリシー変更
- 緊急停止解除

### 二重確認の内容
1. **内容確認**
   - 何を変えるか
   - どの環境か
   - 影響範囲は何か
2. **意図確認**
   - 本当に実行するか
   - ロールバック方法はあるか
   - 承認済みか

### 追加安全策
- パスワード再入力
- 2FA 再確認
- 変更差分表示
- 影響対象の表示
- ロールバック手順の表示
- 実行ボタンの遅延表示
- 文字列入力による最終確認
  - 例: `DELETE`, `APPLY`, `ENABLE`

### ルール
- 二重確認を省略しない
- 緊急停止解除は特に厳格にする
- 重要変更はスクリーンショットや監査ログも残す

---

## 23. Streamlit画面構成案

### レイアウト
- 左サイドバー: メニュー、mode、環境、権限
- 上部ヘッダー: 現在の環境、警告、承認待ち数
- メイン領域: 一覧、詳細、編集、レポート
- 右サイド or 下部: AI提案、補足メモ、監査情報

### 画面の共通コンポーネント
- KPIカード
- テーブル
- フィルタ
- 詳細モーダル
- 差分ビュー
- 承認ボタン
- 危険操作確認ダイアログ
- ローディング表示
- エラー表示
- CSVエクスポート
- JSONビュー

### Streamlit実装上の推奨
- `st.sidebar` でメニュー
- `st.tabs` で詳細切替
- `st.dataframe` で一覧
- `st.metric` でKPI
- `st.dialog` or `st.modal` 相当で危険操作確認
- `st.session_state` で編集途中状態保持
- `st.form` で変更入力をまとめる

### 画面遷移の考え方
- 一覧 → 詳細 → 編集 → 承認 → 反映
- 監視 → 分析 → 提案 → 承認
- 問い合わせ → 返信ドラフト → 人間確認 → 送信

---

## 24. 実装時の注意

### 必須注意事項
- 管理画面から本番コードは変更しない
- 本番デプロイは管理画面のボタン一つで完了させない
- 課金商品IDやストア価格は、各ストア管理画面との整合が前提
- AIに機微情報を送らない
- ログに個人情報を残さない
- データ削除は慎重に扱う
- 変更履歴は必ず残す
- 危険操作は Human Approval を必須にする
- Streamlit は便利だが、権限と承認を省略する理由にはならない

### コード変更なしで変更できる項目
- サブスク価格の表示
- プラン名称
- プラン範囲
- AI回数制限
- ストレージ上限
- feature flags
- app_config の閾値
- しきい値警告
- 問い合わせ分類ラベル
- サポートテンプレート
- 緊急停止のON/OFF
- 位置ぼかしのデフォルト
- AIモデル名
- AI prompt version

### コード変更なしでも注意が必要な項目
- 実課金商品ID
- ストア価格
- 課金権利
- 影響の大きい制限変更
- 本番反映
- 公開範囲の拡大

---

## 25. 未決定事項

以下は運用開始前に最終判断が必要です。

### 必要な決定
- Admin 認証方式
- 管理者の2FA必須化有無
- `app_config` の編集粒度
- 価格変更の承認者数
- 緊急停止解除の承認手順
- 監査ログの保存期間
- サポートチケットのSLA
- 変更のロールバック手順
- ストア価格反映の責任分担
- AI Ops レポートの自動生成頻度
- 機微データのAI送信許容範囲

### 特にHuman Approvalが必要
- 本番デプロイ
- 課金仕様変更
- Security Rules変更
- データ削除
- ユーザー制裁
- プライバシーポリシー変更

---

必要であれば次に、
1. **この仕様を元にした Streamlit 画面ワイヤー案**  
2. **Firestoreの `app_config` / `feature_flags` / `subscription_plans` の具体スキーマ**  
3. **Streamlit実装タスク分解**  
のいずれかを続けて作成できます。