# Development Tasks v2

## 1. 目的

Release v1 を **React Native + Expo + Firebase 前提の実運用可能な本番アプリ** として、実装順に落とし込んだ開発タスク一覧を整理します。  
方針は以下です。

- **まず動く縦スライスを最優先**
- 写真起点で思い出ノートが保存されることを先に成立させる
- 共有ノート / 権限 / SNS共有カードは Release v1 必須として実装
- AI は **Cloud Functions 経由**
- **OpenAI APIキーをモバイルアプリへ直埋めしない**
- QA とストア審査準備までを Release v1 の範囲に含める

---

## 2. 開発フェーズ全体像

| Phase | フェーズ名 | 目的 |
|---|---|---|
| Phase 0 | Project Setup | プロジェクト土台、開発環境、基本設計の固定 |
| Phase 1 | Firebase Foundation | Firebase 接続、認証基盤、Firestore/Storage/Functions 土台 |
| Phase 2 | Auth / Profile | 登録・ログイン・プロフィール・セッション維持 |
| Phase 3 | Core Navigation / UI Shell | 画面遷移、共通UI、ホーム、空状態 |
| Phase 4 | Memory Note Creation | ノート作成フローの骨格 |
| Phase 5 | Photo Upload / Metadata | 写真選択、EXIF、アップロード前処理 |
| Phase 6 | Image Processing / Storage | 圧縮、サムネイル、Storage保存、削除連鎖 |
| Phase 7 | Map / Place Grouping | 地図表示、場所名推定、スポットグループ化 |
| Phase 8 | AI Generation | タイトル・日記ドラフト生成、フォールバック |
| Phase 9 | Note Detail / Edit / Delete | 詳細表示、編集、削除、一覧との接続 |
| Phase 10 | Collaboration / Permission | 共有ノート、権限、共同編集 |
| Phase 11 | Invitation / Notification | 招待、参加、離脱、通知の土台 |
| Phase 12 | SNS Share Card | 共有カード生成、プレビュー、保存、共有 |
| Phase 13 | Search / Calendar / Tags | 検索、カレンダー、タグ、On This Day |
| Phase 14 | Settings / Privacy / Support | 設定、規約、プライバシー、問い合わせ |
| Phase 15 | Analytics / Crashlytics / Cost Controls | 監視、分析、回数制限、コスト抑制 |
| Phase 16 | QA / Store Release | テスト、修正、審査準備、リリース対応 |

---

## 3. タスク一覧

