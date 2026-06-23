# UI-13 Design Decisions

## 1. Modal Bottom Sheet 方式を選択 (推奨A)

**決定:** React Native 標準の `Modal` (transparent + animationType="slide") で Bottom Sheet 風 UI を実装。

**理由:**
- Alert 選択肢方式 (推奨B) より視覚的に warm / safe なトーンに合う。
- 外部ライブラリ追加不要。
- 現在のロール (✓ マーク) を表示することで「今何なのか・何に変えるのか」が一目で分かる。
- `animationType="slide"` で画面下から自然に出てくる UX。

## 2. Pressable の二重ネストでオーバーレイタップを実現

**決定:** outer `<Pressable style={modalOverlay} onPress={close}>` の中に inner `<Pressable onPress={() => {}}>` でシートを配置。

**理由:**
- outer tap → close (オーバーレイ)
- inner tap → 何もしない (シート内のタップが overlay に伝播しない)
- `TouchableWithoutFeedback` より `Pressable` の方が Expo/RN 推奨の API。

## 3. モーダル内で handleRoleSelected を呼び、既存 handleUpdateRole に委譲

**決定:** `handleRoleSelected(newRole)` がモーダルを閉じた後に既存の `handleUpdateRole(uid, newRole)` を呼ぶ。

**理由:**
- `handleUpdateRole` はすでに Alert confirm を持つ。
- UI-13 のスコープは「選択UIの改善」であり、確認ロジックの変更は含まない。
- ロールが選択される → modal close → Alert confirm の順で二重確認にならない。

## 4. "変更" ボタンラベル

**決定:** メンバー行のアクションボタンを "閲覧者に" / "編集者に" トグルから "変更" (固定) に変更。

**理由:**
- モーダルで具体的な選択肢が出るため、ボタン自体のラベルはアクションの起動であることを示せばよい。
- "変更" は動作を端的に伝え、"ロール変更" より短くレイアウトに収まりやすい。

## 5. 現在のロールに ✓ マークと背景色を表示

**決定:** `roleOptionRowCurrent: { backgroundColor: colors.surfaceIvory }` + `✓` テキスト。

**理由:**
- 「今何のロールか」を modal 内で確認できる。
- 同じロールを誤って選択した場合でも handleUpdateRole が Alert を出すため問題ない。
- warm な ivory 背景でハイライトし、admin パネル的な選択肢感を避ける。

## 6. 外部ライブラリを追加しない

**決定:** `@gorhom/bottom-sheet` 等は使わず、RN 標準 Modal のみで実装。

**理由:** package.json を変更しない制約。外部 BottomSheet ライブラリなしでも十分な UX が実現できる。
