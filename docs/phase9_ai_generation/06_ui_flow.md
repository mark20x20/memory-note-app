# Phase 9: UI Flow — Detail 画面 AI 日記セクション

## 1. 現状（Phase 8 終了時点）

`app/(app)/notes/[noteId].tsx` の AI 日記セクションはプレースホルダー：

```tsx
{/* ── AI日記プレースホルダー ── */}
<View style={styles.section}>
  <Text style={styles.sectionLabel}>AI日記</Text>
  <View style={styles.diaryCard}>
    <Text style={styles.diaryPlaceholder}>
      AIが生成した短文日記がここに表示されます。{'\n'}
      写真・場所・日付から自動で作られます。
    </Text>
  </View>
  <Text style={styles.placeholderCaption}>AI日記は Phase 9 以降で実装予定</Text>
</View>
```

Phase 9 ではこのセクションを実際の状態管理に基づく UI に置き換える。

## 2. AI 日記セクションの4状態

### 状態 A: idle（未生成）

`aiDiaryStatus` が `undefined` / `null` / `'idle'` のとき。

```
┌─────────────────────────────────────┐
│  AI日記                              │
│ ┌─────────────────────────────────┐ │
│ │ AIが写真・場所・日付から        │ │
│ │ 短い思い出日記を生成します。    │ │
│ │                                 │ │
│ │  [✨ AI日記を生成する]          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- 生成ボタンをタップ → `generateMemoryDiary` を呼び出す
- 写真が0枚のノートでは生成ボタンを表示するが、生成内容はタイトル・メモのみを使う

### 状態 B: generating（生成中）

`aiDiaryStatus === 'generating'` のとき。  
Firestore の `onSnapshot` でリアルタイムに状態を監視するため、  
別端末で開始した生成もリアルタイムに反映される。

```
┌─────────────────────────────────────┐
│  AI日記                              │
│ ┌─────────────────────────────────┐ │
│ │  ✨ AI日記を生成中...           │ │
│ │  [ActivityIndicator]            │ │
│ └─────────────────────────────────┘ │
│  ※ 生成中はボタンを表示しない      │
└─────────────────────────────────────┘
```

- ボタンを非表示または無効化する（重複呼び出し防止）
- Functions 側でも `generating` 中の重複呼び出しを拒否する

### 状態 C: completed（生成成功）

`aiDiaryStatus === 'completed'` かつ `aiDiary` が文字列のとき。

```
┌─────────────────────────────────────┐
│  AI日記                              │
│ ┌─────────────────────────────────┐ │
│ │ 2日間の箱根旅行。18枚の写真に  │ │
│ │ 残った思い出。3ヶ所を巡り…     │ │
│ └─────────────────────────────────┘ │
│  生成日: 2026-05-10   [再生成]      │
└─────────────────────────────────────┘
```

- 生成された日記テキストを表示する
- 生成日時（`aiDiaryGeneratedAt`）を小さく表示する
- 「再生成」ボタンを表示し、再度 `generateMemoryDiary` を呼び出せる
- テキストの編集は Phase 10 以降（Note Detail / Edit）で対応

### 状態 D: failed（生成失敗）

`aiDiaryStatus === 'failed'` のとき。

```
┌─────────────────────────────────────┐
│  AI日記                              │
│ ┌─────────────────────────────────┐ │
│ │  ⚠️ AI日記の生成に失敗しました  │ │
│ │  [再試行]                       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- エラー内容は詳細を出さず、ユーザー向けの簡潔なメッセージのみ
- 「再試行」ボタンで再度 `generateMemoryDiary` を呼び出す

## 3. 状態管理の実装方針

### Firestore onSnapshot によるリアルタイム監視

`useNoteDetail` Hook（新規作成）または既存の `getNoteById` を `onSnapshot` に変更し、  
`aiDiaryStatus` フィールドの変化をリアルタイムで受け取る。

```typescript
// 新規 Hook 案: useNoteDetail
// memory_notes/{noteId} を onSnapshot で購読し、NoteDoc を返す
function useNoteDetail(noteId: string | null): {
  note: NoteDoc | null;
  isLoading: boolean;
  error: Error | null;
}
```

### generateMemoryDiary の呼び出し Hook

```typescript
// 新規 Hook 案: useGenerateDiary
function useGenerateDiary(): {
  generate: (noteId: string) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}
```

内部で `httpsCallable(functions, 'generateMemoryDiary')` を呼び出す。

## 4. 生成失敗時も他のセクションを壊さない方針

AI 日記の生成失敗は `aiDiaryStatus: 'failed'` を Firestore に書き込むのみ。  
以下のフィールドは一切変更しない：

- `title`
- `memo`
- `coverPhotoURL`
- `photoCount`
- `members`

モバイル側では AI 日記セクションのみエラー表示し、  
カバー写真・写真グリッド・地図セクション・メモは通常通り表示する。

**try-catch の粒度**

```typescript
// Detail 画面の AI 日記セクションのみを try-catch で囲む
try {
  await generate(noteId);
} catch (e) {
  // AI 日記セクションのみエラーUIを表示
  // 画面全体をエラーにしない
}
```

## 5. UI コンポーネント構成案

```
app/(app)/notes/[noteId].tsx
  ├── ...（既存セクション: カバー写真, メタ情報, メモ, 写真グリッド, 地図）
  └── AiDiarySection（新規コンポーネント）
        Props: { noteId: string, note: NoteDoc }
        ├── idle → IdleState（生成ボタン）
        ├── generating → GeneratingState（ローダー）
        ├── completed → CompletedState（日記テキスト + 再生成ボタン）
        └── failed → FailedState（エラーメッセージ + 再試行ボタン）
```

コンポーネントを分離することで Detail 画面本体への影響を最小化する。

## 6. Phase 10 以降の編集 UI への引き継ぎ

Phase 9 では AI 日記の表示のみ。編集は不可。

Phase 10（Note Detail / Edit / Delete）で：
- `aiDiary` テキストをタップして編集できるようにする
- 編集後は `aiDiaryStatus` を `'edited'`（新ステータス）に変更するか、`aiDiary` をそのまま更新する
- 編集専用画面の設計は Phase 10 で行う

Phase 9 の実装では、編集への拡張を想定してコンポーネント境界を明確にしておく。
