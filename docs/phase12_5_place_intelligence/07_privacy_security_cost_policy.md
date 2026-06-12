# Phase 12.5: プライバシー・セキュリティ・コストポリシー

## 1. 位置情報の取り扱い方針

### 基本原則

位置情報は個人の行動履歴に直結する**準個人情報**として扱う。

```
位置情報ポリシー:
1. 精密座標（latitude/longitude）は共有カードや公開コンテンツに出力しない
2. place label（場所名）は表示しても、緯度経度は原則出さない
3. 外部 API に送るのは候補取得に必要な最小限の座標のみ
4. 写真画像そのものは Places API や AI に送らない
5. AI（OpenAI）に送る場合も、候補地テキスト・メモ・タイトルのみ
6. 位置情報はユーザーが「場所推定」を明示的に実行した場合のみ外部 API に送信する
```

---

### 共有カードでの位置情報表示制限

| 表示種別 | 許可 | 禁止 |
|---|---|---|
| 確定した場所名（例: 浅草寺） | ○ | — |
| エリアラベル（例: 東京 浅草） | ○ | — |
| 緯度経度の数値 | — | ✗ |
| 住所（番地まで） | — | ✗ |
| 地図タイル画像（GPS付き） | 位置情報のない静的画像のみ ○ | GPS埋め込みは ✗ |

### 共有ノートでの位置情報共有範囲

| 閲覧者 | 見えるもの |
|---|---|
| owner | 全データ（座標・場所名・候補） |
| editor | 全データ（座標・場所名・候補） |
| viewer | 確定場所名・エリアラベルのみ（座標・候補リストは非表示） |

---

### 削除時の位置データ削除

ノートを削除する場合、以下を連鎖削除する:

```
memory_notes/{noteId}
  → place_groups/{placeGroupId}（全件）
    → candidates/{candidateId}（全件）
  → visitedPlacesSummary（NoteDoc フィールド削除で消える）
```

削除処理は `deletePhotosForNote` と同様のパターンで Cloud Functions または クライアントサイドで実装する（Phase 12.5B にて決定）。

---

## 2. 外部 API セキュリティ

### APIキー管理

| キー | 保存場所 | アクセス者 |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Firebase Secret Manager | Cloud Functions のみ |
| `OPENAI_API_KEY` | Firebase Secret Manager（既存） | Cloud Functions のみ |
| Maps SDK の Android/iOS キー | `app.json` / Info.plist | EAS Build 時のみ（平文配置しない） |

**絶対禁止事項:**
- `.env` ファイルに Places API キーを書かない
- `app.json` / `app.config.js` に Places API キーを書かない
- モバイルアプリのバンドルに API キーを含めない
- クライアントサイドから Google Places API を直接呼ばない

### API キー制限設定（Google Cloud Console）

```
GOOGLE_PLACES_API_KEY の制限:
- アプリケーション制限: Cloud Functions のサービスアカウント IP のみ
- API 制限: Places API (New) のみ有効化
- リクエスト制限: 1日 10,000 リクエスト上限
```

---

## 3. 利用制限（Rate Limit）

### ユーザーごとの制限

| 操作 | 上限 | リセット |
|---|---|---|
| `enrichNotePlaces` | 10回/日 | 00:00 JST |
| `getPlaceCandidatesForGroup` | 20回/日 | 00:00 JST |
| `refreshPlaceCandidates` | 3回/日/グループ | 00:00 JST |
| `selectPlaceCandidate` | 制限なし（Firestore 書き込みのみ）| — |
| `updatePlaceGroupManually` | 制限なし（Firestore 書き込みのみ）| — |

### プロジェクト全体の制限

```
Google Places API:
- 1日 50,000 リクエスト上限（Cloud Console でハードリミット設定）
- 1分あたり 100 リクエスト（Rate Limiter を Cloud Functions に実装）

OpenAI API:
- 1日 10,000 リクエスト上限（既存の AI 日記制限と共用）
```

---

## 4. キャッシュ方針

### Google Places API のキャッシュ（ToS 準拠）

