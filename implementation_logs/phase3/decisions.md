# Phase 3 技術決定メモ

## 実施日
2026-06-11

---

## 決定事項

### 1. AuthContext の実装場所: `src/core/auth/AuthContext.tsx`

- **理由**: `src/core/` は Firebase 初期化・共通 Repository などアプリ横断の基盤ロジックを置く場所。Auth の購読管理もここに寄せるのが構造上自然
- **影響**: `useAuthSession` はそのまま残し、内部で `useAuth` に転送。既存の import は変更不要

### 2. `useAuthSession` を廃止せず転送ラッパーとして維持

- **理由**: Phase 0〜2 で作成した画面コンポーネントが `useAuthSession` を import しているため、一括変更を避けた
- **内容**: `useAuthSession` は `useAuth()` を返すだけのラッパーに変更
- **今後**: Phase 4 以降で徐々に `useAuth` に統一してもよい

### 3. SafeAreaProvider を `app/_layout.tsx` で1回だけ提供

- **理由**: Expo Router 6 は SafeAreaProvider を自動提供しないため、明示的に root layout に追加する必要がある
- **影響**: `Screen.tsx` や新規画面で `SafeAreaView` from `react-native-safe-area-context` が使用可能になった

### 4. Auth 画面 (login, sign-up, profile-setup) の SafeAreaView は変更しない

- **理由**: Phase 2 で実装済みの認証フローを壊さないため
- **今後**: Phase 14 (Settings/Privacy/Support) で画面デザイン整理時に対応予定

### 5. `(app)/_layout.tsx` の Stack で Screen を明示列挙しない

- **理由**: Expo Router がファイルシステムから自動検出する。明示列挙しなくても動作し、新規画面追加時にレイアウトを変更する必要がなくなる
- **変更**: `<Stack screenOptions={{ headerShown: false }} />` のみ

### 6. Create / Detail はそれぞれ `create/index.tsx` / `notes/[noteId].tsx` に配置

- **理由**: 仕様書 `03_expo_file_structure.md` の `app/(main)/create/` と `app/(main)/notes/[noteId]` に準拠
- **変更**: 既存のルートグループ名が `(main)` ではなく `(app)` であるため `(app)` 配下に配置

### 7. `.expo/types/router.d.ts` を手動更新

- **理由**: Expo Router の typed routes は `expo start` 起動時に自動生成されるが、今回は CI 環境で `tsc` を通すために手動で追加
- **影響**: 次回 `expo start` 実行時に自動で上書きされる。差分は失われない (内容は追加分のみ)
