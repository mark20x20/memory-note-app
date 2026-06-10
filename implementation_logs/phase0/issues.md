# Phase 0 Issues Log

## 実施日
2026-06-10

---

## 解決済み

| # | 問題 | 原因 | 解決策 |
|---|---|---|---|
| 1 | TypeScript エラー: `Type '"button"' is not assignable to type 'Variant'` | AppText.tsx の Variant 型に 'button' が含まれていなかった | Variant 型に 'button' を追加 |
| 2 | lint エラー: `'router' is defined but never used` | home.tsx で router import したが使っていなかった | import を削除 |
| 3 | lint エラー: `'StyleSheet' is defined but never used` | AppText.tsx で StyleSheet import したが使っていなかった | import を削除 |
| 4 | lint エラー: `expo/no-dynamic-env-var` | env.ts で `process.env[key]` の動的アクセスをしていた | 静的な ENV オブジェクトに変更 |
| 5 | lint 警告: `Unused eslint-disable directive` | noop.ts の @typescript-eslint/no-empty-function は不要だった | コメントを削除 |
| 6 | npm install エラー: ERESOLVE (react-dom バージョン不一致) | expo-router 内部の react-dom@19.2.7 が react@^19.2.7 を要求するが 19.2.3 がインストール済み | `--legacy-peer-deps` で回避 |

---

## 既知の注意事項（未解決だが問題なし）

| # | 事象 | 判断 |
|---|---|---|
| 1 | npm audit: 10 moderate severity vulnerabilities | Expo SDK の内部依存によるもの。アプリコードには無関係。Phase 1 以降で更新 |
| 2 | react-native-worklets の peer dependency 警告 | expo-router 内部の @expo/ui が要求。現 Phase では未使用 |

---

## Phase 1 で注意すること

- Firebase SDK インストール時も `--legacy-peer-deps` が必要になる可能性がある
- `expo-router` と Firebase JS SDK (v9/v10) の組み合わせで Auth セッション復元の実装を確認すること
- iOS の Apple Sign-In は Apple Developer Program が必要
- Firebase Emulator Suite のセットアップを Phase 1 冒頭で行うこと
