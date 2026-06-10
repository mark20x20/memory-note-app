# Phase 3 → Phase 4 引き継ぎ事項

## Phase 3 完了状態

- AuthProvider / useAuth による認証状態の単一購読確立
- SafeAreaProvider をルートレイアウトに追加
- Home / Create / Detail / Settings への遷移導線完成
- Home の空状態 UI (EmptyState コンポーネント使用)
- Create placeholder 画面 (`app/(app)/create/index.tsx`)
- Note Detail placeholder 画面 (`app/(app)/notes/[noteId].tsx`)
- Settings 画面に表示名・メール・プラン表示 + ログアウト
- 共通 UI: LoadingState / EmptyState / ErrorState / ScreenHeader / Card
- TypeScript: pass / Lint: pass

---

## Phase 4 でやること (Memory Note Creation)

### 必須
1. ノート作成フローの状態管理
   - `src/features/memoryNotes/` に Create flow の state/hooks を追加
   - タイトル入力、メモ入力、保存ボタン

2. 作成フローの画面骨格
   - `app/(app)/create/index.tsx` を実装 (写真選択は Phase 5 以降)
   - 個人/共有ノート種別の選択 UI (Phase 5 以降で詳細実装)

3. ノートの Firestore 保存
   - `memory_notes` コレクション設計に基づいた保存処理
   - `src/core/repositories/noteRepository.ts` の実装

### 推奨
- `src/features/memoryNotes/hooks/useCreateNote.ts` フック作成
- フォームバリデーション (zod + react-hook-form)
- 保存完了後にノート詳細へ遷移

---

## Phase 5 以降でやること

- 写真ピッカー (expo-image-picker)
- EXIF 取得
- Firebase Storage アップロード
- AI生成 (Cloud Functions 経由)

---

## Phase 3 での未対応事項

| 項目 | 状態 |
|---|---|
| ノートの Firestore 保存 | 未実装 (Phase 4 で実装) |
| 写真選択 | 未実装 (Phase 5 で実装) |
| Storage アップロード | 未実装 (Phase 6 で実装) |
| AI生成 | 未実装 (Phase 9 で実装) |
| Google Sign-In | 未実装 (Phase 2 で保留) |
| Apple Sign-In | 未実装 (Phase 2 で保留) |
| auth 画面の SafeAreaView 更新 | Phase 14 で対応 |

---

## 注意事項

- `useAuthSession` は後方互換のため残存。Phase 4 以降は `useAuth` を直接使うことを推奨
- `memory_notes` コレクションの Firestore Security Rules は Phase 4 開始前に確認・更新すること
- `.expo/types/router.d.ts` は `expo start` 起動後に自動再生成される
