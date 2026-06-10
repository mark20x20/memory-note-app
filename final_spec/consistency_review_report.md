# Consistency Review Report

**レビュー実施日**: 2026-06-10  
**レビュー担当**: 仕様整合性レビュー（Claude Code）

---

## 現在の正式方針

| 項目 | 決定内容 |
|---|---|
| Mobile frontend | React Native + Expo + TypeScript |
| Routing | Expo Router |
| Backend | Existing Firebase |
| Auth | Firebase Authentication |
| DB | Cloud Firestore |
| Storage | Firebase Storage |
| Server | Cloud Functions |
| Security | Firestore Security Rules / Storage Rules |
| AI | OpenAI API via Cloud Functions |
| Admin Dashboard | Streamlit + Firebase Admin SDK |
| UI workflow | Figma Make → Figma Design → Codex → React Native + Expo実装 |
| Build / Release | EAS Build / TestFlight / App Store Connect |
| 禁止 | Flutter使わない / Supabase使わない / OpenAI APIキーをモバイルアプリに入れない / Firebase Admin SDKをモバイルアプリに入れない |
| 実装開始 | `07_implementation_prompts/01_phase0_expo_project_setup_prompt.md` |

---

## 確認したファイル一覧

### 最初に読むべき必須ファイル
- `final_spec/00_index.md`
- `final_spec/00_stack_migration_decision_react_firebase.md`
- `final_spec/03_data_architecture/02_technical_architecture.md`
- `final_spec/03_data_architecture/03_expo_file_structure.md`
- `final_spec/03_data_architecture/07_firebase_client_integration_for_expo.md`
- `final_spec/06_implementation_plan/02_updated_implementation_phases_react_firebase.md`
- `final_spec/07_implementation_prompts/README.md`
- `final_spec/07_implementation_prompts/01_phase0_expo_project_setup_prompt.md`
- `final_spec/04_ui_ux/06_figma_make_to_expo_workflow.md`

### その他の確認ファイル
- `final_spec/01_product_strategy/01_release_product_strategy.md`
- `final_spec/01_product_strategy/02_release_feature_scope.md`
- `final_spec/01_product_strategy/03_release_requirements_outline.md`
- `final_spec/01_product_strategy/04_release_risk_decisions.md`
- `final_spec/01_product_strategy/05_decision_table.md`
- `final_spec/01_product_strategy/README.md`
- `final_spec/02_requirements/01_functional_requirements.md`
- `final_spec/02_requirements/02_permission_model.md`
- `final_spec/02_requirements/README.md`
- `final_spec/03_data_architecture/01_data_model.md`
- `final_spec/03_data_architecture/04_firebase_setup_guide.md`
- `final_spec/03_data_architecture/05_cloud_functions_api_spec.md`
- `final_spec/03_data_architecture/06_firestore_security_rules_spec.md`
- `final_spec/03_data_architecture/README.md`
- `final_spec/04_ui_ux/01_screen_list.md`
- `final_spec/04_ui_ux/02_user_flow.md`
- `final_spec/04_ui_ux/03_ui_visual_direction.md`
- `final_spec/04_ui_ux/04_screen_mockup_prompts.md`
- `final_spec/04_ui_ux/05_sns_share_card_design_prompts.md`
- `final_spec/04_ui_ux/README.md`
- `final_spec/05_policies/01_image_storage_policy.md`
- `final_spec/05_policies/02_ai_data_policy.md`
- `final_spec/05_policies/03_sns_share_card_spec.md`
- `final_spec/05_policies/README.md`
- `final_spec/06_implementation_plan/01_development_tasks.md`
- `final_spec/06_implementation_plan/README.md`
- `final_spec/07_implementation_prompts/02_phase1_firebase_foundation_expo_prompt.md`
- `final_spec/07_implementation_prompts/03_phase2_auth_profile_expo_firebase_prompt.md`
- `final_spec/08_operations/01_operations_overview.md`
- `final_spec/08_operations/02_ai_ops_agent_design.md`
- `final_spec/08_operations/03_human_ops_runbook.md`
- `final_spec/08_operations/04_admin_dashboard_spec.md`
- `final_spec/08_operations/05_pricing_and_plan_control_spec.md`
- `final_spec/08_operations/06_monitoring_alerting_spec.md`
- `final_spec/08_operations/07_incident_response_policy.md`
- `final_spec/08_operations/08_release_maintenance_workflow.md`
- `final_spec/08_operations/README.md`

**合計**: 47ファイル（`_archive_flutter_old/` 内5ファイルは除外）

---

## 問題なしのファイル一覧

以下のファイルは現在の正式方針と整合しており、修正不要でした。

