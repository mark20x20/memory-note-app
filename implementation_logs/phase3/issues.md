# Phase 3 Issues

## 実施日
2026-06-11

---

## 発生した問題と対応

### ISSUE-3-001: `router.d.ts` に新ルートが未定義でTypeScriptエラー

**内容**
`app/(app)/create/index.tsx` と `app/(app)/notes/[noteId].tsx` を作成後、`tsc --noEmit` で以下のエラーが発生した。

```
app/(app)/home.tsx(26,40): error TS2345: Argument of type '"/(app)/create"' is not assignable to parameter of type ...
```

**原因**
`.expo/types/router.d.ts` は `expo start` 実行時に自動生成されるが、新規ファイル作成後は未更新のまま

**対応**
`.expo/types/router.d.ts` に `/(app)/create` と `/(app)/notes/[noteId]` の型定義を手動追加

**今後**
次回 `expo start` 時に自動再生成される。実運用ではビルド前に `expo start` を一度実行してから `tsc` を通す

---

### ISSUE-3-002: `Card.tsx` で `ViewStyle` を `react` からインポートしてTypeScriptエラー

**内容**
```
src/shared/components/ui/Card.tsx(2,15): error TS2305: Module '"react"' has no exported member 'ViewStyle'.
```

**原因**
`ViewStyle` は React Native の型で `react-native` からインポートする必要がある

**対応**
`import type { ViewStyle } from 'react-native'` に修正

---

### ISSUE-3-003: Node.js が Bash tool の PATH に含まれていない

**内容**
Bash tool (Git Bash) では `node`, `npx` コマンドが見つからない

**原因**
Node.js が `C:/Program Files/nodejs` にインストールされているが、Git Bash の PATH に含まれていない

**対応**
`export PATH="/c/Program Files/nodejs:$PATH"` を各コマンドの前に追加して解決

**今後**
TypeScript 確認・lint はこの方法で実行可能。`expo start` は PowerShell から実行すること

---

## 既知の残存問題

### WARN-3-001: 認証画面の SafeAreaView が未更新

`app/(auth)/login.tsx`, `sign-up.tsx`, `profile-setup.tsx` は `react-native` の `SafeAreaView` を使用中。
Phase 14 での設定・UI整理時に対応予定。

### WARN-3-002: `.expo/types/router.d.ts` の手動編集

このファイルは `expo start` で自動上書きされる。
上書き後も型エラーがなければ問題なし（Expo が正しく検出するため）。
