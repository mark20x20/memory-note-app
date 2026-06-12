# Phase 12.5C Callable Test — Build Log

## 日時
2026-06-12

## ステータス
完了（開発用テスト画面実装 — Firebase deploy 未実施）

---

## 作成ファイル一覧

| ファイル | 内容 |
|---|---|
| `src/features/placeIntelligence/api/placeFunctionsClient.ts` | 5つの callable wrapper（enrichNotePlaces / getPlaceCandidatesForGroup / refreshPlaceCandidates / selectPlaceCandidate / updatePlaceGroupManually） |
| `app/(app)/dev/place-callable-test.tsx` | 開発用テスト画面（__DEV__ 時のみ設定画面からアクセス） |
| `implementation_logs/phase12_5c_callable_test/build_log.md` | 本ファイル |
| `implementation_logs/phase12_5c_callable_test/decisions.md` | 設計上の決定事項 |
| `implementation_logs/phase12_5c_callable_test/issues.md` | 既知の課題 |
| `implementation_logs/phase12_5c_callable_test/next_steps.md` | 次のステップ |

---

## 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `app/(app)/settings.tsx` | `__DEV__` 時のみ表示される「開発用: Place Callable Test」リンクを追加。`SettingsLinkRow` に `onPress` プロパティを追加。 |

---

## 削除ファイル一覧

なし

---

## TypeScript チェック

```
npx tsc --noEmit
Exit 0（エラーなし）
```

## Expo Lint チェック

```
npx expo lint
Exit 0（警告・エラーなし）
```

## Functions ビルド

Cloud Functions を変更していないためスキップ。

## Firebase deploy

実施していない（Phase 12.5C 受け入れ条件通り）。

---

## 実装サマリー

### Callable Client (`placeFunctionsClient.ts`)

| 関数名 | 対象 Cloud Function |
|---|---|
| `enrichNotePlacesCallable` | `enrichNotePlaces` |
| `getPlaceCandidatesForGroupCallable` | `getPlaceCandidatesForGroup` |
| `refreshPlaceCandidatesCallable` | `refreshPlaceCandidates` |
| `selectPlaceCandidateCallable` | `selectPlaceCandidate` |
| `updatePlaceGroupManuallyCallable` | `updatePlaceGroupManually` |

- Firebase Client SDK の `httpsCallable` を使用
- `getFunctions(firebaseApp, ENV.FIREBASE_FUNCTIONS_REGION)` で初期化済みの `functions` インスタンスを利用
- エラーは `CallableError { code, message }` に整形して re-throw

### Dev Test Screen (`place-callable-test.tsx`)

- Route: `app/(app)/dev/place-callable-test.tsx`
- `enrichNotePlaces` 実行・結果 JSON 表示
- `forceRefresh` トグル
- Firestore リアルタイム監視（`subscribePlaceGroupsByNoteId`）
- PlaceGroup 表示（label / category / confidence / userConfirmed / photoCount / source / id）
- Candidates 読み込みボタン（`getPlaceCandidatesByGroupId`）
- `getPlaceCandidatesForGroup` callable 呼び出しボタン
- `refreshPlaceCandidates` callable 呼び出しボタン
- `selectPlaceCandidate` callable 呼び出しボタン（candidate 単位）
- エラー表示

### 設定画面リンク

`app/(app)/settings.tsx` の `__DEV__` ブロックに「開発用ツール」セクションを追加。
Expo Router の typed routes は dev 画面が未登録（`expo start` 実行後に自動更新）のため `as any` を使用。
