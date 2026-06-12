# Phase 9 Decisions — AI Generation via Cloud Functions

## D1: OpenAI API 呼び出しを Cloud Functions 経由にする

**決定:** モバイルアプリから OpenAI API を直接呼び出さず、Firebase Cloud Functions の Callable Function を経由する。

**理由:**
- モバイルアプリバイナリに OpenAI API キーを埋め込むと漏洩リスクがある
- Cloud Functions 経由にすることで認証チェック・レート制限・ログ管理をサーバー側で一元管理できる
- 既存の実装方針（`02_updated_implementation_phases_react_firebase.md` §9.3）に準拠

## D2: OpenAI API キーをモバイルに置かない

**決定:** OpenAI API キーは Firebase Secret Manager（`defineSecret('OPENAI_API_KEY')`）にのみ保管する。  
`.env`, `app.json`, ソースコードへの記載は禁止。

**理由:**
- React Native アプリのバイナリは文字列抽出ツールで解析可能
- GitHub 等に誤ってコミットされた場合、即座にスキャンツールに検出される
- Secret Manager は暗号化保管・アクセス制御・監査ログが自動的に付く

## D3: 画像は送らずメタデータのみ使う

**決定:** OpenAI API に渡す入力は title, memo（最大200文字）, noteType, photoCount, takenAtList（最大10件）, locationGroupCount のみ。写真画像は送らない。

**理由:**
- Vision API（gpt-4o）はコストが gpt-4o-mini の約 15 倍
- ユーザーの写真を OpenAI に送ることへの同意・説明コストが発生する
- Phase 9 のスコープ（文章生成の検証）はメタデータのみで達成可能

## D4: AI 日記はまず memory_notes ドキュメント直下に保存する

**決定:** `memory_notes/{noteId}` ドキュメントに `aiDiary`, `aiDiaryStatus`, `aiDiaryGeneratedAt` 等のフィールドを直接追加する。

**理由:**
- モバイル側はすでに `memory_notes/{noteId}` を `onSnapshot` で監視している（Phase 9 で切り替え済み）
- フィールドを追加するだけで既存の監視コードを再利用できる
- サブコレクションを追加するとクエリコストが増加する

## D5: 生成失敗してもノート閲覧を壊さない

**決定:** AI 日記生成の失敗は `aiDiaryStatus: 'failed'` として記録するのみ。  
title / memo / photos / coverPhotoURL は一切変更しない。

**実装:**
- Functions の `try-catch` で失敗を捕捉
- `aiDiaryStatus: 'failed'`, `aiDiaryError` を Firestore に書き込む
- モバイル側の `AiDiarySection` のみがエラー UI を表示
- 写真・地図・メモセクションには影響なし

## D6: Rate limit の本格実装は必要に応じて後続フェーズへ

**決定:** Phase 9 では「同じノートの `generating` 中は重複呼び出しを拒否する」最低限の制御のみ実装する。  
1日あたりの生成回数制限・ユーザーごとの上限・課金プラン連動は Phase 15 以降に実装する。

**実装:**
```typescript
if (currentStatus === 'generating') {
  throw new HttpsError('already-exists', 'AI生成が進行中です');
}
```

## D7: Callable Functions v2 を採用（HTTP Functions ではなく）

**決定:** Cloud Functions v2 の `onCall`（Callable Function）を採用する。

**実装:**
```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
```

**理由:**
- `request.auth` で Firebase Auth の認証チェックが自動化される
- `HttpsError` による構造化エラー返却でモバイル側のエラーハンドリングが簡潔になる
- CORS 設定が不要
- `defineSecret` と組み合わせて Secret Manager を安全に使える

## D8: useNoteDetail で onSnapshot に切り替え

**決定:** `[noteId].tsx` のノート取得を `getNoteById`（1回取得）から `useNoteDetail`（onSnapshot）に切り替えた。

**理由:**
- AI 生成中に `aiDiaryStatus` が `'generating'` → `'completed'` / `'failed'` に変化するが、
  1回取得ではこの変化をモバイル側に即時反映できない
- `onSnapshot` を使うことで、Cloud Functions が Firestore を更新した瞬間に UI が自動更新される
- 別端末で生成を開始した場合も同じノートを開いていれば自動反映される

## D9: AiDiarySection を独立コンポーネントにする

**決定:** AI日記 UI を `AiDiarySection.tsx` として独立したコンポーネントに切り出す。

**理由:**
- AI日記の状態管理（idle/generating/completed/failed）を Detail 画面本体から隔離する
- 生成失敗が他のセクション（写真・地図・メモ）の表示に影響しない
- Phase 10 で編集機能を追加する際に `AiDiarySection` の変更だけで対応できる