Google Places API の利用規約（ToS）では、レスポンスのキャッシュは **30 日以内** まで許可されている（2024年改定）。ただし、以下のフィールドは **キャッシュ禁止**:

- `currentOpeningHours`（営業時間のリアルタイム情報）
- `utcOffsetMinutes`
- `priceLevel`（変動する可能性があるため）

```
本アプリのキャッシュポリシー:
- 候補データのキャッシュ期間: 7日間（ToS 上限の 30日以内）
- キャッシュ対象フィールド: name, types, location, rating（静的フィールドのみ）
- `fetchedAt` フィールドで管理
- 7日経過後は `forceRefresh: true` 相当で再取得
```

### OpenAI レスポンスのキャッシュ

- AI ランキング結果は `selectedCandidateId` + `confidence` + `reason` として Firestore に保存
- 候補が変わらない限り再ランキングは不要
- ユーザーが `refreshPlaceCandidates` を呼んだ場合のみ再ランキング

---

## 5. ロギング方針

### ログに含めてはいけない情報

```
禁止:
- latitude / longitude の具体的な数値
- 住所（番地以下）
- 場所名（observational data として）
- ユーザーのメモ・タイトル内容
- uid のフル文字列（末尾4文字のみ）
```

### 許可されるログ

```typescript
// 許可例
console.log(`[enrichNotePlaces] noteId=${noteId.slice(0,8)}... uid=...${uid.slice(-4)} groups=${n} status=completed`);
console.log(`[getPlaceCandidatesForGroup] cacheHit=${cacheHit} candidatesCount=${n}`);

// 禁止例（実装しない）
console.log(`lat=${latitude} lng=${longitude}`);   // 座標
console.log(`place=${candidate.name}`);            // 場所名
console.log(`uid=${uid}`);                         // uid フル
```

---

## 6. コスト管理

### Places API のコスト見積もり（月次）

```
Nearby Search: $0.032/リクエスト
想定: 月間 100 ノート × 3 グループ平均 = 300 リクエスト
月間コスト目安: $9.60

Google Geocoding (フォールバック): $0.005/リクエスト
想定: 月間 30 リクエスト
月間コスト目安: $0.15

OpenAI gpt-4o-mini (AI ランキング): $0.15/1M tokens ≒ $0.0001/リクエスト
想定: 月間 300 リクエスト × 500 tokens
月間コスト目安: $0.02
```

**月間合計目安（100 ノート/月）: 約 $10**

### コスト警告・上限設定

```
1. Google Cloud Console でアラート設定:
   - 月間 $20 でアラート通知
   - 月間 $50 でサービス一時停止（ハードリミット）

2. Cloud Functions 内のソフトリミット:
   - 1ユーザー/日 10回の制限（上記）
   - プロジェクト全体 1日 50,000 リクエスト上限

3. Firestore の usage_counters コレクションで追跡
```

---

## 7. viewer 権限での制限

| 操作 | viewer | 理由 |
|---|---|---|
| PlaceGroup 一覧の閲覧 | 確定場所名のみ ○ | 場所名は共有ノートのコンテンツ |
| 候補リストの閲覧 | ✗ | 外部 API の生データへのアクセスは最小化 |
| 座標の閲覧 | ✗ | プライバシー保護 |
| `enrichNotePlaces` 実行 | ✗ | API コスト発生のため owner/editor に限定 |
| `selectPlaceCandidate` | ✗ | コンテンツ変更のため owner/editor に限定 |
| `updatePlaceGroupManually` | ✗ | コンテンツ変更のため owner/editor に限定 |

---

## 8. ユーザーへの説明責任

Phase 14（Settings / Privacy）で以下を説明画面に追加する:

```
位置情報の利用について:
- 写真の GPS 情報は、訪れた場所の推定に使用されます
- 場所推定を実行する場合、GPS 座標のみを外部サービスに送信します
- 写真の画像は外部サービスに送信されません
- 位置情報の共有は「場所を推定する」ボタンを押したときのみ実行されます
- 推定された場所データはいつでも削除できます（ノート削除で連鎖削除）
```