| Task ID | Phase | タスク | 成果物 | 依存関係 | 優先度 | 完了条件 |
|---|---|---|---|---|---|---|
| TASK-0001 | Phase 0 | リポジトリ初期化、Expo プロジェクト作成、ブランチ運用ルール決定 | Expo 初期プロジェクト、Git運用ルール | なし | P0 | ローカル起動できる |
| TASK-0002 | Phase 0 | レイヤー構成・フォルダ構成を確定 | `presentation/application/domain/infrastructure` 構成 | TASK-0001 | P0 | 主要フォルダが整備済み |
| TASK-0003 | Phase 0 | 共通UI方針、命名規則、エラーハンドリング方針を定義 | 開発規約ドキュメント | TASK-0001 | P0 | 実装ルールに合意済み |
| TASK-0004 | Phase 0 | 環境変数・Flavor・dev/stg/prod 切替設計 | 環境設定基盤 | TASK-0001 | P0 | 環境切替が可能 |
| TASK-0005 | Phase 0 | パッケージ選定と初期導入 | expo-router / zustand / firebase系 / expo-sharing 等 | TASK-0001 | P0 | 依存導入完了 |
| TASK-0006 | Phase 0 | デザインシステム最低限のトークン定義 | 色・文字・余白・ボタン部品 | TASK-0002 | P1 | 共通UIで利用可能 |
| TASK-0007 | Phase 1 | Firebase プロジェクト作成と iOS/Android 連携 | Firebase 接続済みアプリ | TASK-0001 | P0 | Firebase初期接続成功 |
| TASK-0008 | Phase 1 | Firebase Authentication 有効化 | Auth 基盤 | TASK-0007 | P0 | 認証プロバイダ設定済み |
| TASK-0009 | Phase 1 | Firestore 初期スキーマ方針確定 | コレクション設計書 | TASK-0007 | P0 | `users`, `memory_notes` 等が定義済み |
| TASK-0010 | Phase 1 | Firebase Storage バケット構成とパス方針確定 | Storage パス設計 | TASK-0007 | P0 | 圧縮/サムネイル/共有カード分離済み |
| TASK-0011 | Phase 1 | Cloud Functions の雛形作成 | Functions プロジェクト | TASK-0007 | P0 | デプロイ可能な雛形あり |
| TASK-0012 | Phase 1 | Firestore Security Rules の初版作成 | Rules 初版 | TASK-0009 | P0 | 読み書き制御の骨格がある |
| TASK-0013 | Phase 1 | Storage Security Rules の初版作成 | Storage Rules 初版 | TASK-0010 | P0 | ノート参加者のみアクセス可 |
| TASK-0014 | Phase 1 | Firebase Analytics / Crashlytics 初期導入 | 計測基盤 | TASK-0007 | P1 | 起動時に送信確認できる |
| TASK-0015 | Phase 1 | ローカル/ステージング接続検証 | 接続確認レポート | TASK-0007〜0014 | P0 | 各サービス疎通OK |
| TASK-0016 | Phase 2 | Firebase Auth のラッパー実装 | AuthRepository / UseCase | TASK-0008 | P0 | ログイン状態取得可能 |
| TASK-0017 | Phase 2 | メールログイン実装 | メール登録・ログインUI/API | TASK-0016 | P0 | メール認証できる |
| TASK-0018 | Phase 2 | Googleログイン実装 | Google認証連携 | TASK-0016 | P0 | Androidでログイン可 |
| TASK-0019 | Phase 2 | Appleログイン実装 | Apple認証連携 | TASK-0016 | P0 | iOSでログイン可 |
| TASK-0020 | Phase 2 | ログアウト・セッション復元実装 | セッション管理 | TASK-0016 | P0 | 再起動後も状態維持 |
| TASK-0021 | Phase 2 | アカウント削除導線実装 | 削除確認画面・削除API | TASK-0016, TASK-0012 | P0 | 削除確認後に削除可能 |
| TASK-0022 | Phase 2 | プロフィールモデル・画面実装 | 表示名、アイコン、保存 | TASK-0016, TASK-0009 | P0 | プロフィール編集できる |
| TASK-0023 | Phase 2 | 初回登録後のプロフィール作成フロー実装 | 作成完了フロー | TASK-0022, TASK-0017〜0019 | P0 | 登録後に遷移する |
| TASK-0024 | Phase 3 | ルーティング基盤実装 | Expo Router ルート定義 | TASK-0005, TASK-0020 | P0 | 認証ガードありで遷移できる |
| TASK-0025 | Phase 3 | アプリ共通レイアウト / ナビゲーション実装 | Shell / Tab / AppBar | TASK-0024 | P0 | 基本画面遷移可能 |
| TASK-0026 | Phase 3 | ホーム一覧画面の空状態実装 | 空状態UI | TASK-0025 | P0 | 初回起動で案内表示 |
| TASK-0027 | Phase 3 | ノート一覧取得・表示のダミー接続 | 一覧UI + 仮データ | TASK-0025, TASK-0009 | P0 | 一覧画面が動く |
| TASK-0028 | Phase 3 | 設定画面の枠組み実装 | 設定入口 | TASK-0025 | P1 | 設定へ遷移可能 |
| TASK-0029 | Phase 4 | 新規ノート作成フローの状態管理 | Create flow state | TASK-0024, TASK-0027 | P0 | 作成フローを管理できる |
| TASK-0030 | Phase 4 | 作成開始画面実装 | 新規作成入口 | TASK-0025, TASK-0029 | P0 | 作成開始できる |
| TASK-0031 | Phase 4 | 写真選択画面実装 | 写真ピッカー画面 | TASK-0030 | P0 | 複数写真選択に進める |
| TASK-0032 | Phase 4 | 作成フローにノート種別（個人/共有）の概念を追加 | ノート種別UI | TASK-0030, TASK-0031 | P0 | 作成時に種別を選べる |
| TASK-0033 | Phase 4 | 作成プレビューの画面骨格実装 | プレビューUI | TASK-0031, TASK-0032 | P0 | 保存前確認できる |
| TASK-0034 | Phase 4 | 作成フローの保存ボタンと完了導線実装 | 保存完了遷移 | TASK-0033 | P0 | 保存後に詳細へ遷移 |
| TASK-0035 | Phase 5 | 写真ピッカー導入（OS標準） | 写真選択機能 | TASK-0031 | P0 | iOS/Androidで選択できる |
| TASK-0036 | Phase 5 | EXIF 読み取り実装 | 撮影日時/GPS/向き取得 | TASK-0035 | P0 | メタデータ取得できる |
| TASK-0037 | Phase 5 | GPSなし写真のフォールバック処理実装 | 欠損時処理 | TASK-0036 | P0 | 欠損でも進行できる |
| TASK-0038 | Phase 5 | 写真メタデータ DTO / Entity 実装 | Photo metadata model | TASK-0036, TASK-0009 | P0 | Firestore保存用に整形可能 |
| TASK-0039 | Phase 5 | 写真選択数・サイズのバリデーション | 入力制御 | TASK-0035 | P1 | 異常データを弾ける |
| TASK-0040 | Phase 5 | アップロード進捗表示のUI | 進捗バー | TASK-0035, TASK-0033 | P0 | 進捗が見える |
| TASK-0041 | Phase 6 | 画像圧縮処理実装 | 圧縮画像生成 | TASK-0035 | P0 | 指定サイズへ圧縮される |
| TASK-0042 | Phase 6 | サムネイル生成処理実装 | サムネイル生成 | TASK-0041 | P0 | 一覧用画像が作れる |
| TASK-0043 | Phase 6 | Firebase Storage アップロード実装 | 圧縮画像/サムネイル保存 | TASK-0041, TASK-0042, TASK-0010 | P0 | Storageへ保存できる |
| TASK-0044 | Phase 6 | Firestore に写真メタ情報を保存 | photos ドキュメント保存 | TASK-0043, TASK-0038 | P0 | DBに写真が残る |
| TASK-0045 | Phase 6 | アップロード再試行・失敗復旧 | 再試行UI/ロジック | TASK-0043 | P0 | 失敗から再送できる |
| TASK-0046 | Phase 6 | 写真削除時の Storage/DB 削除連鎖 | 削除ジョブ | TASK-0044, TASK-0012, TASK-0013 | P0 | 派生物も削除される |
| TASK-0047 | Phase 6 | ローカル一時ファイル削除処理 | クリーンアップ | TASK-0041〜0043 | P1 | 一時ファイルが残らない |
| TASK-0048 | Phase 7 | Map SDK 導入・初期表示 | 地図表示基盤 | TASK-0005, TASK-0007 | P0 | 地図を表示できる |
| TASK-0049 | Phase 7 | ノート内写真を地図上ピン表示 | ピン描画 | TASK-0038, TASK-0048 | P0 | ノート地図が見える |
| TASK-0050 | Phase 7 | 場所名推定の実装（逆ジオコーディング/代替） | placeName 推定 | TASK-0036, TASK-0048 | P0 | 場所名が出る |
| TASK-0051 | Phase 7 | place_groups データモデル・生成ロジック実装 | スポットグルーピング | TASK-0049, TASK-0050 | P0 | 近い写真がまとまる |
| TASK-0052 | Phase 7 | ノート詳細で地図・スポット一覧を表示 | 地図/スポットUI | TASK-0051, TASK-0027 | P0 | 一覧と詳細が繋がる |
| TASK-0053 | Phase 7 | 位置情報なし時の表示分岐 | 欠損UI | TASK-0050 | P0 | 「場所情報なし」が出る |
| TASK-0054 | Phase 8 | Cloud Functions から OpenAI を呼ぶ下準備 | AI関数土台 | TASK-0011 | P0 | APIキーはサーバ側のみ |
| TASK-0055 | Phase 8 | AI送信データ整形ロジック実装 | 日時/場所/枚数/メモ整形 | TASK-0054, TASK-0038, TASK-0050 | P0 | 最小データで送れる |
| TASK-0056 | Phase 8 | タイトル生成 Function 実装 | `generateTitle` | TASK-0054, TASK-0055 | P1 | タイトル案を返す |
| TASK-0057 | Phase 8 | 日記生成 Function 実装 | `generateDiary` | TASK-0054, TASK-0055 | P1 | 短文日記案を返す |
| TASK-0058 | Phase 8 | AI結果の保存・再取得実装 | `ai_results` 保存 | TASK-0056, TASK-0057, TASK-0009 | P0 | 再表示できる |
| TASK-0059 | Phase 8 | AI失敗時のフォールバック文実装 | 代替文生成 | TASK-0056, TASK-0057 | P0 | AI失敗でも作成継続可 |
| TASK-0060 | Phase 8 | 生成プレビューUIへ AI結果を反映 | プレビュー完成 | TASK-0058, TASK-0059, TASK-0033 | P0 | 編集前確認できる |
| TASK-0061 | Phase 8 | タイトル編集UI/ロジック実装 | タイトル修正 | TASK-0060 | P0 | 手動修正できる |
| TASK-0062 | Phase 8 | 日記編集UI/ロジック実装 | メモ修正 | TASK-0060 | P0 | 手動修正できる |
| TASK-0063 | Phase 8 | 場所名編集UI/ロジック実装 | 場所名修正 | TASK-0050, TASK-0060 | P1 | 場所名補正できる |
| TASK-0064 | Phase 9 | ノート詳細画面の本実装 | 詳細表示一式 | TASK-0052, TASK-0060, TASK-0027 | P0 | 写真/地図/本文が見える |
| TASK-0065 | Phase 9 | ノート一覧を Firestore 接続 | 実データ一覧 | TASK-0027, TASK-0009 | P0 | 保存ノートが一覧表示 |
| TASK-0066 | Phase 9 | ノート編集画面実装 | 編集フォーム | TASK-0064 | P0 | 詳細から編集できる |
| TASK-0067 | Phase 9 | ノート保存処理（更新）実装 | 更新API | TASK-0066, TASK-0009 | P0 | 再保存できる |
| TASK-0068 | Phase 9 | ノート削除確認画面実装 | 削除確認 | TASK-0064 | P0 | 影響説明が出る |
| TASK-0069 | Phase 9 | ノート削除処理実装（Ownerのみ） | 削除API/Rules | TASK-0068, TASK-0012, TASK-0064 | P0 | Ownerのみ削除可 |
| TASK-0070 | Phase 9 | お気に入り・簡易タグの保存実装 | 補助整理 | TASK-0067 | P1 | 軽い整理ができる |
| TASK-0071 | Phase 10 | 共有ノート/メンバーのデータモデル実装 | members / shared note | TASK-0009 | P0 | 権限を保存できる |
| TASK-0072 | Phase 10 | Owner / Editor / Viewer 権限判定実装 | Permission service | TASK-0071, TASK-0012, TASK-0013 | P0 | 権限ごとに制御できる |
| TASK-0073 | Phase 10 | 共有ノート作成フロー実装 | 共有ノート作成 | TASK-0071, TASK-0067 | P0 | 共有ノートとして保存可能 |
| TASK-0074 | Phase 10 | Editor の編集権限実装 | 写真追加/本文/場所名編集 | TASK-0072, TASK-0044, TASK-0067 | P0 | Editorが編集できる |
| TASK-0075 | Phase 10 | Viewer の閲覧専用制御実装 | 閲覧限定UI/Rules | TASK-0072, TASK-0064 | P0 | Viewerが編集できない |
| TASK-0076 | Phase 10 | Owner のメンバー管理実装 | 招待/削除/権限変更 | TASK-0072, TASK-0073 | P0 | Ownerのみ管理可 |
| TASK-0077 | Phase 10 | Owner 移譲ロジック実装 | 所有権移譲 | TASK-0076 | P0 | Owner不在を防げる |
| TASK-0078 | Phase 10 | 共有ノート離脱処理実装 | 自己離脱 | TASK-0072, TASK-0071 | P0 | 自分で抜けられる |
| TASK-0079 | Phase 10 | 権限説明UIとアクセス制御文言実装 | 権限説明画面 | TASK-0072 | P0 | ルールが理解できる |
| TASK-0080 | Phase 11 | 招待トークン設計・invitations モデル実装 | 招待データ | TASK-0071 | P0 | 期限付き招待を持てる |
| TASK-0081 | Phase 11 | 招待リンク発行 Function 実装 | 招待発行API | TASK-0080, TASK-0011 | P0 | 招待リンクを作れる |
| TASK-0082 | Phase 11 | 招待受諾フロー実装 | 参加処理 | TASK-0080, TASK-0024, TASK-0081 | P0 | 招待から参加できる |
| TASK-0083 | Phase 11 | 通知/リマインドの最低限実装 | 招待通知 | TASK-0081, TASK-0082 | P1 | 招待が伝わる |
| TASK-0084 | Phase 12 | 共有カード用データモデル実装 | share_cards | TASK-0009, TASK-0052 | P0 | カード管理できる |
| TASK-0085 | Phase 12 | 共有カードレイアウト生成（1:1） | 1:1カード | TASK-0084, TASK-0011 | P0 | 正方形出力できる |
| TASK-0086 | Phase 12 | 共有カードレイアウト生成（4:5） | 4:5カード | TASK-0085 | P0 | Instagram向け出力可 |
| TASK-0087 | Phase 12 | 共有カードレイアウト生成（9:16） | 9:16カード | TASK-0085 | P0 | Story向け出力可 |
| TASK-0088 | Phase 12 | 位置ぼかし/地名のみ表示制御 | 位置公開制御 | TASK-0084, TASK-0050 | P0 | 精密座標を出さない |
| TASK-0089 | Phase 12 | 共有カードプレビューUI | 生成前確認画面 | TASK-0085〜0088 | P0 | プレビュー必須を満たす |
| TASK-0090 | Phase 12 | 端末保存・OS共有シート連携 | 保存/共有導線 | TASK-0089, TASK-0005 | P0 | 端末保存と共有ができる |
| TASK-0091 | Phase 12 | SNS共有先導線ラベル実装 | Instagram/LINE/X/Facebook 案内 | TASK-0090 | P0 | 共有先が案内される |
| TASK-0092 | Phase 12 | 共有カードの削除/再生成 | 再生成制御 | TASK-0084 | P1 | 条件変更で再生成できる |
| TASK-0093 | Phase 13 | ノート検索実装 | タイトル/場所/本文検索 | TASK-0065, TASK-0009 | P0 | 検索できる |
| TASK-0094 | Phase 13 | カレンダー表示実装 | 日付ベース閲覧 | TASK-0065 | P0 | カレンダーから辿れる |
| TASK-0095 | Phase 13 | Tag 保存/表示実装 | タグ機能 | TASK-0070 | P1 | タグが見える |
| TASK-0096 | Phase 13 | On This Day 実装 | 過去同日表示 | TASK-0065, TASK-0094 | P1 | 同日ノートが出る |
| TASK-0097 | Phase 13 | 月次/年次サマリー実装 | 振り返り集計 | TASK-0065 | P2 | 将来拡張として利用可 |
| TASK-0098 | Phase 14 | 設定トップ実装 | 設定ハブ | TASK-0028, TASK-0064 | P0 | 設定へアクセス可 |
| TASK-0099 | Phase 14 | プライバシー説明画面実装 | 写真/位置/AI/共有説明 | TASK-0098 | P0 | 説明文が確認できる |
| TASK-0100 | Phase 14 | 利用規約・問い合わせ画面実装 | 規約/問い合わせ | TASK-0098 | P0 | 審査に必要な導線あり |
| TASK-0101 | Phase 14 | データ削除導線の明示 | 削除説明 | TASK-0098, TASK-0069, TASK-0021 | P0 | 削除の流れが分かる |
| TASK-0102 | Phase 14 | 権限/AI/位置情報の説明文の最終調整 | 法務・説明文 | TASK-0099, TASK-0079 | P0 | 説明内容が一貫する |
| TASK-0103 | Phase 15 | Analytics イベント定義・送信実装 | イベント送信 | TASK-0014 | P1 | 主要イベントが計測される |
| TASK-0104 | Phase 15 | Crashlytics 例外ハンドリング整備 | クラッシュ監視 | TASK-0014 | P1 | 失敗が追える |
| TASK-0105 | Phase 15 | 使用量制限・回数制御実装 | usage_limits | TASK-0054, TASK-0081 | P0 | AI/招待等に上限を付けられる |
| TASK-0106 | Phase 15 | コスト増加ポイントの監視導線 | 簡易監視 | TASK-0103, TASK-0105 | P1 | 増加傾向を把握できる |
| TASK-0107 | Phase 15 | ログに機微情報を残さないガード | ログマスキング | TASK-0054, TASK-0104 | P0 | 個人情報が残らない |
| TASK-0108 | Phase 16 | 統合テスト計画作成 | テスト仕様書 | 全主要機能 | P0 | テスト観点が網羅される |
| TASK-0109 | Phase 16 | 単体テスト実装 | UseCase / Repository テスト | TASK-0002, TASK-0016 以降 | P0 | 主要ロジックがテスト済み |
| TASK-0110 | Phase 16 | Widget / Screen テスト実装 | 画面テスト | 各画面実装後 | P0 | 主要画面が検証済み |
| TASK-0111 | Phase 16 | Security Rules テスト実装 | 権限制御テスト | TASK-0012, TASK-0013, TASK-0072 | P0 | 権限漏れがない |
| TASK-0112 | Phase 16 | E2E の縦スライステスト実装 | 主要導線検証 | TASK-0034, TASK-0064, TASK-0090 | P0 | 作成→保存→共有まで通る |
| TASK-0113 | Phase 16 | 端末別表示崩れ・権限差分確認 | 実機確認 | TASK-0110, TASK-0112 | P0 | iOS/Androidで破綻なし |
| TASK-0114 | Phase 16 | ストア提出用素材作成 | スクショ、説明文、プライバシー文言 | TASK-0099, TASK-0100 | P0 | 提出素材が揃う |
| TASK-0115 | Phase 16 | リリースビルド・署名・配布設定 | Release build | TASK-0110〜0114 | P0 | ストア提出可能 |
| TASK-0116 | Phase 16 | 人間承認項目の最終確認 | 承認記録 | 全要承認事項 | P0 | 未決定事項が解消済み |