- `final_spec/00_stack_migration_decision_react_firebase.md` ✅
- `final_spec/03_data_architecture/02_technical_architecture.md` ✅
- `final_spec/03_data_architecture/03_expo_file_structure.md` ✅
- `final_spec/03_data_architecture/07_firebase_client_integration_for_expo.md` ✅
- `final_spec/03_data_architecture/README.md` ✅
- `final_spec/06_implementation_plan/02_updated_implementation_phases_react_firebase.md` ✅
- `final_spec/07_implementation_prompts/README.md` ✅
- `final_spec/07_implementation_prompts/01_phase0_expo_project_setup_prompt.md` ✅
- `final_spec/07_implementation_prompts/02_phase1_firebase_foundation_expo_prompt.md` ✅
- `final_spec/07_implementation_prompts/03_phase2_auth_profile_expo_firebase_prompt.md` ✅（「やらないこと」欄での "Flutter 実装" 記載は否定文として問題なし）
- `final_spec/04_ui_ux/06_figma_make_to_expo_workflow.md` ✅
- `final_spec/08_operations/01_operations_overview.md` ✅
- `final_spec/08_operations/02_ai_ops_agent_design.md` ✅
- `final_spec/08_operations/03_human_ops_runbook.md` ✅
- `final_spec/08_operations/04_admin_dashboard_spec.md` ✅
- `final_spec/08_operations/05_pricing_and_plan_control_spec.md` ✅
- `final_spec/08_operations/06_monitoring_alerting_spec.md` ✅
- `final_spec/08_operations/07_incident_response_policy.md` ✅
- `final_spec/08_operations/README.md` ✅
- `final_spec/01_product_strategy/README.md` ✅
- `final_spec/02_requirements/README.md` ✅
- `final_spec/05_policies/README.md` ✅

---

## 修正が必要なファイル一覧・検出した矛盾

### 1. `final_spec/00_index.md` 【修正対象】

**矛盾内容**:
- 「Final Product Direction」セクションに "iOS / Android 向け Flutter アプリ" と記載
- "OpenAI APIキーはFlutterアプリに直接入れない" と Flutter を前提にした記述
- Folder Structure の `03_data_architecture` 欄に "03_flutter_file_structure.md" というリンクが残っている（実ファイルは `03_expo_file_structure.md`）
- `07_implementation_prompts` セクションに旧Flutter用プロンプトへのリンクが残っている（`01_phase0_project_setup_prompt.md` 等）

**修正方針**: Flutter → React Native + Expo に修正。リンクを現在の正しいファイル名に修正。

---

### 2. `final_spec/04_ui_ux/01_screen_list.md` 【修正対象】

**矛盾内容**:
- 冒頭: "Release v1 で必要な画面を、Flutter 実装前提で整理します。"
- 末尾: "8. **Flutter の画面コンポーネント一覧**"

**修正方針**: Flutter → React Native + Expo に修正。

---

### 3. `final_spec/03_data_architecture/04_firebase_setup_guide.md` 【修正対象】

**矛盾内容**:
- タイトルからFlutter + Firebase + Riverpod + go_router 前提で書かれている
- FlutterFire CLI の使用、`lib/` ディレクトリ、Dart ファイル構成、pubspec.yaml など Flutter 固有の記述が全編に渡って存在する

**修正方針**: ファイル冒頭に「**[旧Flutter仕様 / Deprecated]** このファイルは旧Flutter前提で作成されました。React Native + Expo 前提の Firebase 接続設定は `07_firebase_client_integration_for_expo.md` を参照してください。」と明示する。内容は旧仕様として残す（削除しない）。

---

### 4. `final_spec/03_data_architecture/05_cloud_functions_api_spec.md` 【修正対象】

**矛盾内容**:
- "Flutter クライアントから直接危険な処理を行わせない" → React Native / Expo アプリに修正が必要
- "Flutter から呼びやすく" → Expo / React Native に修正が必要
- 関数一覧表の「呼び出し元」欄が全て "Flutter App" となっている

**修正方針**: "Flutter クライアント" → "React Native / Expo アプリ"、"Flutter App" → "Expo App" に修正。

---

### 5. `final_spec/03_data_architecture/06_firestore_security_rules_spec.md` 【修正対象】

**矛盾内容**:
- "### Flutter" セクションに `lib/core/permissions/permission_service.dart` など Dart / Flutter のファイルパスが記載されている

**修正方針**: "### Flutter" → "### React Native + Expo (参考)" に変更し、Dart ファイルパスを React Native + Expo の対応パスに修正。

---

### 6. `final_spec/06_implementation_plan/01_development_tasks.md` 【修正対象】

