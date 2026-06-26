# UI-20 Create Memory Screen Polish — 課題・既知の問題

## 解決済み

### #1 ScreenHeader にサブタイトル機能がない
- **問題**: 既存 ScreenHeader はサブタイトルをサポートしない
- **解決**: 画面インライン カスタムヘッダーを実装。shared component への変更を避けた。

### #2 `progressBarFill` の width 型エラー
- **問題**: `{ width: \`${Math.round(uploadProgress)}%\` }` が `string` 型として TS に怒られる可能性
- **解決**: `as \`${number}%\`` でキャストして型エラーを回避

## 残存課題

### #3 タイトル必須バリデーション
- **内容**: `useCreateNote.validate()` がタイトル必須。空タイトルで「無題の思い出」フォールバックを使いたい場合は hook の bypass が必要
- **影響**: ユーザーはタイトルを入力しないとノートを作れない
- **対応**: 次フェーズで `useCreateNote` に `titleFallback` オプションを追加、または handleSave で直接 noteRepository を呼ぶ方式に切り替え

### #4 写真最大枚数 (10枚) の明示
- **内容**: `usePhotoPicker` は MAX_PHOTOS=10 でリミットしているが、UIにその旨の表示がない
- **対応**: photoCountBadge に「最大10枚」の hint を追加するか、ピッカーエラー時に表示

### #5 写真メタデータの可視化（Partial Metadata state）
- **内容**: spec の State E: Partial Metadata（GPS なし写真がある場合の警告カード）が未実装
- **影響**: GPS のない写真を混在させても警告なし
- **対応**: `usePhotoPicker` が返す photos の GPS 有無を確認して warning chip を表示

### #6 並び替え・選び直しボタン
- **内容**: spec の "Section 5: Bottom Action Area" には「並び替え」「選び直す」のセカンダリボタンがある
- **判断**: 今回対象外（「今回やらないこと」）
- **対応**: 将来的に写真並び替え機能実装時に追加

### #7 共有ノートタイプの選択が disabled のまま
- **内容**: 「共有ノート」NoteTypeCard は `disabled` のまま（旧 "Phase 11 以降" → 新 "ノート作成後に設定"）
- **判断**: Members / Sharing screen が存在するためノート作成後に共有設定可能。UI の混乱を避けるため disabled 維持
- **対応**: noteType の create 時選択が必要なら別タスクで検討
