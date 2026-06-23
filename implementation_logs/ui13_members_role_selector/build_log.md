# UI-13 Build Log: Members Role Selector

## 実施日: 2026-06-24

## 既存実装の確認結果

### members.tsx (変更前)

owner が他メンバーのロールを変更するとき、以下のトグルボタンが表示されていた:

```tsx
<TouchableOpacity onPress={() => handleUpdateRole(uid, member.role === 'editor' ? 'viewer' : 'editor')}>
  <Text>{member.role === 'editor' ? '閲覧者に' : '編集者に'}</Text>
</TouchableOpacity>
```

問題:
- 現在のロールを確認せずにタップすると意図しない変更が起きやすい
- 変更先が何になるか視覚的に分かりにくい
- warm / safe な UI トーンに合わない

---

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `app/(app)/notes/[noteId]/members.tsx` | Role Selector Modal 追加、トグルボタンを「変更」ボタンに差し替え |

---

## 変更内容

### 1. RoleSelectorTarget 型を追加

```ts
type RoleSelectorTarget = {
  uid: string;
  displayName: string;
  currentRole: 'editor' | 'viewer';
};
```

### 2. state を追加

```ts
const [roleSelectorTarget, setRoleSelectorTarget] = useState<RoleSelectorTarget | null>(null);
```

### 3. ハンドラを追加

```ts
// セレクターを開く
const openRoleSelector = (uid, displayName, currentRole) => {
  setRoleSelectorTarget({ uid, displayName, currentRole });
};

// セレクターでロール選択 → modal を閉じて既存 handleUpdateRole を呼ぶ
const handleRoleSelected = (newRole) => {
  const target = roleSelectorTarget;
  setRoleSelectorTarget(null);
  handleUpdateRole(target.uid, newRole);  // 既存の確認Alert付きハンドラ
};
```

### 4. メンバー行のアクションボタンを変更

```tsx
// 変更前: トグルボタン
<TouchableOpacity onPress={() => handleUpdateRole(uid, member.role === 'editor' ? 'viewer' : 'editor')}>
  <Text>{member.role === 'editor' ? '閲覧者に' : '編集者に'}</Text>
</TouchableOpacity>

// 変更後: Modal を開くボタン
<TouchableOpacity onPress={() => openRoleSelector(member.uid, member.displayName, member.role)}>
  <Text>変更</Text>
</TouchableOpacity>
```

### 5. Role Selector Modal を追加

```
- React Native 標準の Modal (transparent, animationType="slide")
- Pressable overlay でシート外タップ → close
- ハンドルバー (36×4 pill)
- 対象メンバー名 + "ロールを変更する" サブタイトル
- 編集者 option row (badge + label + desc + 現在のロールなら ✓)
- 閲覧者 option row (同上)
- キャンセルボタン
```

### 6. Imports 追加

```ts
import { Modal, Pressable } from 'react-native';
```

---

## ビルド結果

- `npx tsc --noEmit`: Exit 0 ✓
- `npx expo lint`: Exit 0 ✓ (errors 0, warnings 0)
- Functions build: 不要
