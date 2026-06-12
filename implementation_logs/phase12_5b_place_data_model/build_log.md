# Phase 12.5B Place Data Model / Firestore Schema — Build Log

## 日時
2026-06-12

## ステータス
完了（Type definitions + Repository + Firestore Rules — アプリコード既存動作への影響なし）

---

## 作成ファイル一覧

| ファイル | 内容 |
|---|---|
| `src/core/repositories/placeGroupRepository.ts` | PlaceGroup / PlaceCandidate の Firestore Repository |
| `implementation_logs/phase12_5b_place_data_model/build_log.md` | 本ファイル |
| `implementation_logs/phase12_5b_place_data_model/decisions.md` | 設計上の決定事項 |
| `implementation_logs/phase12_5b_place_data_model/issues.md` | 既知の課題 |
| `implementation_logs/phase12_5b_place_data_model/next_steps.md` | 次のステップ |

---

## 更新ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/features/map/types/index.ts` | Phase 12.5 型定義を追加（PlaceEnrichmentStatus / PlaceCategory / PlaceGroupSource / PlaceCandidateProvider / PlaceCandidateSource / VisitedPlacesSummary / PlaceGroupDoc / PlaceCandidateDoc） |
| `src/core/repositories/noteRepository.ts` | NoteDoc に Phase 12.5 optional fields を追加（placeEnrichmentStatus / placeEnrichmentError / placeEnrichmentUpdatedAt / visitedPlacesSummary） |
| `firebase/firestore.rules` | place_groups / candidates のセキュリティルールを追加 |

---

## 削除ファイル一覧

なし

---

## TypeScript チェック

```
npx tsc --noEmit → Exit 0（エラーなし）
```

## Lint チェック

```
npx expo lint → Exit 0（警告・エラーなし）
```

## Firestore Rules dry-run

`--dry-run` オプションは firebase-tools に存在しないため未実施。
Rules の文法は手動レビューで確認。deploy は実施していない。

## Firebase deploy

実施していない（Phase 12.5B の受け入れ条件通り）

---

## コード変更サマリー

### 追加型（src/features/map/types/index.ts）

- `PlaceEnrichmentStatus`
- `PlaceCategory`
- `PlaceGroupSource`
- `PlaceCandidateProvider`
- `PlaceCandidateSource`
- `VisitedPlacesSummary`
- `PlaceGroupDoc`（Firestore 保存用。既存 `PlaceGroup` とは別）
- `PlaceCandidateDoc`

### 追加 Repository 関数（src/core/repositories/placeGroupRepository.ts）

- `subscribePlaceGroupsByNoteId` — リアルタイム監視
- `getPlaceGroupById` — 1件取得
- `getPlaceCandidatesByGroupId` — 候補一覧取得
- `createPlaceGroup` — 新規作成
- `updatePlaceGroup` — 部分更新
- `deletePlaceGroup` — 1件削除
- `deletePlaceGroupsForNote` — ノートに紐づく全件削除

### Firestore Rules 追加

```
memory_notes/{noteId}/place_groups/{placeGroupId}
  → owner/editor: read / create / update
  → viewer: read のみ
  → owner のみ: delete

memory_notes/{noteId}/place_groups/{placeGroupId}/candidates/{candidateId}
  → owner/editor: read / create / update
  → viewer: read 不可（プライバシーポリシー準拠）
  → owner のみ: delete
```

### Package 変更

なし（package.json / package-lock.json 変更なし）
