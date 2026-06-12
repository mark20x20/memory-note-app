# Phase 9: Firestore Data Model — AI Diary Fields

## 1. 既存 NoteDoc への追加フィールド

Phase 9 では `memory_notes/{noteId}` ドキュメントに以下のフィールドを追加する。  
既存フィールド（`title`, `memo`, `ownerId`, `coverPhotoURL` 等）は一切変更しない。

### 追加フィールド一覧

| フィールド名 | 型 | 初期値 | 説明 |
|---|---|---|---|
| `aiDiary` | `string \| null` | フィールドなし（未生成） | AI が生成した短文日記テキスト |
| `aiDiaryStatus` | `'idle' \| 'generating' \| 'completed' \| 'failed'` | フィールドなし（= idle 扱い） | 生成ステータス |
| `aiDiaryGeneratedAt` | `Timestamp \| null` | フィールドなし | 最後に生成成功した日時 |
| `aiDiaryUpdatedAt` | `Timestamp \| null` | フィールドなし | ステータスが更新された日時 |
| `aiDiaryError` | `string \| null` | フィールドなし | 生成失敗時のエラーメッセージ（ユーザー向け） |

### フィールドが「なし」の場合の扱い

既存ノートは Phase 9 適用前に作成されており、AI 日記フィールドを持たない。  
モバイル側では `aiDiaryStatus` が `undefined` または `null` の場合、`idle` と同等に扱う。

```typescript
// モバイル側での扱い例
const status = note.aiDiaryStatus ?? 'idle';
```

## 2. NoteDoc 型の更新案

```typescript
// src/core/repositories/noteRepository.ts への追加
export interface NoteDoc {
  id: string;
  ownerId: string;
  title: string;
  memo: string;
  noteType: NoteType;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  members: Record<string, MemberRole>;
  coverPhotoURL?: string | null;
  photoCount?: number;

  // Phase 9: AI Diary
  aiDiary?: string | null;
  aiDiaryStatus?: 'idle' | 'generating' | 'completed' | 'failed';
  aiDiaryGeneratedAt?: Timestamp | null;
  aiDiaryUpdatedAt?: Timestamp | null;
  aiDiaryError?: string | null;
}
```

すべて optional（`?`）にすることで既存ノートとの後方互換性を保つ。

## 3. ステータス遷移

```
[未生成 / undefined]
       ↓ ユーザーが「AI日記を生成」ボタンを押す
   'generating'
       ↓ 成功
   'completed'  → aiDiary フィールドに本文が入る
       ↓ 再生成ボタン
   'generating'

   'generating'
       ↓ 失敗
    'failed'    → aiDiaryError にエラーメッセージが入る
       ↓ 再試行ボタン
   'generating'
```

## 4. Firestore への書き込みタイミング

| タイミング | 書き込む値 |
|---|---|
| Functions 呼び出し開始直後 | `aiDiaryStatus: 'generating'`, `aiDiaryUpdatedAt` |
| OpenAI API 成功後 | `aiDiary`, `aiDiaryStatus: 'completed'`, `aiDiaryGeneratedAt`, `aiDiaryUpdatedAt`, `updatedAt` |
| OpenAI API 失敗時 | `aiDiaryStatus: 'failed'`, `aiDiaryError`, `aiDiaryUpdatedAt` |

## 5. optional なサブコレクション案 — ai_generation_runs

Phase 9 では実装しない。Phase 15 以降のコスト管理・監査ログとして検討する。

```
memory_notes/{noteId}/ai_generation_runs/{runId}
  triggeredBy: string (uid)
  triggeredAt: Timestamp
  model: string ('gpt-4o-mini')
  inputTokens: number
  outputTokens: number
  status: 'completed' | 'failed'
  errorCode?: string
```

このサブコレクションを使うとユーザーごとの生成回数・コストを監視できる。  
ただし Firestore の read コストが増加するため、Phase 15 でのコスト制御実装時に判断する。

## 6. Firestore Rules で考慮すべきこと

### Phase 9 での変更

Cloud Functions は Admin SDK で `aiDiary` フィールドを更新するため、Rules 変更は不要。

### 将来的な考慮点

モバイル側から `aiDiary` を直接書き込むことを防ぐため、  
Phase 15 以降で以下のような Rules 追加を検討する：

```javascript
// 将来案（Phase 15 以降）
allow update: if request.auth != null
  && (resource.data.ownerId == request.auth.uid
      || request.auth.uid in resource.data.members)
  // AI 日記フィールドはモバイルから直接変更不可（Functions 経由のみ）
  && !('aiDiary' in request.resource.data.diff(resource.data).affectedKeys())
  && !('aiDiaryStatus' in request.resource.data.diff(resource.data).affectedKeys());
```

## 7. 既存データとの後方互換性

- 既存の Phase 5〜8 で作成されたノートは `aiDiary*` フィールドを持たない
- フィールドがない = `idle` 状態として扱う（UI 側で `?? 'idle'` にフォールバック）
- Phase 9 の実装後も、新規フィールドがないノートは「まだAI日記がありません」状態で正常表示
- 既存フィールド（`title`, `memo`, `photos`, `coverPhotoURL` 等）は一切変更しない

## 8. Firestore インデックス

Phase 9 では `aiDiaryStatus` でのコレクショングループクエリは行わない。  
インデックス追加は不要。

（将来的に「生成済みのノートを一覧表示」等の機能を追加する場合は、  
`firestore.indexes.json` への追加が必要になる。）
