# Phase 9: Cloud Functions API Design — generateMemoryDiary

## 1. Function 名

```
generateMemoryDiary
```

## 2. Callable Function を推奨する理由

Firebase Cloud Functions には HTTP Functions と Callable Functions の2種類がある。  
Phase 9 では **Callable Functions** を採用する。

| 比較項目 | HTTP Functions | Callable Functions（推奨） |
|---|---|---|
| 認証チェック | 手動で Authorization ヘッダーを検証 | `context.auth` で自動取得 |
| クライアント SDK | `fetch` / `axios` | `httpsCallable()` |
| エラー返却 | HTTP ステータスで返す | `HttpsError` で構造化エラー |
| CORS 設定 | 手動設定必要 | 自動 |
| モバイルからの呼び出し | 可能（認証は別途） | 可能（認証統合済み） |

Callable Functions は認証・エラー処理・CORS を一元管理できるため、  
モバイルアプリからの安全な呼び出しに適している。

## 3. Request 型

```typescript
// モバイル側から送る入力
type GenerateMemoryDiaryRequest = {
  noteId: string;
};
```

**noteId のみを受け取る。** OpenAI に渡す入力データはすべてサーバー側で Firestore から取得する。  
これによりクライアントからの入力改ざんを防ぐ。

## 4. Response 型

```typescript
// Functions から返すレスポンス
type GenerateMemoryDiaryResponse = {
  success: boolean;
  aiDiary?: string;  // 生成成功時のみ
  error?: string;    // 生成失敗時のエラーメッセージ（ユーザー向け）
};
```

## 5. 認証チェック

```typescript
// context.auth が null なら未認証エラー
if (!context.auth) {
  throw new functions.https.HttpsError(
    'unauthenticated',
    '認証が必要です'
  );
}
const uid = context.auth.uid;
```

## 6. noteId バリデーション

```typescript
// 型・形式チェック
if (typeof data.noteId !== 'string' || data.noteId.trim() === '') {
  throw new functions.https.HttpsError(
    'invalid-argument',
    'noteId が不正です'
  );
}
const noteId = data.noteId.trim();
```

## 7. Firestore から取得するデータ

```typescript
// ノートドキュメント取得
const noteRef = admin.firestore().doc(`memory_notes/${noteId}`);
const noteSnap = await noteRef.get();

if (!noteSnap.exists) {
  throw new functions.https.HttpsError('not-found', 'ノートが見つかりません');
}
const noteData = noteSnap.data()!;

// 写真メタデータ取得（sortOrder 昇順）
const photosSnap = await admin.firestore()
  .collection(`memory_notes/${noteId}/photos`)
  .orderBy('sortOrder', 'asc')
  .get();
const photos = photosSnap.docs.map(d => d.data());
```

## 8. Owner / Member 権限確認

```typescript
// ownerId またはメンバーであることを確認
const ownerId = noteData.ownerId as string;
const members = noteData.members as Record<string, string> | undefined;

const isOwner = ownerId === uid;
const isMember = members != null && uid in members;

if (!isOwner && !isMember) {
  throw new functions.https.HttpsError(
    'permission-denied',
    'このノートへのアクセス権限がありません'
  );
}
```

## 9. OpenAI API 呼び出し

```typescript
// 写真メタデータを集約してコンテキストを組み立てる
const takenAtList = photos
  .map(p => p.takenAt)
  .filter((t): t is string => typeof t === 'string' && t.length > 0)
  .slice(0, 10); // 最大10件

const locationGroups = aggregateLocations(photos); // 代表座標のグループ数

const context: DiaryContext = {
  title: noteData.title,
  memo: noteData.memo ?? '',
  noteType: noteData.noteType,
  photoCount: noteData.photoCount ?? photos.length,
  takenAtList,
  locationGroupCount: locationGroups.length,
};

// OpenAI API 呼び出し（詳細は 03_openai_prompt_design.md 参照）
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(context) },
  ],
  max_tokens: 300,
  temperature: 0.7,
});

const aiDiary = completion.choices[0]?.message?.content?.trim() ?? '';
```

## 10. Firestore 保存

```typescript
// 生成結果を memory_notes/{noteId} に書き込む
await noteRef.update({
  aiDiary,
  aiDiaryStatus: 'completed',
  aiDiaryGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
  aiDiaryUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

## 11. 生成開始時のステータス更新

Functions 呼び出し前にモバイル側から `aiDiaryStatus: 'generating'` を書き込むか、  
Functions の冒頭で書き込む方針どちらも可。  
**推奨:** Functions 冒頭で `generating` に更新 → 完了時に `completed`、失敗時に `failed` へ更新。

```typescript
// 処理開始時
await noteRef.update({
  aiDiaryStatus: 'generating',
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

try {
  // ... OpenAI 呼び出し ...
  await noteRef.update({ aiDiaryStatus: 'completed', aiDiary, ... });
} catch (e) {
  await noteRef.update({
    aiDiaryStatus: 'failed',
    aiDiaryError: (e as Error).message ?? 'Unknown error',
    aiDiaryUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  throw new functions.https.HttpsError('internal', 'AI生成に失敗しました');
}
```

## 12. エラーコード方針

| エラーコード | 意味 |
|---|---|
| `unauthenticated` | 未ログイン |
| `invalid-argument` | `noteId` が不正 |
| `not-found` | ノートが Firestore に存在しない |
| `permission-denied` | ノートへのアクセス権限なし |
| `resource-exhausted` | レート制限（将来実装） |
| `internal` | OpenAI API エラー / その他サーバーエラー |

## 13. Deploy 方針

```bash
# Functions のみデプロイ（ルール等は変更なし）
npx firebase-tools deploy --only functions --project <project-id>
```

### Functions の Node.js バージョン

`firebase/functions/package.json` の `engines.node` に合わせる（Node.js 20 推奨）。

### OpenAI API キー設定

```bash
# Firebase Functions 環境変数（Secret Manager 推奨）
# 方法 A: firebase functions:config（旧来方式）
firebase functions:config:set openai.api_key="sk-..."

# 方法 B: Firebase Secret Manager（推奨）
firebase functions:secrets:set OPENAI_API_KEY
# → Functions コード内で process.env.OPENAI_API_KEY として参照
```

詳細は `04_security_cost_policy.md` を参照。

## 14. Functions package.json 作成が必要

現在 `firebase/functions/src/index.ts` はスタブのみ。  
Phase 9 実装前に `firebase/functions/package.json` と `tsconfig.json` の確認・作成が必要。

```
firebase/functions/
  package.json        ← 要確認（存在しない場合は作成）
  tsconfig.json       ← 要確認
  src/
    index.ts          ← generateMemoryDiary を追加
```
