# UI-10 Design Decisions

## 1. 全既存ロジックを完全保持した上でUI構造を追加

**決定:** `handleAddMember`, `handleUpdateRole`, `handleRemoveMember` の全ハンドラと
Alert 確認フローは変更なし。Hook API (`useNoteMembers`, `useManageNoteMembers`) も変更なし。

**理由:**
- 既存ロジックは Phase 11 で動作検証済み。
- ロジック変更はリグレッションリスクが高い。
- UI-10 のスコープは「ビジュアルポリッシュ」であり、機能変更は含まない。

## 2. Note Summary Card のカバー写真は note.coverPhotoURL を使用

**決定:** `useNotePhotos` フックを新たに追加せず、`note.coverPhotoURL` を使用。

**理由:**
- `note.coverPhotoURL` は NoteDoc に非正規化済み（Phase 7）。
- 追加フックは追加の Firestore 購読コストが発生する。
- `members.tsx` は既に `useNoteDetail` で note を購読しているため、追加コストゼロ。

## 3. RoleGuideRow を inline コンポーネントとして定義

**決定:** `RoleGuideRow` を同ファイル内の関数コンポーネントとして定義。

**理由:**
- Role guide は members 画面固有のコンポーネント。他画面で再利用する予定なし。
- 別ファイルに切り出すと「1回しか使わない abstraction」になる（spec に沿わない）。

## 4. 「あなた」を文字列連結ではなくバッジで表示

**決定:** `{member.displayName} (あなた)` の文字列連結をやめ、独立した `youBadge` View を使用。

**理由:**
- バッジ形式の方が視覚的に明確で warm な印象。
- 名前とバッジを別々にスタイリングできる。
- 仕様書: "optional subtitle" 的な情報として分離するのが自然。

## 5. Error banner を TouchableOpacity で閉じられるようにした

**決定:** エラーバナーをタップして閉じる機能を追加（`clearError` を onPress に）。

**理由:**
- 旧実装はエラーが永続的に表示されたままだった。
- タップで閉じられる方がユーザーフレンドリー。

## 6. viewer notice にアイコン (🔒) を追加

**決定:** viewerNotice に `🔒` アイコンを追加し、flex row レイアウトに変更。

**理由:**
- テキストだけより視覚的に「閲覧のみ」の意味が伝わりやすい。
- warm / safe なトーンに合うアイコン。

## 7. 仕様書の "member row min height: 68" に対応

**決定:** `memberRow` に `minHeight: 68` を設定。

**理由:** 仕様書 "Measurements: member row min height: 68" の明示的な要件。
タッチターゲットとして十分な高さを確保する。
