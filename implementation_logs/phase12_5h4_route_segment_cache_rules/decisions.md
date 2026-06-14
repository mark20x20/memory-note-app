# Phase 12.5H-4 Decisions

## route_segments を note subcollection にする理由

`memory_notes/{noteId}/route_segments/{segmentId}` という設計を採用した理由:

1. **ノート削除連動**: Firestore では親ドキュメントを削除してもサブコレクションは残るが、
   Cloud Functions 側でノート削除時に route_segments も削除する実装を一箇所に集約できる。
2. **権限スコープ**: Security Rules でノート単位の権限チェックがしやすい。
   `$(noteId)` を使って親ノートの members フィールドを参照できる。
3. **クエリ範囲の限定**: 各ノートの route_segments だけを取得するため、
   他ノートのデータとの混在がなくクエリシンプル。
4. **既存設計との整合**: `place_groups` も同じ depth に置かれており、
   コレクション構造の一貫性を保てる。

## client write を禁止する理由

```js
allow write: if false;
```

理由:
1. **API コスト保護**: クライアントが直接 route_segments を書き込めると、
   Premium チェックや生成回数制限を迂回して無制限にデータを書き込める。
2. **データ整合性**: encodedPolyline / decodedPolyline などのフィールドは
   Cloud Functions 側で Google Routes API から取得・検証したものだけが正しい。
   クライアントから任意データを書き込ませると整合性が壊れる。
3. **セキュリティ**: API キーが漏洩しても、クライアントからは
   route_segments を書き込めないため被害を限定できる。

## viewer に cache read を許可する理由

共有ノートにおいて viewer がルートキャッシュを閲覧できるのは自然な動作:
- owner/editor が生成したルートは「ノートのコンテンツ」の一部
- viewer は地図画面でルート（Polyline）を閲覧することが目的
- ただし **ルート生成（API コスト発生）は許可しない** — Functions 側で owner/editor チェック

`place_groups` も viewer に read を許可している（`candidates` サブコレクションは非表示）という
既存の設計方針と整合している。

## deleteNoteRouteCache を owner/editor のみにする理由

- ルートキャッシュを削除すると次回ルート表示時に再生成コストが発生する
- viewer がキャッシュを削除できると、owner/editor が生成したルートが無効化される
- 削除操作はデータを変更する操作なので、編集権限（owner/editor）に限定する

## getNoteRouteSegments を API（callable）経由で取得する理由

クライアントから Firestore を直接読み取る方法もあるが、callable 経由にする理由:
1. **将来の Premium フィルタ**: 将来的に「free ユーザーには decodedPolyline を返さない」
   などのアクセス制御を Functions 側で追加できる
2. **データ変換**: Firestore の Timestamp をクライアントで扱いやすい形式に変換できる
3. **一貫したアクセスパターン**: 既存の `enrichNotePlaces` 等も callable 経由であり、
   読み取りも callable に統一することで将来の変更が容易になる