---

## 4. Phase 0: Project Setup

### 目的
実装開始前に、開発速度と後戻り防止の土台を作ります。

### 主要タスク
- `TASK-0001` リポジトリ初期化
- `TASK-0002` フォルダ構成決定
- `TASK-0003` 開発規約策定
- `TASK-0004` 環境切替設計
- `TASK-0005` パッケージ導入
- `TASK-0006` デザイントークン定義

### 完了イメージ
- Expo アプリが起動する
- 主要ライブラリが導入済み
- 開発の約束事が固まっている

---

## 5. Phase 1: Firebase Foundation

### 目的
認証、DB、Storage、Functions の基盤を先に通します。

### 主要タスク
- `TASK-0007` Firebase 接続
- `TASK-0008` Auth 有効化
- `TASK-0009` Firestore 初期スキーマ
- `TASK-0010` Storage 構成
- `TASK-0011` Functions 雛形
- `TASK-0012` Rules 初版
- `TASK-0013` Storage Rules 初版
- `TASK-0014` Analytics/Crashlytics
- `TASK-0015` 疎通確認

### 完了イメージ
- Firebase の各サービスが環境ごとに動く
- 最低限の権限制御が入る

---

## 6. Phase 2: Auth / Profile

### 目的
ログインとプロフィールを成立させ、共有前提のユーザー基盤を作ります。

