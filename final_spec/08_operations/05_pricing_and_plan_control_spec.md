# Pricing and Plan Control Spec v2

## 1. 目的

本仕様は、Memory Note App / 思い出ノートアプリにおいて、**コード変更なしで価格・サブスク・プラン範囲・機能制限を管理するための運用仕様**を定義するものです。

目的は以下です。

- サブスク価格、プラン範囲、各種上限を管理画面から変更できるようにする
- iOS / Android のストア課金と整合した形で運用する
- Free / Plus / Premium / Family 系プランを将来まで見据えて管理する
- AI回数、ストレージ、共有ノート、共有カードなどの制限を柔軟に変更できるようにする
- 緊急時に機能停止や制限緩和・強化を安全に行う
- ただし、危険な変更は必ず Human Approval を通す

---

## 2. 基本方針

### 2.1 管理の考え方

価格・プラン制御は、以下の3層で分離する。

1. **表示層**
   - アプリや管理画面に表示する価格、説明、訴求文言

2. **権限制御層**
   - ユーザーが実際に使える機能、上限、容量、回数

3. **課金整合層**
   - App Store / Google Play の商品ID、価格、課金期間、審査整合

この3層を分けることで、表示だけ変更して実課金とズレる事故を防ぐ。

### 2.2 基本原則

| 原則 | 内容 |
|---|---|
| コード変更なし | 価格、上限、機能フラグは管理画面から更新する |
| ストア整合必須 | iOS は App Store Connect / StoreKit、Android は Play Console / Google Play Billing と整合させる |
| 権限制御はサーバ側優先 | クライアント表示だけでなく Firestore / Functions 側で判定する |
| 既存契約尊重 | 価格変更前の契約は原則維持する |
| 変更履歴保持 | すべての変更は pricing_history に残す |
| 実行前レビュー | 反映前に差分・影響範囲を確認する |
| 危険操作は人間承認 | 本番反映、課金仕様変更、削除系は必須承認 |
| AIは提案まで | AIが自動で本番反映しない |

### 2.3 管理画面の役割

管理画面は以下に使う。

- プラン価格の編集
- Entitlement の変更
- 機能フラグとの連携
- 既存ユーザーへの影響確認
- ストア価格との整合チェック
- 変更申請、承認、反映、ロールバック

---

## 3. 注意事項

以下は必ず守る。

- **iOSは App Store Connect / StoreKit との整合が必要**
- **Androidは Play Console / Google Play Billing との整合が必要**
- ダッシュボード上の価格は、**表示・権限制御・プラン範囲管理** に使う
- **実課金商品IDやストア価格は、ストア側設定と同期する必要がある**
- 法務・ストア審査・税務は **人間確認が必要**
- 価格変更は、表示だけでなく既存顧客の継続課金や請求表示にも影響する
- ストア審査対象になる変更は、先に人間が確認する
- App Store / Google Play の仕様と矛盾する値は保存しても反映しない
- 価格、税、通貨、課金周期の変更は慎重に扱う

---

## 4. プラン案

### 4.1 プラン一覧

| プラン | 想定用途 | 位置づけ |
|---|---|---|
| Free | 体験・初回利用 | 入口プラン |
| Plus | 個人の継続利用 | 主力有料プラン |
| Premium | ヘビーユーザー向け | 上位プラン |
| Family / Shared Plan | 家族・恋人・複数人共有 | 将来拡張候補 |

### 4.2 Free

- まず価値体験を成立させるための無料プラン
- ノート作成は可能だが、上限あり
- AI回数・ストレージ・共有数に制限を置く
- 共有ノートは最小構成に限定可能

#### 想定
- 軽いお試し
- 旅行やお出かけを数件保存
- 課金前の理解促進

### 4.3 Plus

- 個人向けの標準有料プラン
- Free より明確に制限を緩和
- AI、ストレージ、ノート数、共有カード数を増やす
- 一般ユーザーの主課金対象

#### 想定
- 日常的に写真を残すユーザー
- 月数回以上使うユーザー
- AI生成を継続利用したいユーザー

### 4.4 Premium

- より多く保存・共有・生成したいユーザー向け
- 高容量、優先処理、上位テンプレートを含む
- 将来的に原本保存や高度機能を含める候補

#### 想定
- 写真量が多いユーザー
- 旅行や家族記録が多いユーザー
- 高頻度でAI・共有カードを使うユーザー

### 4.5 Family / Shared Plan 候補

- 家族・カップル・小グループで使う共同プラン
- 共有ノート数やメンバー数を拡張しやすい
- 将来的に「家族単位の保存上限」を持たせる候補

#### 想定
- 家族のお出かけ記録
- カップル共有
- 友人グループの共同記録

