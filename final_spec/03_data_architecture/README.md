# Data Architecture

このフォルダは、Memory Note App のデータ・技術アーキテクチャに関する最終仕様です。

## Current Stack

- Mobile frontend: React Native + Expo + TypeScript
- Routing: Expo Router
- Backend: Existing Firebase
- Auth: Firebase Authentication
- DB: Cloud Firestore
- Storage: Firebase Storage
- Server: Cloud Functions
- Security: Firestore Security Rules / Storage Rules
- AI: OpenAI API via Cloud Functions
- Admin: Streamlit + Firebase Admin SDK

## Files

- [01_data_model.md](./01_data_model.md)
- [02_technical_architecture.md](./02_technical_architecture.md)
- [03_expo_file_structure.md](./03_expo_file_structure.md)
- [04_firebase_setup_guide.md](./04_firebase_setup_guide.md)
- [05_cloud_functions_api_spec.md](./05_cloud_functions_api_spec.md)
- [06_firestore_security_rules_spec.md](./06_firestore_security_rules_spec.md)
- [07_firebase_client_integration_for_expo.md](./07_firebase_client_integration_for_expo.md)

## Deprecated

旧Flutter仕様は `final_spec/_archive_flutter_old/` に移動済みです。