### 主要タスク
- `TASK-0016` Auth ラッパー
- `TASK-0017` メール認証
- `TASK-0018` Google 認証
- `TASK-0019` Apple 認証
- `TASK-0020` ログアウト/復元
- `TASK-0021` アカウント削除
- `TASK-0022` プロフィール編集
- `TASK-0023` 登録後フロー

### 完了イメージ
- 登録・ログイン・再ログインができる
- プロフィールがクラウド保存される

---

## 7. Phase 3: Core Navigation / UI Shell

### 目的
画面遷移の骨格を先に作り、縦スライスを流せるようにします。

### 主要タスク
- `TASK-0024` ルーティング
- `TASK-0025` 共通レイアウト
- `TASK-0026` ホーム空状態
- `TASK-0027` ノート一覧の仮接続
- `TASK-0028` 設定枠組み

### 完了イメージ
- ホームから作成、詳細、設定へ遷移できる
- 空状態が成立する

---

## 8. Phase 4: Memory Note Creation

### 目的
「写真を選ぶだけでノート作成」の入口を実装します。

### 主要タスク
- `TASK-0029` 作成フロー状態管理
- `TASK-0030` 作成開始画面
- `TASK-0031` 写真選択画面
- `TASK-0032` 個人/共有ノート種別
- `TASK-0033` プレビューUI骨格
- `TASK-0034` 保存完了導線