### 4.6 プラン差別化の基本軸

- 保存容量
- AI利用回数
- 共有ノート数
- 共有カード生成数
- 1ノートあたりの写真数
- 1ノートあたりのメンバー数
- 原本保存の可否
- 優先処理
- 高度テンプレート利用可否

---

## 5. Entitlement定義

以下の entitlement をプランごとに持つ。

| entitlement key | 意味 |
|---|---|
| `storage_mb` | 保存容量上限 |
| `monthly_ai_generations` | 月間AI生成回数 |
| `monthly_share_cards` | 月間共有カード生成回数 |
| `max_notes` | 作成可能ノート数 |
| `max_photos_per_note` | 1ノートあたりの写真枚数上限 |
| `max_shared_notes` | 参加または所有可能な共有ノート数 |
| `max_members_per_note` | 1ノートの最大メンバー数 |
| `original_image_storage` | 原本画像保存の可否 |
| `priority_processing` | 優先処理の可否 |
| `advanced_templates` | 上位テンプレートの可否 |

### 5.1 各 entitlement の意味

#### storage_mb
- ユーザーの総保存量上限
- 圧縮画像、サムネイル、共有カード、原本保存を合算対象にできる
- Free は少なめ、上位プランは大きめ

#### monthly_ai_generations
- 月ごとのAI生成可能回数
- タイトル、日記、要約の生成を含める
- 再生成は別カウントにするか、同一カウントにするかを管理画面で定義

#### monthly_share_cards
- 月ごとの共有カード生成回数
- 同一ノートの再生成を含むかは設定で分ける

#### max_notes
- ユーザーが所有できるノート数
- 共有ノート参加数とは分けて管理する

#### max_photos_per_note
- 1ノートあたりの写真上限
- 大量写真によるコスト増を抑える

#### max_shared_notes
- 共有ノートの所有または参加の上限
- 負荷や権限管理の複雑化を抑える

#### max_members_per_note
- 1ノートあたりの招待可能人数上限
- 家族・友人グループの規模を制御する

#### original_image_storage
- 原本画像保存を許可するかどうか
- Premium 限定にする候補

#### priority_processing
- アップロードや共有カード生成の優先処理
- Premium 向け差別化要素

#### advanced_templates
- 高度な共有カードテンプレートや上位レイアウト
- Premium / Family 上位向けに設定可能

---

## 6. Firestore Data Model

以下の管理用コレクションを使う。

### 6.1 `subscription_plans`

プランの基本情報を保持する。

#### 主な項目
- `plan_key`
- `plan_name`
- `description`
- `price_display`
- `billing_cycle`
- `currency`
- `store_product_id_ios`
- `store_product_id_android`
- `store_price_ios`
- `store_price_android`
- `storage_limit`
- `active`
- `effective_from`
- `effective_to`
- `approval_status`

### 6.2 `plan_entitlements`

プランごとの entitlement を保持する。

#### 主な項目
- `plan_key`
- `entitlement_key`
- `value`
- `unit`
- `active`
- `effective_from`
- `effective_to`

### 6.3 `user_subscriptions`

ユーザーごとの契約状態を保持する。

#### 主な項目
- `user_id`
- `plan_key`
- `status`
- `platform`
- `store_subscription_id`
- `store_transaction_id`
- `current_period_start`
- `current_period_end`
- `auto_renew`
- `trial_end`
- `cancelled_at`
- `source`
- `sync_status`

### 6.4 `billing_events`

課金関連イベントを記録する。

#### 主な項目
- `event_id`
- `user_id`
- `event_type`
- `platform`
- `plan_key`
- `amount`
- `currency`
- `store_reference`
- `created_at`
- `raw_status`
- `processed_status`

### 6.5 `pricing_history`

価格・プラン・entitlement 変更の履歴を残す。

#### 主な項目
- `change_id`
- `changed_by`
- `changed_at`
- `change_type`
- `target`
- `before`
- `after`
- `approval_id`
- `reason`
- `environment`

### 6.6 `entitlement_overrides`

個別ユーザーへの上書き設定を保持する。

#### 主な項目
- `override_id`
- `user_id`
- `plan_key`
- `override_keys`
- `value`
- `reason`
- `expires_at`
- `approved_by`
- `approved_at`

---

## 7. Dashboardで変更できる項目

管理画面から変更できるのは以下。

### 7.1 価格関連
- 表示価格
- 課金周期
- 通貨表示
- キャンペーン文言
- 価格の有効期間

### 7.2 プラン関連
- プラン名
- プラン説明
- プランの active / inactive
- Free / Plus / Premium / Family の範囲
- プランごとの適用対象

