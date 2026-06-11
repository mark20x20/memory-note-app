# Phase 7: 設計決定事項

## 1. Storage パス設計

**決定**: `users/{uid}/memory_notes/{noteId}/photos/{timestamp}_{sortOrder}.{ext}`

**理由**:
- `uid` プレフィックスにより Storage Rules でオーナー検証が単純化（`request.auth.uid == uid`）
- `timestamp_sortOrder` により、ファイル名衝突を回避しつつ並列アップロード時の順序情報を保持
- 拡張子は MIME タイプから動的に決定（`image/jpeg` → `.jpg`, `image/png` → `.png` など）

---

## 2. coverPhotoURL の保存先（A案採用）

**決定**: `memory_notes/{noteId}` ドキュメントに `coverPhotoURL` と `photoCount` フィールドとして保存

**却下案（B案）**: Home 画面表示時に `memory_notes/{noteId}/photos` サブコレクションを毎回クエリする

**理由**:
- ノート一覧（Home 画面）では N 件のノートに対してサブコレクション読み取りが発生（N+1 問題）
- A案では Home 画面は `memory_notes` コレクション1クエリのみで完結
- 非正規化による整合性リスクは許容範囲（写真削除時の更新は Phase 10 で対応予定）

---

## 3. アップロード失敗時の UX

**決定**: ノート作成は成功・写真アップロード失敗の場合、エラー表示 + "ノートを確認する" ボタンを表示してナビゲーションを許可

**理由**:
- ノードは Firestore に既に保存済みのため、再作成ではなく再アップロードへ誘導すべき
- アップロード失敗で画面をブロックするよりも、ユーザーがノートを確認して後から写真追加できる方が UX として優れる
- 写真なしノートは仕様上有効なため、ノート自体は正常に利用可能

---

## 4. 画像圧縮（Phase 7 では見送り）

**決定**: Phase 7 では画像圧縮を行わず、`expo-image-picker` から取得した URI をそのままアップロード

**理由**:
- `expo-image-manipulator` の追加インストールが必要
- Phase 7 の主目的はアップロードパイプラインの確立であり、容量最適化は別フェーズで対応
- Storage Rules で 10MB 上限を設定済みのため、極端に大きいファイルは弾かれる

**TODO**: Phase 10 以降で `expo-image-manipulator` による圧縮・リサイズを導入予定

---

## 5. Storage/Firestore のメンバーアクセス（Phase 11 以降に延期）

**決定**: Phase 7 では Storage read を owner のみに制限。Firestore photos サブコレクションの read は owner + members を対象とするが、Storage は owner のみ。

**理由**:
- Storage Rules での members 検証には Firestore `get()` が必要となり、ルールの複雑性が増す
- Phase 7 では共有ノート機能（Phase 11）が未実装のため、members アクセスは不要
- Phase 11 で Storage Rules を拡張予定
