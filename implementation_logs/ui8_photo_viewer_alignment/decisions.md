# UI-8 Design Decisions

## 1. viewer.tsx は変更しない

**決定:** viewer.tsx のロジックは正しい。呼び出し側 (map, flows) を修正する。

**理由:**
- viewer は `placeGroupId` があれば `photoIds` ベースでフィルタリングする設計。これは正しい。
- 問題は「photoIds がない場合でも placeGroupId を渡していた」呼び出し側にある。
- viewer を変更すると photoPreviewURLs fallback を「URL として受け取る」処理が必要になり、
  Firestore スキーマや PhotoDoc 型の変更を伴う可能性がある。それは今回のスコープ外。

## 2. fallback 写真はタップ無効にする (viewer を開かない)

**決定:** `photoPreviewURLs` fallback のみの写真は `<Image>` のみ描画し、TouchableOpacity を使わない。

**理由:**
- fallback URL に対応する PhotoDoc が存在しないため、viewer のフィルタ結果が空になる。
- ユーザーにエラーを見せるより「タップできない」方が自然。
- 写真は表示されるので「画像が見えない」問題は起きない。

## 3. fallback 写真に opacity: 0.75 を適用

**決定:** fallback 写真は `opacity: 0.75` で少し薄く表示する。

**理由:**
- タップしても何も起きないことをユーザーに示す視覚的ヒント。
- 完全に同じ見た目だとタップして「何も起きない」と感じる可能性がある。
- 0.75 は「見えるが少し控えめ」という自然な感触。0.5 は暗すぎる。

## 4. 共通ヘルパー canOpenGroupedPhotoViewer を作成

**決定:** `src/features/photos/utils/photoViewerNavigation.ts` に共通ヘルパーを作成。

**理由:**
- map.tsx と flows/[placeGroupId].tsx で同じ判定が必要。
- 将来 places/[placeGroupId].tsx でも photo strip に viewer 遷移を追加する場合に再利用できる。
- 構造的型付け (`{ photoIds?: string[] | null }`) を使い、features 間の循環依存を避けた。

## 5. places/[placeGroupId].tsx は変更不要

**決定:** places/[placeGroupId].tsx の photo strip は既に `<Image>` のみ (TouchableOpacity なし)。変更不要。

**理由:** 元から viewer 遷移がなかったため、バグは存在しなかった。

## 6. preview.tsx は変更不要

**決定:** preview.tsx のヒーロー + サムネイルストリップは placeGroupId を渡していない。変更不要。

**理由:**
- preview の写真は note 全体の写真 (placeGroup に紐付かない)。
- viewer に `placeGroupId` なしで遷移しているため、全写真が表示される。正しい挙動。
