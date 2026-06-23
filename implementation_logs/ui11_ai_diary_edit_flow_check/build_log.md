# UI-11 Build Log: AI Diary Edit Flow Check / Memo Tab Polish

## 実施日: 2026-06-23

## 既存実装の確認結果

### MemoPanel.tsx (変更前)

Props:
- `draft`, `updateField`, `hasAiDiary: boolean`, `isBusy`

問題点:
- `hasAiDiary` boolean のみ → `generating` / `failed` 状態を区別できない
- `hasAiDiary === false` の場合「ノート詳細画面から生成できます」を表示
  → index.tsx が preview.tsx にリダイレクトするため、参照先が存在しない
- `useGenerateDiary` フックが存在するのに未使用

### edit.tsx (変更前)

- `hasAiDiary` 計算のみ (completed/edited のみ)
- `useGenerateDiary` 未インポート
- `canGenerateAiDiary` 未インポート

### useGenerateDiary.ts (既存)

```ts
export function useGenerateDiary(): UseGenerateDiaryResult {
  generate: (noteId: string) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}
```
→ `aiDiaryRepository.generateDiary(noteId)` を呼ぶ。
→ 生成ステータスは Firestore 経由で useNoteDetail に反映される (aiDiaryStatus)。

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/features/memoryNotes/components/edit/panels/MemoPanel.tsx` | aiDiaryStatus ベースの UI に全面切り替え |
| `app/(app)/notes/[noteId]/edit.tsx` | useGenerateDiary / canGenerateAiDiary を接続 |

---

## 変更内容

### MemoPanel.tsx

**Props 変更:**
```ts
// 変更前
hasAiDiary: boolean;

// 変更後
aiDiaryStatus: string | null | undefined;
onGenerateDiary?: () => void;
isGeneratingDiary?: boolean;
generateDiaryError?: string | null;
canGenerate?: boolean;
```

**Section 2 AI日記 — 4状態:**
| aiDiaryStatus | 表示 |
|---|---|
| `'completed'` / `'edited'` | 編集可能な TextInput + status badge (生成済み/編集済み) |
| `'generating'` または `isGeneratingDiary` | ActivityIndicator + "AI日記を生成中..." |
| `'failed'` | エラーカード + 再生成ボタン (canGenerate の場合) |
| `'idle'` / null / undefined | 未生成カード + 生成ボタン (canGenerate の場合) |

### edit.tsx

```ts
// 追加インポート
import { canGenerateAiDiary } from '@/features/memoryNotes/utils/permissions';
import { useGenerateDiary } from '@/features/memoryNotes/hooks/useGenerateDiary';

// フック追加
const { generate: generateDiary, isGenerating: isGeneratingDiary, error: generateDiaryError } = useGenerateDiary();

// 権限チェック追加
const userCanGenerateAiDiary = uid && note ? canGenerateAiDiary(note, uid) : false;

// hasAiDiary 計算を削除 → MemoPanel 側で aiDiaryStatus から判定
```

**MemoPanel 呼び出し変更:**
```tsx
<MemoPanel
  draft={draft}
  updateField={updateField}
  aiDiaryStatus={note.aiDiaryStatus ?? null}
  isBusy={isBusy}
  canGenerate={!!userCanGenerateAiDiary}
  onGenerateDiary={noteId ? () => generateDiary(noteId) : undefined}
  isGeneratingDiary={isGeneratingDiary}
  generateDiaryError={generateDiaryError}
/>
```

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- Functions build: 不要