### 7.3 Entitlement関連
- `storage_mb`
- `monthly_ai_generations`
- `monthly_share_cards`
- `max_notes`
- `max_photos_per_note`
- `max_shared_notes`
- `max_members_per_note`
- `original_image_storage`
- `priority_processing`
- `advanced_templates`

### 7.4 個別補正
- 特定ユーザーへの一時的な上限緩和
- 期限付きの entitlement override
- サポート対応用の例外付与

### 7.5 運用制御
- 新規購入受付の ON/OFF
- 既存ユーザー向け継続利用の ON/OFF
- 緊急停止時の制限内容
- Free の上限調整
- AI回数の調整
- 共有カード回数の調整

---

## 8. Dashboardで変更してはいけない項目

以下は管理画面から直接変更してはいけない、または Human Approval とストア整合が必須。

### 8.1 変更禁止または強承認
- 本番デプロイ
- Security Rules 変更
- ユーザーデータ削除
- ユーザー制裁
- プライバシーポリシー変更
- 利用規約の本番反映
- 課金仕様の根本変更
- 実課金商品IDの無承認変更
- ストア審査を必要とする価格変更
- 返金判断の自動確定

### 8.2 実課金の直接変更禁止
- App Store / Google Play の商品設定を管理画面だけで変更しない
- ストア側価格や商品IDの変更は、ストア管理画面で人間が実施する
- 管理画面はその整合を確認・記録する役割に留める

### 8.3 危険な自動化禁止
- AIが勝手に本番反映すること
- AIが勝手にユーザー削除すること
- AIが勝手に課金値を変更すること
- AIが勝手に制裁すること

---

## 9. 価格変更フロー

### 9.1 概要

価格変更は、表示変更だけでなくストア整合が必要なため、以下の順で実施する。

### 9.2 フロー
1. 管理画面で新しい価格案を作成
2. AIが影響レポートを生成
3. 運用者が差分確認
4. ストア側設定との差分を確認
5. Human Approval を取得
6. App Store Connect / Play Console を更新
7. `subscription_plans` を更新
8. `pricing_history` に保存
9. ユーザー通知の要否を判定
10. 反映後モニタリング

### 9.3 確認ポイント
- ストア価格と表示価格が一致しているか
- 既存契約者に影響がないか
- 税込 / 税抜表示の整合が取れているか
- 課金周期が一致しているか
- 国・地域別価格差があるか

---

## 10. プラン範囲変更フロー

### 10.1 対象
- Free / Plus / Premium / Family の含有機能
- 共有ノート数上限
- AI回数上限
- 保存容量上限
- 原本保存可否
- 優先処理可否

### 10.2 フロー
1. 変更対象の plan を選ぶ
2. 変更前後の entitlement を比較する
3. 影響ユーザー数を算出する
4. 既存ユーザーへの影響を確認する
5. Human Approval を得る
6. `plan_entitlements` を更新する
7. `pricing_history` に記録する
8. 必要に応じてユーザー通知を送る

### 10.3 注意
- 無料枠縮小は特に慎重に扱う
- 既存契約の grandfathe​​r 条件を設けるか決める
- Family プランはメンバー数上限に直結するため慎重に扱う

---

## 11. 機能制限変更フロー

### 11.1 対象例
- AI回数制限
- 共有カード回数制限
- 保存容量
- ノート上限
- 写真枚数上限
- 共有ノート数上限
- メンバー上限

### 11.2 フロー
1. 管理画面で制限変更案を作成
2. AIが影響分析を作る
3. 価格・プランとの整合を確認
4. 容量やコストへの影響を確認
5. Human Approval を取得
6. `plan_entitlements` または `app_config` を更新
7. `pricing_history` に保存
8. 反映後の監視を開始

### 11.3 ポイント
- 制限値だけ変えると、価格感との整合が崩れるため注意
- 既存ユーザーへの救済策を併記する
- 急激な縮小は避ける

---

## 12. 反映タイミング

### 12.1 即時反映
- feature flags の軽微な ON/OFF
- 監視しながらの限定的な entitlement 調整
- 期限付き override の追加

### 12.2 次回同期反映
- `user_subscriptions` の再同期が必要な変更
- ストア課金状態に依存する変更
- 有効期限更新を伴うもの

### 12.3 ストア反映後
- 商品IDや価格変更
- 課金周期変更
- ストア審査を伴う変更

### 12.4 推奨
- 反映時刻を明示する
- 本番反映前にステージングで確認する
- 反映後 24 時間は監視強化する

---

## 13. Human Approval

以下は必ず Human Approval 必須。

