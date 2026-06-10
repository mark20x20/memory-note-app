# Memory Note App Final Specification

Generated at: 2026-06-08 21:50:55

## Purpose

このフォルダは、Memory Note App / 思い出ノートアプリの実装開始前に参照する最終決定版仕様です。

今後の実装エージェント、Codex、Claude Code、Cursor などには、基本的にこの `final_spec/` 配下を正として参照させます。

## Final Product Direction

- iOS / Android 向け React Native + Expo + TypeScript アプリ
- Firebase Authentication / Firestore / Storage / Cloud Functions 前提
- 写真から地図付き思い出ノートを作成
- クラウド保存前提
- 共有ノート / 共同編集対応
- Owner / Editor / Viewer 権限
- SNS共有カード対応
- OpenAI APIキーはモバイルアプリに直接入れない
- AI生成はCloud Functions経由
- 画像は圧縮画像 + サムネイル中心

## Folder Structure

### 01_product_strategy

- [README](./01_product_strategy/README.md)
- [01_release_product_strategy.md](./01_product_strategy/01_release_product_strategy.md)
- [02_release_feature_scope.md](./01_product_strategy/02_release_feature_scope.md)
- [03_release_requirements_outline.md](./01_product_strategy/03_release_requirements_outline.md)
- [04_release_risk_decisions.md](./01_product_strategy/04_release_risk_decisions.md)
- [05_decision_table.md](./01_product_strategy/05_decision_table.md)

### 02_requirements

- [README](./02_requirements/README.md)
- [01_functional_requirements.md](./02_requirements/01_functional_requirements.md)
- [02_permission_model.md](./02_requirements/02_permission_model.md)

### 03_data_architecture

- [README](./03_data_architecture/README.md)
- [01_data_model.md](./03_data_architecture/01_data_model.md)
- [02_technical_architecture.md](./03_data_architecture/02_technical_architecture.md)
- [03_expo_file_structure.md](./03_data_architecture/03_expo_file_structure.md)
- [04_firebase_setup_guide.md](./03_data_architecture/04_firebase_setup_guide.md)
- [05_cloud_functions_api_spec.md](./03_data_architecture/05_cloud_functions_api_spec.md)
- [06_firestore_security_rules_spec.md](./03_data_architecture/06_firestore_security_rules_spec.md)

### 04_ui_ux

- [README](./04_ui_ux/README.md)
- [01_screen_list.md](./04_ui_ux/01_screen_list.md)
- [02_user_flow.md](./04_ui_ux/02_user_flow.md)
- [03_ui_visual_direction.md](./04_ui_ux/03_ui_visual_direction.md)
- [04_screen_mockup_prompts.md](./04_ui_ux/04_screen_mockup_prompts.md)
- [05_sns_share_card_design_prompts.md](./04_ui_ux/05_sns_share_card_design_prompts.md)

### 05_policies

- [README](./05_policies/README.md)
- [01_image_storage_policy.md](./05_policies/01_image_storage_policy.md)
- [02_ai_data_policy.md](./05_policies/02_ai_data_policy.md)
- [03_sns_share_card_spec.md](./05_policies/03_sns_share_card_spec.md)

### 06_implementation_plan

- [README](./06_implementation_plan/README.md)
- [01_development_tasks.md](./06_implementation_plan/01_development_tasks.md)

### 07_implementation_prompts

- [README](./07_implementation_prompts/README.md)
- [01_phase0_expo_project_setup_prompt.md](./07_implementation_prompts/01_phase0_expo_project_setup_prompt.md)
- [02_phase1_firebase_foundation_expo_prompt.md](./07_implementation_prompts/02_phase1_firebase_foundation_expo_prompt.md)
- [03_phase2_auth_profile_expo_firebase_prompt.md](./07_implementation_prompts/03_phase2_auth_profile_expo_firebase_prompt.md)

### 08_operations

- [README](./08_operations/README.md)
- [01_operations_overview.md](./08_operations/01_operations_overview.md)
- [02_ai_ops_agent_design.md](./08_operations/02_ai_ops_agent_design.md)
- [03_human_ops_runbook.md](./08_operations/03_human_ops_runbook.md)
- [04_admin_dashboard_spec.md](./08_operations/04_admin_dashboard_spec.md)
- [05_pricing_and_plan_control_spec.md](./08_operations/05_pricing_and_plan_control_spec.md)
- [06_monitoring_alerting_spec.md](./08_operations/06_monitoring_alerting_spec.md)
- [07_incident_response_policy.md](./08_operations/07_incident_response_policy.md)
- [08_release_maintenance_workflow.md](./08_operations/08_release_maintenance_workflow.md)


## Stack Migration Decision

- [React Native Expo + Firebase Migration Decision](./00_stack_migration_decision_react_firebase.md)

## React Native Expo + Firebase Updated Specs

- [Technical Architecture](./03_data_architecture/02_technical_architecture.md)
- [Expo File Structure](./03_data_architecture/03_expo_file_structure.md)
- [Firebase Client Integration for Expo](./03_data_architecture/07_firebase_client_integration_for_expo.md)
- [Updated Implementation Phases React Firebase](./06_implementation_plan/02_updated_implementation_phases_react_firebase.md)
- [Figma Make to Expo Workflow](./04_ui_ux/06_figma_make_to_expo_workflow.md)

## React Native Expo Implementation Prompts

- [Phase 0 Expo Project Setup](./07_implementation_prompts/01_phase0_expo_project_setup_prompt.md)
- [Phase 1 Firebase Foundation Expo](./07_implementation_prompts/02_phase1_firebase_foundation_expo_prompt.md)
- [Phase 2 Auth Profile Expo Firebase](./07_implementation_prompts/03_phase2_auth_profile_expo_firebase_prompt.md)


## Implementation Start Order

現在の正しい実装開始順序は以下です。

1. `07_implementation_prompts/01_phase0_expo_project_setup_prompt.md`
2. Phase 0 実装結果確認
3. `07_implementation_prompts/02_phase1_firebase_foundation_expo_prompt.md`
4. Phase 1 実装結果確認
5. `07_implementation_prompts/03_phase2_auth_profile_expo_firebase_prompt.md`
6. Phase 2 実装結果確認

## Deprecated Implementation Prompts

旧Flutter用の実装プロンプトは使用しません。

- `01_phase0_project_setup_prompt.md`
- `02_phase1_firebase_foundation_prompt.md`
- `03_phase2_auth_profile_prompt.md`

これらは `final_spec/_archive_flutter_old/` に退避済みです。


## Notes

- `outputs/` は生成途中の成果物として扱う。
- `final_spec/` は実装前の最終決定版として扱う。
- 仕様を変更する場合は、まず `outputs/` 側で再生成し、その後このフォルダへ反映する。
- 実装中に仕様変更が発生した場合は、`final_spec/` の該当mdを更新し、変更履歴を残す。
