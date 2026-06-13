# Phase 12.5E-2 Places UI Polish — Issues

## I1: Map SDK 未実装のため番号付き地図ピンはまだない

**状況:** 候補番号 `#1`, `#2`, ... の UI 表現を整えたが、地図上にピンとして表示するには Map SDK が必要。

**影響:** 番号は現状 UI リスト上の参照番号のみ。地図と連携できない。

**将来対応:** Phase 12.5F で react-native-maps または expo-maps を導入時に番号付きピンを実装。

---

## I2: カテゴリ分類は types ベースの簡易分類

**状況:** `getCandidateCategoryKey` は Google Places API の `types` 配列を前提にした簡易マッチ。未知の type 値は「その他」になる。

**影響:** Google Places API が返す type 名が変わった場合（v1 API の更新）にカテゴリ分類が崩れる可能性がある。

**将来対応:** 定期的に CATEGORY_FILTERS の types 配列を API ドキュメントと照合して更新する。

---

## I3: manual.tsx は既存 PlaceGroup を前提としている

**状況:** `manual.tsx` は URL クエリパラメータで `placeGroupId` を受け取る。遷移元は必ず `places/[placeGroupId].tsx` から。

**影響:** places/index.tsx から「新規の場所を手動追加」する機能がない。

**将来対応:** 「新規 PlaceGroup 作成 + 手動保存」フローが必要な場合は別途実装する（Phase 12.5F 以降）。

---

## I4: viewer の直 URL アクセス制御は完全ではない

**状況:** `places/[placeGroupId].tsx` を viewer が直接 URL で開くと、候補一覧を閲覧できる。選択ボタンは非表示だが、候補データの閲覧は可能。

**影響:** セキュリティリスクは低い（ユーザー自身のノートデータであり、候補は訪問場所の候補）。

**将来対応:** Cloud Functions の権限保護は既に `assertOwnerOrEditor` で保護されており、選択・修正操作は不可。閲覧の完全制限が必要であれば client 側でも permission check を追加する。

---

## I5: カテゴリフィルタの「その他」はすべてのマッチングされないものを含む

**状況:** 「その他」フィルタは、他のカテゴリ（レストラン・カフェ等）のどれにも一致しない候補を返す。これにはオフィス・学校・病院・サービス業等が含まれる。

**影響:** 「その他」の候補は多様で、ユーザーが探しているものが含まれる可能性もあるが、ノイズも多い。

**将来対応:** 必要に応じてカテゴリ分類を細分化する。