- 価格変更
- プラン範囲変更
- 実課金商品IDの変更
- ストア価格との整合に影響する変更
- 無料枠の縮小
- ストレージ上限の大幅変更
- AI回数の大幅変更
- Family / Shared Plan の権利内容変更
- 既存契約者への影響を伴う変更
- 本番反映
- 返金・キャンセルの強制判断
- ユーザー制裁
- データ削除
- Security Rules 変更
- プライバシーポリシー変更

### 承認の観点
- 法務
- ストア審査
- 税務
- ユーザー影響
- 売上影響
- 解約率影響
- サポート負荷
- 技術整合

---

## 14. User Notification

### 14.1 通知が必要なケース
- 価格変更
- 無料枠縮小
- 保存上限縮小
- AI回数縮小
- プラン統合・廃止
- Family プラン条件変更
- 継続課金に影響する変更

### 14.2 通知方法
- アプリ内通知
- メール
- 設定画面のお知らせ
- 必要に応じてストア文言更新

### 14.3 通知内容
- 何が変わるか
- いつから変わるか
- 既存契約への影響
- ユーザーが取れる対応
- 問い合わせ先

### 14.4 注意
- 変更後に初めて知る状態を避ける
- 誤解のない文言にする
- 法務確認が必要な場合は人間が確認する

---

## 15. Rollback

### 15.1 目的
変更により障害、苦情、売上悪化、整合不備が起きた場合に、すぐ戻せるようにする。

### 15.2 ロールバック対象
- `subscription_plans`
- `plan_entitlements`
- `app_config`
- `feature_flags`
- `entitlement_overrides`

### 15.3 ロールバック手順
1. 問題検知
2. 影響範囲確認
3. 直前の `pricing_history` を参照
4. 前値に戻す
5. Human Approval が必要な場合は取得
6. 反映
7. 監視強化

### 15.4 注意
- 価格変更のロールバックはストア側整合も再確認する
- 既存ユーザーの契約条件を壊さない
- 差し戻し後も履歴は消さない

---

## 16. Edge Cases

### 16.1 既存ユーザーへの影響
- 既存契約者は旧条件を維持するか、新条件に移行するかを明示する
- 移行時期を設定する
- 契約期間中の不利益変更は慎重に扱う

### 16.2 価格変更前の契約
- 改定前価格で契約したユーザーをどう扱うかを定義する
- Grandfather 適用の有無を決める
- 年額契約・月額契約で扱いが異なる

### 16.3 無料枠の縮小
- 既存ユーザーの利用停止を避ける配慮が必要
- いきなり超過扱いにしない
- 警告期間を設ける

### 16.4 容量超過
- 超過時はアップロード停止、閲覧継続、削除導線提示を基本にする
- 既存データの閲覧を即時停止しない
- 支払い誘導または整理導線を出す

### 16.5 AI回数超過
- 超過時はフォールバック文を返す
- 無料枠では待機期間または翌月復帰を案内する
- 誤課金を避ける

### 16.6 ストア側との不整合
- ダッシュボードの表示価格とストア価格がずれたら警告する
- 商品ID不一致は本番反映不可にする
- 国別価格差も確認対象にする

### 16.7 返金・キャンセル
- 自動で判定せず、人間確認を必須にする
- ストアの返金結果と `user_subscriptions` を同期する
- キャンセル後の猶予期間を表示する
- 誤判定で権限を即削除しない

---

## 17. 受け入れ基準

- 管理画面から価格、プラン範囲、Entitlement を編集できる
- 変更前に差分と影響範囲が表示される
- iOS は App Store Connect / StoreKit と整合確認ができる
- Android は Play Console / Google Play Billing と整合確認ができる
- 本番反映前に Human Approval が必須になっている
- 変更履歴が pricing_history に残る
- 既存ユーザーへの影響が確認できる
- ロールバック手順が用意されている
- 危険操作が AI 単独で実行されない
- 実課金商品IDやストア価格の不整合が警告される

---

## 18. 未決定事項

以下は人間承認・事業判断が必要で、現時点では未決定とする。

- Free / Plus / Premium / Family の正式価格
- 月額・年額の有無
- 年額割引率
- 既存契約者の grandfather 適用方針
- 原本画像保存をどのプランで許可するか
- 共有ノート数とメンバー数の最終上限
- AI再生成を月間回数に含めるか
- 共有カード生成を課金対象にするか
- 国別価格差を初期から持つか
- Family / Shared Plan の正式な商品構成
- 無料枠縮小時の猶予期間

必要であれば次に、これをそのまま実装に落とせるように **Firestore `app_config` / `subscription_plans` の具体スキーマ** と **Streamlit管理画面の画面構成案** まで続けて作れます。