### 完了イメージ
- 作成フローが画面上で一通りつながる

---

## 9. Phase 5: Photo Upload / Metadata

### 目的
写真選択、EXIF取得、アップロード前データ整形を成立させます。

### 主要タスク
- `TASK-0035` 写真ピッカー
- `TASK-0036` EXIF 読み取り
- `TASK-0037` GPSなしフォールバック
- `TASK-0038` 写真メタデータモデル
- `TASK-0039` バリデーション
- `TASK-0040` 進捗UI

### 完了イメージ
- 写真選択後、日時/GPS/向きの取得可否が分かる

---

## 10. Phase 6: Image Processing / Storage

### 目的
実データの保存、圧縮、サムネイル、削除まで通します。

### 主要タスク
- `TASK-0041` 圧縮
- `TASK-0042` サムネイル生成
- `TASK-0043` Storage アップロード
- `TASK-0044` Firestore 保存
- `TASK-0045` 再試行
- `TASK-0046` 削除連鎖
- `TASK-0047` 一時ファイル削除

### 完了イメージ
- 写真がクラウド保存され、一覧表示用の軽量画像も作られる

---

## 11. Phase 7: Map / Place Grouping

### 目的
地図付きノートの核を作ります。

### 主要タスク
- `TASK-0048` 地図基盤
- `TASK-0049` ピン表示
- `TASK-0050` 場所名推定
- `TASK-0051` スポットグループ化
- `TASK-0052` 地図/スポットUI
- `TASK-0053` 欠損表示

