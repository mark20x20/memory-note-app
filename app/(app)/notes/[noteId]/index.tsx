// UI-7: index.tsx → preview.tsx redirect
//
// 主表示は preview.tsx に移行。
// home.tsx / create/index.tsx などの /(app)/notes/${noteId} は自動的に preview に誘導される。
// 管理導線（地図 / 共有カード / メンバー）は preview.tsx の action section に移植済み。
// AI日記再生成は edit.tsx の AI日記タブで対応 (index.tsx では AiDiarySection を使っていたが
//   edit フロー経由に統一)。
//
// 元の index.tsx の全機能は以下に分散:
//   - 主コンテンツ閲覧    → preview.tsx
//   - 編集                → edit.tsx
//   - 地図                → map.tsx
//   - 共有カード作成       → share.tsx
//   - メンバー管理         → members.tsx

import { Redirect, useLocalSearchParams } from 'expo-router';

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();

  if (!noteId) return null;

  return <Redirect href={`/(app)/notes/${noteId}/preview` as any} />;
}
