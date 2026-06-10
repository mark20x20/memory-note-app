# Phase 2 Issues Log

## 実施日
2026-06-11

---

## 解決済み

| # | 問題 | 原因 | 解決策 |
|---|---|---|---|
| 1 | `getReactNativePersistence` が `firebase/auth` の TypeScript 型に存在しない | `firebase` パッケージのラッパーが browser 型を参照、react-native 条件がない | `src/types/firebase-rn.d.ts` でモジュール拡張宣言を追加 |
| 2 | Expo Router 新ルートが TypeScript の型に含まれない | `.expo/types/router.d.ts` が古いまま (sign-up, profile-setup, settings 未収録) | `.expo/types/router.d.ts` を手動更新 |

---

## 既知の注意事項（未解決だが問題なし）

| # | 事象 | 判断 |
|---|---|---|
| 1 | `npm audit: 12 moderate vulnerabilities` | Phase 0 からの継続。アプリコードには無関係 |
| 2 | Expo Go での Google/Apple Sign-In 未実装 | Phase 2 のスコープ外。ボタンは表示し、Alert で「近日対応予定」を表示 |
| 3 | profile-setup での `userRepository.createUser` 失敗時に Firestore ドキュメントが残らない | 登録直後の State は `needsProfileSetup` のまま。再度 profile-setup を表示できるため問題なし |
| 4 | SafeAreaView deprecated warning | Phase 0 からの継続。UI 調整時に react-native-safe-area-context へ移行 |
| 5 | `.expo/types/router.d.ts` は `npx expo start` で自動更新される | 手動更新した内容が上書きされる可能性。Expo start 後に再度 typecheck が必要な場合あり |

---

## Phase 3 で注意すること

- Firestore Security Rules の `memory_notes` など Phase 3 コレクションの開放
- Storage Rules をパスベース (notes/{noteId}/...) に限定する
- `useAuthSession` を Context に移行して多重 subscription を防ぐ検討
- Expo Router の typed routes は `npx expo start` で自動再生成される
- Apple Sign-In / Google Sign-In は別途 expo-apple-authentication / expo-auth-session が必要