**矛盾内容**:
- 冒頭: "Release v1 を **Flutter + Firebase 前提の実運用可能な本番アプリ** として"
- TASK-0001: "Flutter プロジェクト作成"
- TASK-0005: "Riverpod / go_router / firebase系 / share_plus 等"
- TASK-0024: "go_router ルート定義"
- Phase 0 完了イメージ: "Flutter が起動する"

**修正方針**: Flutter → React Native + Expo、Riverpod → Zustand等、go_router → Expo Router に修正。

---

### 7. `final_spec/08_operations/08_release_maintenance_workflow.md` 【修正対象】

**矛盾内容**:
- 変更種別 "3.7 mobile app release" の説明: "Flutter アプリ本体のリリース。"
- 「8.3 反映手段」に "Flutter App リリース" と記載

**修正方針**: "Flutter アプリ" → "React Native + Expo アプリ" に修正。

---

### 8. `final_spec/01_product_strategy/04_release_risk_decisions.md` 【修正対象】

**矛盾内容**:
- "クラウド方針 | Firebase / Supabase のどちらを採用するか" が未決定として残っている
- "未決定事項一覧" に "Firebase / Supabase 最終選定" が記載
- "次に必要な意思決定" に "クラウド基盤を Firebase / Supabase から選ぶ" が記載

**修正方針**: クラウド基盤は Firebase に決定済みとして、該当箇所を「決定済み: Firebase」と明記する。

---

### 9. `final_spec/01_product_strategy/05_decision_table.md` 【修正対象】

**矛盾内容**:
- クラウド基盤の比較表: "Firebase | 個人開発、**Flutter**、最短実装..."
- Supabase の弱み: "**Flutter**では設計力が要る"
- "Flutterとの相性" が Firebase の利点として記載

**修正方針**: Flutter参照を React Native + Expo に差し替え。Supabaseは比較参考として残すが "採用済み: Firebase" を明記。

---

### 10. `final_spec/04_ui_ux/README.md` 【修正対象】

**矛盾内容**:
- ファイル一覧に `06_figma_make_to_expo_workflow.md` が記載されていない（ファイルは存在する）

**修正方針**: `06_figma_make_to_expo_workflow.md` へのリンクを追加。

---

### 11. `final_spec/06_implementation_plan/README.md` 【修正対象】

**矛盾内容**:
- ファイル一覧に `02_updated_implementation_phases_react_firebase.md` が記載されていない（ファイルは存在する）

**修正方針**: `02_updated_implementation_phases_react_firebase.md` へのリンクを追加。

---

## Open Questions

特になし。すべての矛盾は明確で、正式方針に基づいて修正可能と判断。

---

## 修正内容ログ

（各ファイル修正後に追記）

### `00_index.md`
- 「Final Product Direction」を Flutter → React Native + Expo に修正
- `03_flutter_file_structure.md` リンクを `03_expo_file_structure.md` に修正
- 旧Flutter実装プロンプトへのリンクを削除

### `04_ui_ux/01_screen_list.md`
- 冒頭の "Flutter 実装前提" → "React Native + Expo 実装前提" に修正
- 末尾の "Flutter の画面コンポーネント一覧" → "React Native コンポーネント一覧" に修正

### `03_data_architecture/04_firebase_setup_guide.md`
- ファイル冒頭に [旧Flutter仕様 / Deprecated] 注記を追加
- 参照先として `07_firebase_client_integration_for_expo.md` を案内

### `03_data_architecture/05_cloud_functions_api_spec.md`
- "Flutter クライアント" → "React Native / Expo アプリ" に修正
- 関数一覧の "Flutter App" → "Expo App" に修正

### `03_data_architecture/06_firestore_security_rules_spec.md`
- "### Flutter" セクション → "### React Native + Expo" に変更し、Dart パスを TS パスに修正

### `06_implementation_plan/01_development_tasks.md`
- 冒頭 "Flutter + Firebase 前提" → "React Native + Expo + Firebase 前提" に修正
- 各タスクの Flutter/Riverpod/go_router を React Native + Expo 向けに修正

### `08_operations/08_release_maintenance_workflow.md`
- "Flutter アプリ本体のリリース" → "React Native + Expo アプリ本体のリリース" に修正
- "Flutter App リリース" → "React Native + Expo App リリース" に修正

### `01_product_strategy/04_release_risk_decisions.md`
- Firebase 決定済みとして "Firebase / Supabase" 未決定記述を修正

### `01_product_strategy/05_decision_table.md`
- Flutter参照を React Native + Expo に修正

### `04_ui_ux/README.md`
- `06_figma_make_to_expo_workflow.md` のリンクを追加

### `06_implementation_plan/README.md`
- `02_updated_implementation_phases_react_firebase.md` のリンクを追加
