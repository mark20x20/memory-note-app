# 実装反映ルール — Memory Note / 思い出ノート

## 1. 基本方針

Figma Make の出力は**本番コードとして直接使わない**。

Figma Make は UI のビジュアル方向性を確認するためのツールです。生成された画面を見て「このレイアウト・この配置が良い」と判断してから、**React Native + Expo + TypeScript で一から書き直す**ことが原則です。

---

## 2. 絶対に守るルール

### コード品質

- Figma Make が出力した CSS / HTML / Tailwind コードを TypeScript に変換してそのまま使わない
- `StyleSheet.create` を使い、インラインスタイルを多用しない
- 既存コンポーネント（`ScreenHeader`, `EmptyState`, `LoadingState` 等）を再利用する

### テーマ

- **`src/shared/theme/colors.ts` のトークンを必ず使う**
- 色をハードコードしない（例: `color: '#F26B5B'` → `color: colors.primary`）
- `typography.ts` / `spacing.ts` があればそちらを参照する

### アーキテクチャ

- UI 層から Firebase を直接呼ばない（Repository / Hook 経由）
- 既存の Expo Router ルート構成を壊さない
- 既存の `AuthContext` / `useAuth` / `useAuthSession` を壊さない
- `.env` / `firebase.ts` / `app.config.ts` を触らない

### パッケージ

- パッケージを勝手に追加しない
- 追加が必要な場合は Phase 計画と照らし合わせ、ユーザーに確認する

### スコープ

- 実装する画面は対象 Phase のスコープ内のみ
- 「ついでに」「近いから」という理由で他 Phase の画面を作らない
- 未実装の API / Firestore スキーマが確定していない場合は Placeholder のまま残す

---

## 3. Figma → 実装の変換手順

1. **Figma Make で生成** → `generated_ui/figma_make/phaseX_xxx/` に保存・採用判断
2. **採用されたレイアウトを把握** → どのコンポーネントが必要か洗い出す
3. **既存コンポーネントで代替できるか確認** → `src/shared/ui/` を探す
4. **新規コンポーネントが必要な場合** → `src/shared/ui/` に追加
5. **画面ファイルに実装** → `app/(app)/xxx.tsx`
6. **`colors.ts` トークンで色を指定** → ハードコード色がないか確認
7. **TypeScript / Lint チェック** → `npx tsc --noEmit` + `npx expo lint`

---

## 4. 実装時の確認項目

各画面を実装したら以下を確認してください。

| 確認項目 | 方法 |
|---|---|
| 色が `colors.ts` トークンを参照しているか | コードレビュー |
| 認証フローが壊れていないか | ログイン → ホーム の導線確認 |
| TypeScript エラーがないか | `npx tsc --noEmit` |
| Lint エラーがないか | `npx expo lint` |
| 既存ルートが壊れていないか | Expo Go で確認 |
| SafeAreaView が正しく使われているか | 実機 / シミュレータ確認 |

---

## 5. 禁止事項（再掲）

- Figma Make 出力を本番コードとして直接コピペする
- 色のハードコード（`'#F26B5B'` など直書き）
- Firebase をUI層から直接呼ぶ
- Expo Router のルート構成を変更せずに画面ファイルを追加する（ルートを先に `reference_map.md` で確定させる）
- `AuthContext` の内部実装を変更する（ラッパーを作るか相談する）
- `.env` / Firebase 設定ファイルを触る
- Phase スコープ外の機能を実装する
- パッケージのバージョンを変更する

---

## 6. フォルダ構造の原則

```
app/
├── (auth)/               # 認証前画面
└── (app)/                # 認証後画面
    ├── home.tsx
    ├── settings.tsx
    ├── create/
    │   ├── index.tsx       # 作成開始
    │   ├── upload.tsx      # アップロード進捗（Phase 6/7）
    │   ├── processing.tsx  # 処理中（Phase 6/7）
    │   ├── ai-preview.tsx  # 生成プレビュー（Phase 9）
    │   └── ai-edit.tsx     # 編集（Phase 9）
    ├── notes/
    │   └── [noteId]/
    │       ├── index.tsx   # ノート詳細
    │       ├── edit.tsx    # ノート編集（Phase 10）
    │       ├── photos.tsx  # 写真一覧（Phase 10）
    │       ├── map.tsx     # 地図（Phase 8）
    │       ├── members.tsx # メンバー管理（Phase 11）
    │       ├── invite.tsx  # 招待（Phase 11）
    │       └── share-card.tsx # 共有カード（Phase 12）
    ├── map.tsx             # グローバルマップ（Phase 8）
    ├── calendar.tsx        # カレンダー（Phase 13）
    └── search.tsx          # 検索（Phase 13）

src/
├── core/
│   ├── auth/             # AuthContext, Firebase Auth
│   └── repositories/     # Firestore CRUD（UI層から呼ばない）
├── features/
│   ├── auth/             # 認証関連 hooks
│   ├── memoryNotes/      # ノート関連 hooks / state
│   └── photos/           # 写真関連 hooks
└── shared/
    ├── theme/
    │   └── colors.ts     # 色トークン（必ず参照）
    └── ui/               # 共通コンポーネント
```
