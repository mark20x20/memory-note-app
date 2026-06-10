# Memory Note App

Memory Note App is a mobile app for creating travel and memory notes from selected photos.

## Current status

Phase 0 completed.

- React Native + Expo + TypeScript project created
- Expo Router configured
- Initial app routes created
- Shared UI components created
- Theme files created
- Firebase stubs created
- Phase 0 implementation logs created
- iPhone / Expo Go startup confirmed

## Tech stack

- React Native
- Expo
- TypeScript
- Expo Router
- Firebase
- Cloud Functions
- OpenAI API via Cloud Functions

## Project structure

- app/ : Expo Router screens
- src/ : Application source code
- firebase/ : Firebase rules and functions stubs
- generated_ui/ : Figma Make reference outputs
- final_spec/ : Official specification documents
- implementation_logs/ : Phase-by-phase implementation logs
- docs/ : Development notes

## Development

Run from the project root:

npm install --legacy-peer-deps
npx expo start -c

## Important implementation rules

- Firebase Web SDK is preferred.
- Do not use @react-native-firebase unless explicitly decided later.
- Do not expose OpenAI API keys in the mobile app.
- Do not expose Firebase Admin SDK in the mobile app.
- Do not use Flutter, Dart, Riverpod, go_router, or Supabase.

## Next phase

Phase 1: Firebase foundation.
