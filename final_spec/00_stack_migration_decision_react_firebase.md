# Stack Migration Decision React Firebase v2

## 1. 目的

本ドキュメントは、**Memory Note App / 思い出ノートアプリ** の実装スタックについて、  
**Flutter 前提を廃止し、React Native + Expo + TypeScript 前提へ移行する最終決定**を明文化するものです。

目的は以下です。

- 既存の **Firebase バックエンドを正** として維持する
- **Supabase へ移行しない** 方針を明確にする
- モバイルフロントエンドを **React Native + Expo + TypeScript** に統一する
- ルーティングを **Expo Router** に統一する
- AI を **Cloud Functions 経由** に限定し、APIキーをアプリへ入れない
- 管理画面を **Streamlit + Firebase Admin SDK** のまま維持する
- 実装者が、以後の `final_spec` 群をこの前提で再生成できるようにする

---

## 2. 最新決定

### 2.1 決定事項一覧

| 項目 | 決定 |
|---|---|
| モバイルフロントエンド | React Native + Expo + TypeScript |
| ルーティング | Expo Router |
| バックエンド | 既存 Firebase を継続使用 |
| 認証 | Firebase Authentication |
| DB | Cloud Firestore |
| 画像保存 | Firebase Storage |
| サーバ処理 | Cloud Functions |
| セキュリティ | Firestore Security Rules / Storage Rules |
| AI | OpenAI API を Cloud Functions 経由で利用 |
| 管理画面 | Streamlit + Firebase Admin SDK |
| ビルド | EAS Build |
| 移行方針 | Supabase には移行しない |
| 秘密情報管理 | モバイルアプリに OpenAI APIキーを入れない |

### 2.2 結論
このプロジェクトの正しい構成は以下です。

```text
[React Native + Expo + TypeScript]
   ├─ UI / Screen / State
   └─ Expo Router
        ↓
[Firebase Authentication]
[Cloud Firestore]
[Firebase Storage]
[Cloud Functions]
[Security Rules]
        ↓
[OpenAI API] ← Cloud Functions 経由のみ
[Streamlit Admin] ← Firebase Admin SDK
```

---

## 3. 変更理由

### 3.1 Flutter 前提をやめる理由
- 最新の開発方針が **React 系** に変更されたため
- UI 草案を **Figma Make → Figma Design → Codex → React Native + Expo** で実装する流れに合うため
- TypeScript による型安全性が、共有ノート・権限・メタデータ処理と相性がよいため
- Expo により、初期開発速度と配布速度を確保しやすいため

### 3.2 Supabase に移行しない理由
- 既存の Firebase 基盤がすでにある
- Firestore Rules / Storage Rules / Cloud Functions を前提にした仕様が既に固まっている
- 共有ノート、権限、削除、AI連携、SNS共有カードの責務分離を Firebase で維持した方が安全なため
- バックエンド移行は仕様・運用・セキュリティの再設計コストが高すぎるため

### 3.3 Firebase 継続の理由
- 既に **Auth / Firestore / Storage / Functions / Security Rules** が採用済み
- 共有ノートと共同編集の権限判定を Security Rules に落とし込みやすい
- Cloud Functions を介した OpenAI 利用に適している
- 既存のデータモデル・権限モデル・運用設計との整合性が高い

---

## 4. 維持するもの

以下は **そのまま維持** します。

| 項目 | 維持内容 |
|---|---|
| Firebase Authentication | ログイン・アカウント管理の基盤 |
| Cloud Firestore | ノート、メンバー、招待、設定、メタデータ保存 |
| Firebase Storage | 写真、サムネイル、共有カード画像保存 |
| Cloud Functions | AI呼び出し、削除処理、招待処理、集計処理 |
| Firestore Security Rules | ノート単位の権限制御 |
| Storage Rules | 画像・カード画像のアクセス制御 |
| OpenAI API 経由制御 | Cloud Functions のみから呼び出す |
| Streamlit 管理画面 | 運用・監査・設定変更の補助 |
| Firebase Admin SDK | 管理画面からの安全な管理操作 |
| Owner / Editor / Viewer | 権限モデルの中心 |
| SNS共有カード | 外部共有の中心導線 |
| 位置情報の慎重運用 | 精密座標の外部公開をしない |

