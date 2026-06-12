# Phase 12.5C Callable Test — Decisions

## D1: Node.js スクリプトではなく開発用画面でテストする

**決定:** Firebase Admin SDK を使うサーバー側スクリプトではなく、Expo アプリ内の開発用画面から callable を呼び出す。

**理由:**
- callable は Firebase Auth のログインユーザーを `request.auth` で検証する。Admin SDK 経由だと auth が存在せず、`unauthenticated` エラーになる。
- 実機で実際のログインユーザーとして呼び出すことで、Firestore Rules・Auth 検証・uid 解決まで含めたエンドツーエンドのテストができる。
- UI も同時に確認できる（Firestore リアルタイム更新の動作確認）。

---

## D2: callable はログインユーザー権限に依存する

**決定:** `enrichNotePlaces` / `getPlaceCandidatesForGroup` / `refreshPlaceCandidates` / `selectPlaceCandidate` / `updatePlaceGroupManually` はすべて `request.auth.uid` を取得してアクセス制御を行う。

**影響:** テストには実機または Emulator でのログインが必須。Firebase Console のテストタブや REST API では auth が付与できないため正常動作しない。

---

## D3: dev-only link にした

**決定:** `app/(app)/settings.tsx` に `__DEV__` 条件で「開発用: Place Callable Test」リンクを追加した。

**理由:**
- 本番ビルドでは `__DEV__` が false になるため自動的に非表示になる。
- 本番ユーザーに開発用 UI が見えないようにする。
- Expo Router の既存の設定画面構造を壊さない。

---

## D4: 本番 UI は Phase 12.5E に残す

**決定:** 今回作成した `place-callable-test.tsx` は開発用テスト専用であり、本番ユーザー向けの UI（SCR-PLACE-001 / SCR-PLACE-002 / SCR-PLACE-004）は Phase 12.5E で実装する。

**理由:**
- Phase 12.5C Callable Test の目的は Cloud Functions の動作確認のみ。
- Phase 12.5D の AI ランキング・7因子スコアリングが完成してから本番 UI を作ると実装が安定する。

---

## D5: Expo Router typed routes に `as any` を使用

**決定:** `router.push('/(app)/dev/place-callable-test' as any)` で TypeScript の型エラーを回避した。

**理由:**
- `.expo/types/router.d.ts` は `expo start` 実行時に自動生成される。新しいルートを追加すると次回起動時に更新されるが、ビルド前は型が存在しない。
- dev-only の画面のため、型安全性よりも実装の簡潔さを優先した。
- `expo start` 後はこの警告がなくなり、`as any` を削除できる。
