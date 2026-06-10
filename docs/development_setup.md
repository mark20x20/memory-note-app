# Memory Note App Development Setup

## Project root

This repository is the implementation repository for Memory Note App.

Project path:
C:\Users\Masaki\memory_note_agent_system\memory-note-app

## Main stack

- React Native
- Expo
- TypeScript
- Expo Router
- Firebase Web SDK
- Firebase Auth
- Cloud Firestore
- Firebase Storage
- Cloud Functions
- OpenAI API via Cloud Functions

## Important rules

- Do not use Flutter.
- Do not use Dart.
- Do not use Riverpod.
- Do not use go_router.
- Do not use Supabase.
- Do not put OpenAI API keys in the mobile app.
- Do not put Firebase Admin SDK in the mobile app.
- Do not use files under _archive_flutter_old as implementation targets.

## Start app

Run the following commands from the project root:

npm install --legacy-peer-deps
npx expo start -c

## Specs

The official project specs are stored in:

final_spec/

## Logs

Implementation logs are stored in:

implementation_logs/

## Current status

Phase 0 completed.

- Expo app startup confirmed on Windows PowerShell.
- iPhone / Expo Go startup confirmed.
- Initial login screen displayed.
- Firebase integration is deferred to Phase 1.
- Auth implementation is deferred to Phase 2.