---

## 5. 置き換えるもの

Flutter 前提だった要素を、以下へ置換します。

| 旧 | 新 |
|---|---|
| Flutter | React Native |
| Dart | TypeScript |
| Riverpod | React state / Zustand / TanStack Query 等のReact系状態管理 |
| go_router | Expo Router |
| Flutter widgets | React Native components |
| Flutter file structure | React Native / Expo の feature-based structure |
| FlutterFire 実装 | Expo + Firebase JS SDK / React Native 対応実装 |
| Flutter build | EAS Build |
| Flutter UI実装フロー | Figma Make → Figma Design → Codex → React Native 実装 |

### 補足
- 状態管理の最終採用は後続で確定してよいですが、**Flutter の Riverpod 前提は残さない**こと
- ルート管理は **Expo Router 前提** に統一すること
- モバイル実装は **TypeScript 必須** とすること

---

## 6. 採用しないもの

以下は今回の決定では **採用しません**。

| 項目 | 理由 |
|---|---|
| Supabase | 既存 Firebase を維持するため |
| Flutter | フロントエンド方針変更のため |
| Dart | Flutter 廃止に伴い不要 |
| Riverpod | Flutter 前提のため |
| go_router | Flutter 前提のため |
| Firebase からのバックエンド全面移行 | 仕様・運用コストが高いため |
| OpenAI APIキーのアプリ直埋め込み | セキュリティ上禁止 |
| アプリ内SNSフィード | 仕様対象外 |
| いいね / コメント / フォロー | 仕様対象外 |
| 公開プロフィール中心のSNS化 | 本アプリの方向性と不一致 |

---

## 7. 影響を受けるfinal_spec

以下の `final_spec` は、**Flutter 前提の記述を React Native + Expo + TypeScript 前提へ再生成**する必要があります。

| final_spec | 影響 |
|---|---|
| Current Technical Architecture | Flutter / Riverpod / go_router を置換 |
| Firebase Setup Guide | FlutterFire 前提を Expo / Firebase 連携前提へ再構成 |
| Screen List | 画面実装前提を React Native + Expo Router に変更 |
| User Flow | 遷移前提を Expo Router の画面構成に合わせて調整 |
| Cloud Functions API Spec | モバイルクライアントの呼び出し前提を Expo へ合わせる |
| Firestore Security Rules Spec | 基本影響は少ないが、クライアント実装前提の文言確認が必要 |
| Permission Model | 基本影響は少ないが、UI 制御前提の文言を再点検 |
| Functional Requirements | クライアント実装表現を React Native 前提に合わせて再確認 |
| Data Model | 基本維持。ただし管理画面やクライアント実装の文言確認が必要 |
| Operations Overview | 運用実装の参照スタックを更新 |
| Release Feature Scope | フロント実装前提の表現を更新 |

---

## 8. 影響を受けないfinal_spec

以下は **バックエンド中心のため、原則として大きな変更は不要** です。

| final_spec | 理由 |
|---|---|
| Permission Model | Owner / Editor / Viewer の設計は維持 |
| Data Model | Firebase 継続のため構造は基本維持 |
| Firestore Security Rules Spec | Firebase 継続のため中核は維持 |
| Cloud Functions API Spec | Firebase 継続のため API 方針は維持 |
| Operations Overview | 運用思想は維持 |
| Functional Requirements のサーバ要件 | Firebase 前提のため基本維持 |

### 注意
「影響を受けない」とは完全不変ではなく、**主にフロントエンド実装方法が変わるだけ**という意味です。  
表現や依存ライブラリ名は後続で点検してください。