### 完了イメージ
- ノートに地図とスポット一覧が出る

---

## 12. Phase 8: AI Generation

### 目的
Release v1 の価値の一部である AI 下書きを成立させます。

### 主要タスク
- `TASK-0054` Functions から OpenAI 呼び出し
- `TASK-0055` 送信データ整形
- `TASK-0056` タイトル生成
- `TASK-0057` 日記生成
- `TASK-0058` AI結果保存
- `TASK-0059` フォールバック
- `TASK-0060` プレビュー反映
- `TASK-0061` タイトル編集
- `TASK-0062` 日記編集
- `TASK-0063` 場所名編集

### 完了イメージ
- AIドラフトを生成し、ユーザーが修正して保存できる

---

## 13. Phase 9: Note Detail / Edit / Delete

### 目的
保存後の実用性を完成させます。

### 主要タスク
- `TASK-0064` 詳細画面本実装
- `TASK-0065` 実データ一覧
- `TASK-0066` 編集画面
- `TASK-0067` 更新処理
- `TASK-0068` 削除確認
- `TASK-0069` 削除処理
- `TASK-0070` お気に入り/簡易タグ

### 完了イメージ
- 保存したノートを見返し、編集し、削除できる

---

## 14. Phase 10: Collaboration / Permission

### 目的
Release v1 の重要要件である共有ノートと権限を実装します。

