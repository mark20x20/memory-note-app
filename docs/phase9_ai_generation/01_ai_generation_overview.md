# Phase 9: AI Generation — Overview

## 1. 目的

写真・場所・日付のメタデータをもとに、Cloud Functions 経由で OpenAI API を呼び出し、  
短文の思い出日記を自動生成する。生成結果を Firestore に保存し、Detail 画面で表示する。

## 2. 背景

Phase 8 まででノート作成・写真アップロード・地図表示が完成した。  
しかし「写真を選ぶだけで思い出ノートが完成する」体験にはまだ文章が欠けている。  
AIによる短文生成があることで、ユーザーはキャプションや日記を書く手間なく  
思い出の記録が完成する体験を得られる。

Phase 9 では最小限の AI 生成機能を実装し、Detail 画面の AI 日記セクションを  
実データで埋めることを目標とする。

## 3. 入力データ（AI に渡す情報）

以下の写真・ノートメタデータのみを AI に渡す。  
**写真画像そのものは OpenAI に送らない。**

| フィールド | ソース | 説明 |
|---|---|---|
| `title` | `memory_notes/{noteId}.title` | ノートのタイトル |
| `memo` | `memory_notes/{noteId}.memo` | ユーザーが入力したメモ（任意） |
| `noteType` | `memory_notes/{noteId}.noteType` | "personal" または "shared" |
| `photoCount` | `memory_notes/{noteId}.photoCount` | 写真枚数 |
| `takenAtList` | `memory_notes/{noteId}/photos` の `takenAt` 集約 | 撮影日時リスト（例: "2026-05-03"）|
| `locationSummary` | `memory_notes/{noteId}/photos` の `latitude/longitude` 集約 | 撮影地点の大まかなグループ数・代表座標 |

### 送らないもの

- 写真画像（バイナリ / base64 / URL）
- ユーザーの氏名・メールアドレス
- Firebase UID
- デバイス情報

## 4. 出力データ

| フィールド | 型 | 説明 |
|---|---|---|
| `aiDiary` | `string` | 生成された短文日記（目安100〜200文字） |
| `aiDiaryStatus` | `'idle' \| 'generating' \| 'completed' \| 'failed'` | 生成ステータス |
| `aiDiaryGeneratedAt` | `Timestamp \| null` | 生成完了日時 |

## 5. 実装ゴール

- Cloud Functions に `generateMemoryDiary` を追加する
- 認証済みユーザーが `noteId` を渡して呼び出せる
- Functions 側でノートと写真メタデータを Firestore から取得する
- OpenAI API で短文日記を生成する
- 生成結果を `memory_notes/{noteId}` に保存する
- Detail 画面の AI 日記セクションが生成結果を表示できるようにする
- 生成中・成功・失敗の各状態を UI で表示する
- 生成失敗してもノート閲覧・写真・地図表示を壊さない

## 6. 非ゴール（Phase 9 でやらないこと）

- Vision API（画像認識）
- 写真画像そのものを OpenAI へ送る処理
- Google Maps API / Reverse Geocoding（場所名推定）
- SNS 共有カード
- AI 日記の編集専用画面
- 複数候補生成
- 課金プラン連動 / Stripe
- 写真削除・ノート削除
- 共有ノート管理
- Expo SDK / React / React Native のバージョン変更
- .env 変更
- モバイル側への OpenAI SDK 導入

## 7. Phase 8 からの接続

Phase 8 で実装した `app/(app)/notes/[noteId].tsx` には以下のプレースホルダーが残っている：

```tsx
{/* ── AI日記プレースホルダー ── */}
<View style={styles.section}>
  <Text style={styles.sectionLabel}>AI日記</Text>
  <View style={styles.diaryCard}>
    <Text style={styles.diaryPlaceholder}>
      AIが生成した短文日記がここに表示されます。
    </Text>
  </View>
  <Text style={styles.placeholderCaption}>AI日記は Phase 9 以降で実装予定</Text>
</View>
```

Phase 9 ではこのセクションを実装し、生成ステータスに応じたUI表示に置き換える。

## 8. Phase 10 以降へ回すもの

- AI 日記の手動編集専用画面（Phase 10: Note Detail / Edit）
- 生成回数の本格的な課金プラン連動（Phase 15: Analytics / Cost Controls）
- Reverse Geocoding による場所名推定（Phase 10 推奨）
- Retry / バックオフ戦略の本格実装（Phase 15）
- タイトル AI 自動生成（Phase 10 以降）
