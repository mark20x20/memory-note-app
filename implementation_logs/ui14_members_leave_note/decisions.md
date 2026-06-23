# UI-14 Design Decisions

## 1. leaveNote は memberRepository.removeMember をラップする

**決定:** `leaveNote(noteId, selfUid)` は既存の `memberRepository.removeMember(noteId, selfUid)` を呼ぶ。

**理由:**
- 新しい repository メソッドを追加すると Cloud Functions への新しい callable 呼び出しが必要になる。
- 現在の `removeNoteMember` Function は owner権限が必要なため runtime で失敗するが、
  将来 `leaveNote` 専用 Function が追加されれば `memberRepository` 側だけ差し替えることで動作する。
- UI → hook → repository の責務分担を維持する。

## 2. 現在のバックエンド制限を UI に反映させない

**決定:** Leave button を disabled にしたり「この機能は利用できません」と表示するのではなく、
通常通りボタンを表示し、失敗時に既存 error banner でエラーを表示する。

**理由:**
- spec の受け入れ条件: "退出失敗時にエラー表示される" — 失敗ケースを前提にした条件が含まれている。
- UI を完成させることで将来の Cloud Function 追加時に即座に動作する。
- ユーザーからすると「失敗したら error banner が出る」の方が
  「最初からボタンが押せない」より意図が伝わりやすい。

## 3. Leave Card のスタイル — "danger but calm"

**決定:** 
- card borderColor: `#FECACA` (pale red) — danger を示すが scary ではない
- button: `borderColor: colors.error` + `color: colors.error` で fill なし
- background: `colors.surface` (白) — red fill のボタンは避ける

**理由:**
- 仕様書: "danger but calm / not scary / not admin dashboard"
- 退出は取り消し不可能な操作だが、恐怖心を与えるべきではない。
- Fill なし outline ボタンは「重要だが穏やか」な危険操作に適している。

## 4. 表示条件: !isOwner && shared && uid

**決定:** `!isOwner && note.noteType === 'shared' && uid` の AND 条件。

**理由:**
- owner は退出不可（退出すると管理者不在になる）
- 個人ノートはそもそも単独所有なので退出の概念がない
- uid がない (未認証) 場合はボタンを表示しない

## 5. 退出後は /(app)/home に router.replace

**決定:** `router.replace('/(app)/home' as any)`

**理由:**
- 退出後はそのノートへのアクセス権限がなくなる。
- `router.back()` すると閲覧権限のない preview や members に戻る可能性がある。
- `replace` でスタックをリセットし、ホームへ安全に遷移する。
- `profile-setup.tsx` が同じパスを使用しているため確認済みのルート。
