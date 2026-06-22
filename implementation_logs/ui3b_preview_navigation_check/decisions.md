# UI-3B Design Decisions

## 1. EventMapPreview の photosLoading ゲートを削除

**決定:** preview.tsx の map セクションで `photosLoading` 待機を除去し、常に `EventMapPreview` を表示する。

**理由:**
`EventMapPreview` は `useEffect` 内で `placeGroupRepository.subscribePlaceGroupsByNoteId` を独立購読する。
`photoLocations` は PlaceGroup データがない場合のフォールバック専用。
PlaceGroup の購読には写真のロード完了を必要としないため、`photosLoading` ゲートは不要かつ
地図表示の遅延を引き起こしていた。

## 2. 重複 "地図を見る" リンクの削除

**決定:** preview.tsx の `mapLink` TouchableOpacity を削除。`EventMapPreview` の `mapFooter` にある "地図で見る" のみを残す。

**理由:**
`EventMapPreview` コンポーネントは内部に "地図で見る" リンク (`mapFooter`) を持つ。
preview.tsx がさらに "地図を見る →" を追加しており、同じルート `/(app)/notes/${noteId}/map` への
重複リンクが2つ並んでいた。コンポーネント側の既存リンクで十分。

**補足:** `EventMapPreview` は `index.tsx` でも使われており、コンポーネント内の "地図で見る" は
両画面で動作している。

## 3. aiDiary セクションをプレビュー画面に追加

**決定:** `note.aiDiaryStatus === 'completed' || 'edited'` かつ `note.aiDiary` が存在する場合のみ、
メモセクションの後に "AI日記" セクションを表示。

**理由:**
仕様の "memo / aiDiary" 要件に対応。AI日記はユーザーが確認・編集したものが完成形であるため、
`completed` または `edited` ステータスの場合にのみ表示する。
`processing` / `failed` / `pending` 状態では表示しない（emotional reading surface として不完全な内容を出さない）。

**スタイル:** 既存の `memoCard` / `memoText` スタイルを流用。専用スタイルは追加しない（見た目の一貫性）。

## 4. index.tsx と preview.tsx は今回統合しない

**決定:** UI-7 で判断するため、今回は両画面を並存させる。

**理由:** 仕様に明示されている通り。役割の重複については `next_steps.md` に整理。

## 5. VisitTimelineSection / EventMapPreview の props は変更しない

**決定:** 両コンポーネントは現状の props 設計で正しく動作しているため変更なし。

- `VisitTimelineSection`: `canEdit={false}` (preview), `enrichmentStatus={note.placeEnrichmentStatus}` で正しい
- `EventMapPreview`: `noteId`, `photoLocations`, `height` で正しい
- どちらも内部で独立購読しており、props によるデータ注入は不要
