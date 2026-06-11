# Phase 5 設計決定ログ

## D1: MemoryNote のスキーマフィールド名

**決定**: `ownerId`（`ownerUserId` ではなく）を使用する

**理由**:
- `src/types/index.ts` の既存 `MemoryNote` 型が `ownerId` を使用していた
- Phase 5 の要件定義でも `ownerId` を指定されていた
- Firestore Security Rules の create 条件 `request.resource.data.ownerId == request.auth.uid` もこれに合わせた

**注意**: 仕様書 `01_data_model.md` は `ownerUserId` を使っているため、Phase 9〜10 の本格実装時に整合を確認すること。

---

## D2: NoteDoc 型は noteRepository.ts に定義する

**決定**: Phase 5 用の `NoteDoc` 型を `src/core/repositories/noteRepository.ts` に定義し、既存の `src/types/index.ts` の `MemoryNote` は変更しない

**理由**:
- 既存の `MemoryNote` 型（Phase 0 定義）はフィールド構成が異なる（`description`, `photoCount` 等）
- Phase 5 の最小スキーマ（`memo`, `noteType`, `members`）を追加するために既存型を書き換えると他への影響が大きい
- `noteRepository.ts` が `NoteDoc` を export し、hook・画面がそれを import する形が整合的

---

## D3: useMemoryNotesList.ts は onSnapshot でリアルタイム購読

**決定**: `getDocs` ではなく `onSnapshot` を使用する

**理由**:
- Create → Home 遷移時にノートが即時反映される（UX 向上）
- `onSnapshot` はリスナーを返すため、`useEffect` の cleanup でアンサブスクライブできる
- Phase 5 の個人ノートは件数が少ないため、リアルタイム更新によるコスト増は無視できる

---

## D4: Home 画面のクエリは orderBy なしでクライアントソート

**決定**: `query(ref, where('ownerId', '==', uid))` + クライアント側で `createdAt.seconds` 降順ソート

**理由**:
- `where('ownerId', '==', uid)` + `orderBy('createdAt', 'desc')` の複合クエリは Firestore の複合インデックスが必要
- Phase 5 開発段階では Firebase Console でインデックスを作成していないため、クエリエラーになる可能性がある
- ノート件数が少ない Phase 5 ではクライアントソートのコストは問題ない
- Phase 11 以降でノート数が増えた段階で Firestore インデックスを追加・orderBy を使う形に移行可能

---

## D5: 写真ボタンは disabled のまま維持

**決定**: Create 画面の「写真を選ぶ」ボタンは `disabled` のまま残す

**理由**:
- Phase 5 スコープ外（`expo-image-picker` は Phase 6）
- Phase 6 実装時のプレースホルダーとして UI に残すことで、画面の完成形をユーザーが確認できる

---

## D6: notes/[noteId].tsx のルート移行は Phase 8 まで行わない

**決定**: 現在の `app/(app)/notes/[noteId].tsx` を `notes/[noteId]/index.tsx` に移行しない

**理由**:
- Phase 4.5 の Decision D5 を踏襲
- Phase 8 で `notes/[noteId]/map.tsx` サブルートを追加する際に移行する
- 現時点での移行はスコープ外かつリスクあり
