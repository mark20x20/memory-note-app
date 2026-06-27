# UI-25 Integration QA — QA結果・判断メモ

## 1. Auth / Onboarding ✓

| 確認項目 | 結果 |
|---|---|
| 未ログイン時に onboarding へ行くか | ✓ `app/index.tsx` が `status !== 'signedIn'` → `/(auth)/onboarding` |
| onboarding CTA → login | ✓ "はじめる" / "あとで見る" どちらも `router.replace('/(auth)/login')` |
| login 後に home へ | ✓ `authRepository.signIn` 成功後 `(auth)/_layout.tsx` が `signedIn → /(app)/home` redirect |
| ログアウト後 onboarding へ | ✓ `settings.tsx` の `authRepository.logout()` 後 `router.replace('/(auth)/onboarding')` |

補足:
- `useAuthSession` は `useAuth` の thin wrapper (同一 Firebase Auth subscription) → スプリットブレインなし ✓
- `(auth)/_layout.tsx` と `app/index.tsx` で異なる import path だが同一 context を参照 ✓

## 2. Home ✓

| 確認項目 | 結果 |
|---|---|
| ノート一覧表示 | ✓ `useMemoryNotesList()` |
| empty state | ✓ 写真・フィーチャーヒント付き |
| note card tap | ✓ `router.push('/(app)/notes/${note.id}')` → index.tsx → preview redirect |
| create CTA/FAB | ✓ `router.push('/(app)/create')` |
| settings | ✓ `router.push('/(app)/settings')` |

## 3. Create ✓

| 確認項目 | 結果 |
|---|---|
| 写真選択 | ✓ `usePhotoPicker` |
| アップロード progress | ✓ `usePhotoUpload` で `uploadProgress` state |
| 作成後 navigate | ✓ `router.replace('/(app)/notes/${noteId}')` → index.tsx → preview |

## 4. Preview ✓（修正1件適用）

| 確認項目 | 結果 |
|---|---|
| UI-16B sharing Alert テキスト | ⚠️ 旧テキストが残存 → **修正適用** (UI-22 は OverviewPanel のみ更新し preview.tsx を漏らした) |
| AI再生成ボタン非表示 | ✓ preview.tsx に generateDiary 系コードなし |
| photo strip → viewer | ✓ `viewer?initialIndex=${idx}` |
| Quick Actions 全導線 | ✓ edit / map / share / members / メンバーと共有する |
| viewer can edit guard | ✓ `canEdit` チェック済み |

## 5. Edit ✓

| 確認項目 | 結果 |
|---|---|
| 5タブ切り替え | ✓ EditTabBar + activeTab state |
| StickyBottomBar | ✓ 保存/キャンセル両方動作 |
| isDirty guard | ✓ `useNoteEditDraft` の `isDirty` |
| UI-16B sharing UX | ✓ OverviewPanel の Alert テキスト更新済み |
| viewer 編集不可 | ✓ `userCanEdit` false 時に "🔒 編集権限がありません" 表示 |

## 6. Members / Sharing ✓

| 条件 | 表示 | 動作 |
|---|---|---|
| personal + isOwner | "メンバーと共有する" | Alert → members.tsx |
| personal + not owner | 非表示 | — |
| shared | "メンバー" | members.tsx |
| members.tsx: owner | 招待/権限変更/削除 | `useManageNoteMembers` |
| members.tsx: non-owner | 閲覧 + 退出 | `leaveNote` |

UI-16B 仕様通りに実装されていることを確認 ✓

## 7. Full Photo Viewer ✓

| 確認項目 | 結果 |
|---|---|
| initialIndex 渡し | ✓ preview strip から正確なインデックスを渡す |
| placeGroupId フィルタ | ✓ `viewer?placeGroupId=${id}` で flows/places から開ける |
| dark UI | ✓ `#0F0E0D` 背景 |
| back/close | ✓ `router.back()` |

## 8. Map ✓

| 確認項目 | 結果 |
|---|---|
| map 表示 | ✓ `react-native-maps` MapView |
| route modes | ✓ walking/driving/transit/mixed chips |
| premium lock | ✓ Firestore quota check |
| permission gate | ✓ `canEdit` で route generation を gate |

## 9. Calendar ✓

| 確認項目 | 結果 |
|---|---|
| /(app)/calendar 開ける | ✓ ファイル存在 |
| 月移動 | ✓ handlePrevMonth / handleNextMonth |
| 今日ボタン | ✓ handleToday |
| ノートある日 dot | ✓ notesByDate.get(dateKey) で判定 |
| note card tap | ✓ `router.push('/(app)/notes/${note.id}/preview')` |
| create CTA | ✓ `router.push('/(app)/create')` |

既知制約: 日付groupingに `createdAt` を使用（`memoryDate` フィールドなし）

## 10. Settings ✓

| 確認項目 | 結果 |
|---|---|
| Profile Card | ✓ photoURL / initials / 📔 fallback |
| 準備中リンク | ✓ comingSoon prop で disabled |
| logout alert | ✓ "ログアウトしますか？" / "この端末からアカウントをログアウトします。" |
| logout 後 routing | ✓ router.replace('/(auth)/onboarding') |

## 11. Flow / Place Detail ✓

| 確認項目 | 結果 |
|---|---|
| Flow Detail 開ける | ✓ `flows/[placeGroupId].tsx` 存在 |
| related photos | ✓ `useNotePhotos` + placeGroupId フィルタ |
| eventMemo 編集 | ✓ `canEdit` gate + `updatePlaceGroupManuallyCallable` |
| Place Detail 開ける | ✓ `places/[placeGroupId].tsx` 存在 |
| candidate list | ✓ `selectPlaceCandidateCallable` |
| 手動修正 | ✓ `places/manual.tsx` 存在 |

## 権限確認 ✓

```
owner:  edit ✓ / delete ✓ / members管理 ✓ / convertToPersonal ✓
editor: edit ✓ / delete ✗ / members管理 ✗ / leave ✓
viewer: preview ✓ / edit ✗ / members閲覧 ✓ / leave ✓
```

`permissions.ts` は純粋関数。`canEdit` / `canManageMembers` / `canDelete` / `canGenerateAiDiary` すべて正しく実装 ✓

## 修正適用内容

### preview.tsx — UI-16B Alert テキスト修正

**旧**: "このノートを共有しますか？" / "共有ノートに変更すると、メンバーを招待できるようになります。" / "共有して招待する"
**新**: "メンバーを招待しますか？" / "メンバーを招待すると、このノートが共有ノートになります。" / "招待へ進む"

理由: UI-22 では OverviewPanel.tsx のみ修正し、preview.tsx の同名 Alert を見落としていた。
Edit 画面 / Preview 画面で文言が不一致だったため修正。