---

## 9. 実装前に再生成するmd

実装開始前に、以下の md を **React Native + Expo + TypeScript 前提** で再生成してください。

### 必須再生成
1. `Current Technical Architecture`
2. `Firebase Setup Guide`
3. `Screen List`
4. `User Flow`
5. `Functional Requirements`

### 必要に応じて再生成
6. `Cloud Functions API Spec`
7. `Operations Overview`

### 再生成時のルール
- Flutter / Dart / Riverpod / go_router を残さない
- Supabase 前提を混ぜない
- Firebase 既存バックエンドを正とする
- Expo Router を画面遷移の前提にする
- OpenAI APIキーはアプリに入れない
- 管理画面は Streamlit + Firebase Admin SDK のままにする

---

## 10. リスク

### 10.1 技術リスク
- Expo で利用するライブラリの一部がネイティブ依存のため制約を受ける可能性
- Firebase JS SDK と React Native 環境の組み合わせで、ストレージ・認証・通知まわりの実装差分が出る可能性
- 画像処理、メタデータ抽出、共有シート周りで Expo の制約を確認する必要がある

### 10.2 移行リスク
- Flutter 前提の md が残ると、実装判断がぶれる
- 画面設計・状態管理・ルーティングの用語が混在しやすい
- 既存仕様書の「Flutter 実装」表現を放置すると、実装者が誤解する

### 10.3 運用リスク
- OpenAI APIキーを誤ってクライアントへ入れる事故
- Firebase Rules とアプリ側制御の不一致
- 共有ノート権限の取り違え
- Expo のビルド設定ミスによるリリース遅延

---

## 11. 移行時の注意

### 11.1 用語統一
以後、以下の用語を統一してください。

| 項目 | 統一後 |
|---|---|
| Flutterアプリ | React Native + Expo アプリ |
| Dart | TypeScript |
| Riverpod | React系状態管理 |
| go_router | Expo Router |
| FlutterFire | Expo/React Native 向け Firebase 実装 |
| 本番フロントエンド | React Native + Expo + TypeScript |

### 11.2 実装方針の注意
- UI 草案は Figma Make で作成してよい
- ただし実装本体は **React Native + Expo + TypeScript** にする
- Firebase は既存基盤を使う
- Supabase へ移行しない
- AI は Cloud Functions 経由のまま
- 管理画面は Streamlit を維持する

### 11.3 セキュリティ注意
- APIキーをアプリに保存しない
- Cloud Functions を経由せず AI に直接アクセスしない
- 権限判定をクライアントのみに任せない
- 画像・位置情報・招待情報をログへ出しすぎない

---

## 12. 最終採用スタック

### 12.1 モバイル
| 項目 | 採用 |
|---|---|
| Framework | React Native |
| Tooling | Expo |
| Language | TypeScript |
| Routing | Expo Router |
| Build | EAS Build |

### 12.2 Backend
| 項目 | 採用 |
|---|---|
| Auth | Firebase Authentication |
| DB | Cloud Firestore |
| Storage | Firebase Storage |
| Server | Cloud Functions |
| Security | Firestore Security Rules / Storage Rules |
| AI | OpenAI API via Cloud Functions |

### 12.3 Admin / Operations
| 項目 | 採用 |
|---|---|
| Admin UI | Streamlit |
| Admin SDK | Firebase Admin SDK |
| Monitoring | Firebase Analytics / Crashlytics |
| 監査 | Firestore / Logs / audit logs |

### 12.4 採用しないスタック
| 項目 | 不採用 |
|---|---|
| Frontend | Flutter |
| Language | Dart |
| State Management | Riverpod（Flutter前提） |
| Router | go_router（Flutter前提） |
| Backend Migration | Supabase |

---

必要であれば次に、**この決定を反映した `Current Technical Architecture v3` の全文** を、Flutter記述を完全除去した形で再生成できます。