# UI-7 Issues

## 解決済み

### 1. index.tsx にあって preview.tsx にない機能の洗い出し

以下の差分を確認し、それぞれの対応方針を決定:

| 機能 | index.tsx | preview.tsx (UI-7後) | 方針 |
|---|---|---|---|
| カバー写真 | 220h | 360h hero + strip | preview の方が上位互換 |
| タイムライン | canEdit=true | canEdit=false | preview は閲覧のみで適切 |
| AI日記 (読む) | AiDiarySection | memoCard (text only) | preview で読める |
| AI日記再生成 | AiDiarySection | なし | edit.tsx に委譲 |
| 写真グリッド | 全件表示 | hero + strip (5枚) | viewer へのアクセスは同等 |
| メンバーセクション | count + 管理ボタン | action link (→ members.tsx) | members.tsx で完結 |
| 共有カードボタン | あり | action link (→ share.tsx) | share.tsx で完結 |
| 地図 | EventMapPreview inline | action link (→ map.tsx) | map.tsx で完結 |
| noteType / role chip | あり | なし | 閲覧UX に不要 |
| noteIdHint (デバッグ) | あり | なし | 不要 |

---

## 未解決（将来対応）

### 1. AI日記再生成の導線

AI日記再生成ボタンは index.tsx から preview.tsx に移植しなかった。
現在 edit.tsx の AI日記タブ経由でのみアクセス可能。

→ UI-8 または独立フェーズで、preview.tsx の AI日記セクションに再生成ボタンを追加することを検討。
  条件: `canGenerateAiDiary(note, uid)` が true の場合のみ表示。

### 2. index.tsx の写真グリッド (全件) が preview では hero+strip (5件) に変わる

index.tsx では全写真がグリッド表示されていたが、preview.tsx では hero + strip 4枚 + 「+N」のみ。
全写真は `photos/viewer` 画面から確認できるが、一覧性は下がる。

→ ユーザーが「写真をすべて見たい」場合は viewer から確認する導線がある (thumbnailMore の +N タップ)。
  現時点では許容範囲。将来的に photos タブを追加する場合はここに集約。

### 3. create 完了後の遷移先

`create/index.tsx` → `/(app)/notes/${noteId}` → (index redirect) → `preview.tsx`

redirect が挟まるため、戻るボタンの挙動が「preview → index(redirect) → create」になる可能性。
Expo Router の `router.replace` を create が使っているため、実際は history に index が残らない。
→ 要実機確認。問題が出る場合は create 側を `/(app)/notes/${noteId}/preview` に直接変更する。
