# UI-6 Design Decisions

## 1. Section 3 を常時表示に変更

**決定:** `{group.eventMemo ? ... : null}` の条件レンダリングをやめ、常にセクションを表示する。

**理由:**
- メモがない場合でも「追加」ボタンを見せることで、ユーザーが機能に気づける
- 空状態カードにより「まだメモがありません」のフィードバックを提供できる

## 2. インライン編集モード (モーダル不使用)

**決定:** 専用モーダルは使わず、Section 3 内でビューが切り替わるインライン編集を採用。

**理由:**
- Flow Detail は ScrollView 上のコンテンツなのでモーダルより自然
- TextInput `autoFocus` でキーボードが即座に開くため UX が良い
- 状態がシンプル (isEditingMemo フラグのみ)

## 3. memoText の初期化に useEffect を使用

**決定:** `useState('')` で初期化し、`useEffect` で `group?.eventMemo` が変化したら同期。

**理由:**
- `group` は hooks より後に導出される変数のため、useState の初期値には使えない
- 実時間 Firestore 更新 (onSnapshot) に対応するため、保存成功後に group.eventMemo が変わっても自動同期される
- 編集中 (`isEditingMemo === true`) は同期をスキップし、入力内容を保持する

## 4. `memoText.trim() || null` で空文字を null に変換

**決定:** 保存時に `eventMemo: memoText.trim() || null` を渡す。

**理由:**
- 空文字列をデータベースに保存しないことで、空状態の判定が容易になる
- `updatePlaceGroupManuallyCallable` のシグネチャが `eventMemo?: string | null` を受け付けるため

## 5. UIトーン: notebook-like / warm

**決定:** 編集カードの背景を `#FFFEF8` (warm ivory)、枠線を `colors.mapAccent` に設定。

**理由:**
- 他のセクションカード (surface / border) と差別化し、「今編集中」を視覚的に明示
- warm ivory はノートブック的な温かみを演出