### 主要タスク
- `TASK-0071` 共有データモデル
- `TASK-0072` 権限判定
- `TASK-0073` 共有ノート作成
- `TASK-0074` Editor編集権限
- `TASK-0075` Viewer制御
- `TASK-0076` メンバー管理
- `TASK-0077` Owner移譲
- `TASK-0078` 離脱
- `TASK-0079` 権限説明UI

### 完了イメージ
- Owner / Editor / Viewer が安全に動く

---

## 15. Phase 11: Invitation / Notification

### 目的
招待から参加までの実用導線を作ります。

### 主要タスク
- `TASK-0080` 招待モデル
- `TASK-0081` 招待リンク発行
- `TASK-0082` 招待受諾
- `TASK-0083` 通知/リマインド

### 完了イメージ
- 招待して参加してもらえる

---

## 16. Phase 12: SNS Share Card

### 目的
Release v1 必須の外部共有導線を完成させます。

### 主要タスク
- `TASK-0084` 共有カードモデル
- `TASK-0085` 1:1
- `TASK-0086` 4:5
- `TASK-0087` 9:16
- `TASK-0088` 位置ぼかし
- `TASK-0089` プレビュー
- `TASK-0090` 保存/共有
- `TASK-0091` 共有先導線
- `TASK-0092` 再生成

