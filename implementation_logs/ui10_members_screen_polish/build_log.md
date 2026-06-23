# UI-10 Build Log: Members Screen Polish / Collaboration UI

## 実施日: 2026-06-23

## 既存実装の確認結果

Phase 11 の `members.tsx` は以下を持つ成熟した実装だった。

| 機能 | 既存 |
|---|---|
| メンバー一覧 (avatar / name / email / role badge) | ✓ あり |
| ロール変更 (owner のみ) | ✓ あり |
| メンバー削除 (owner のみ, Alertあり) | ✓ あり |
| メンバー追加フォーム (email + role) | ✓ あり |
| viewer 向け notice | ✓ あり |
| エラーバナー | ✓ あり |

不足していたもの (仕様書との差分):
- Note summary card (カバー写真・タイトル・日付・共有状態・メンバー数)
- Role guide セクション (権限説明)
- ヘッダータイトル "メンバー管理" → "メンバー"
- owner ロールラベル 'Owner' → 'オーナー'
- 「あなた」バッジ (現在は名前に "(あなた)" を文字列連結)
- viewer notice のレイアウト改善

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `app/(app)/notes/[noteId]/members.tsx` | 全面リポリッシュ (ロジック維持、UI構造追加) |

---

## 変更内容

### 1. ヘッダータイトル

```
変更前: "メンバー管理"
変更後: "メンバー"
```

仕様書: "back / title" — 温かく短いタイトル

### 2. ROLE_LABELS: Owner → オーナー

```ts
// 変更前
owner: 'Owner'

// 変更後
owner: 'オーナー'
```

### 3. Note Summary Card を追加 (Section 1)

```
- note.coverPhotoURL → 88x88 サムネイル (またはプレースホルダー)
- note.title
- note.createdAt → formatDate()
- note.noteType → 🤝 共有ノート / 👤 個人ノート バッジ
- members.length → X人
```

追加フック不要: `note.coverPhotoURL` は NoteDoc の既存フィールド。

### 4. 「あなた」バッジ

```tsx
// 変更前
{member.displayName}{member.uid === uid ? ' (あなた)' : ''}

// 変更後
<Text>{member.displayName}</Text>
{member.uid === uid ? <View style={styles.youBadge}>...</View> : null}
```

### 5. Owner アバターをハイライト

```ts
// owner のアバターは primaryLight 背景 + primary ボーダー
memberAvatarOwner: {
  borderColor: colors.primary,
  backgroundColor: colors.primaryLight,
},
```

### 6. Invite Card 見出し "メンバーを追加" → "メンバーを招待"

招待 CTA の高さを 52px に統一（仕様書: "invite CTA height: 52"）。

### 7. Viewer Notice を warm card に

```tsx
// 変更前: 単純なテキスト
// 変更後: 🔒 + テキスト in カード
```

### 8. Role Guide セクション追加 (Section 4)

```tsx
<RoleGuideRow role="owner" description="メンバー管理と編集ができます" />
<RoleGuideRow role="editor" description="写真やメモを編集できます" />
<RoleGuideRow role="viewer" description="思い出を見ることができます" />
```

### 9. borderRadius を spacing から統一

```ts
import { borderRadius } from '@/shared/theme/spacing';
// borderRadius.xl = 20 (仕様書: summary card radius: 20)
// borderRadius.full = 9999 (badges)
// borderRadius.md = 12 (buttons, inputs)
```

---

## プレビューからの導線確認

```
preview.tsx → (action link) → /(app)/notes/${noteId}/members → members.tsx ✓
members.tsx → ScreenHeader.onBack() → router.back() ✓
```

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- Functions build: 不要