### 完了イメージ
- SNS共有カードを必ずプレビュー付きで出力できる

---

## 17. Phase 13: Search / Calendar / Tags

### 目的
ノートが増えた後の振り返り性を補強します。

### 主要タスク
- `TASK-0093` 検索
- `TASK-0094` カレンダー
- `TASK-0095` タグ
- `TASK-0096` On This Day
- `TASK-0097` 月次/年次サマリー

### 完了イメージ
- ノートを探しやすく、振り返りやすい

---

## 18. Phase 14: Settings / Privacy / Support

### 目的
本番公開に必要な説明責任を満たします。

### 主要タスク
- `TASK-0098` 設定トップ
- `TASK-0099` プライバシー説明
- `TASK-0100` 規約/問い合わせ
- `TASK-0101` データ削除導線
- `TASK-0102` 説明文最終調整

### 完了イメージ
- ストア審査・法務・運用に必要な導線がある

---

## 19. Phase 15: Analytics / Crashlytics / Cost Controls

### 目的
運用可能性と費用管理を整えます。

### 主要タスク
- `TASK-0103` Analytics
- `TASK-0104` Crashlytics
- `TASK-0105` 使用量制御
- `TASK-0106` コスト監視
- `TASK-0107` 機微情報マスキング

### 完了イメージ
- 失敗や費用増加を追跡できる

---

## 20. Phase 16: QA / Store Release

### 目的
Release v1 として公開できる状態にします。

### 主要タスク
- `TASK-0108` テスト計画
- `TASK-0109` 単体テスト
- `TASK-0110` Widget / Screen テスト
- `TASK-0111` Security Rules テスト
- `TASK-0112` E2E 縦スライステスト
- `TASK-0113` 実機確認
- `TASK-0114` ストア素材作成
- `TASK-0115` リリースビルド
- `TASK-0116` 人間承認確認

### 完了イメージ
- ストア提出に必要な品質・素材・承認が揃う

---

## 21. 推奨実装順

実装順は、**縦スライス優先**で以下を推奨します。

1. **Phase 0**
2. **Phase 1**
3. **Phase 2**
4. **Phase 3**
5. **Phase 4**
6. **Phase 5**
7. **Phase 6**
8. **Phase 7**
9.