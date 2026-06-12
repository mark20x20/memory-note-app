# Phase 12.5: 候補スコアリングと AI ランキング設計

## 概要

Places API から取得した候補リストを、ユーザーのコンテキスト（写真メタデータ・メモ・ノートタイトル）に基づいてスコアリングし、最も適切な候補を推定する設計を定義する。

**基本原則:**
- AI はゼロから場所を断定しない
- 外部 API 候補の中から補助的に選ぶ役割
- 不確実な場合は複数候補をユーザーに提示する
- confidence が低い候補は自動確定しない

---

## スコアリング設計

### スコア要素一覧

| 要素 | 重み | 算出方法 |
|---|---|---|
| GPS距離スコア | 0.30 | `1.0 - (distanceMeters / maxRadius)` |
| カテゴリ優先度スコア | 0.20 | カテゴリ別の優先度テーブル参照 |
| 写真集中度スコア | 0.15 | 同一グループの写真枚数 / 総写真数 |
| メモ一致スコア | 0.15 | ユーザーメモとの文字列類似度 |
| タイトル一致スコア | 0.10 | ノートタイトルとの類似度 |
| 評価スコア | 0.05 | 外部 API の rating / 5.0 |
| 複数写真一致ボーナス | 0.05 | 同一候補が複数写真グループから出現した場合 |

**合計スコア = Σ(要素 × 重み)** → 0.0 〜 1.0

---

### 1. GPS距離スコア

```typescript
function distanceScore(distanceMeters: number, maxRadius: number = 200): number {
  if (distanceMeters >= maxRadius) return 0;
  return 1.0 - (distanceMeters / maxRadius);
}
```

半径 200m 以内を対象。距離が近いほどスコアが高い。

---

### 2. カテゴリ優先度スコア

観光・食事・移動などの写真撮影文脈に合うカテゴリを優先する。

```typescript
const CATEGORY_PRIORITY: Record<string, number> = {
  tourist_attraction: 1.0,
  museum: 0.9,
  park: 0.85,
  restaurant: 0.85,
  cafe: 0.80,
  shopping_mall: 0.75,
  store: 0.70,
  lodging: 0.70,
  train_station: 0.65,
  subway_station: 0.65,
  natural_feature: 0.60,
  amusement_park: 0.90,
  zoo: 0.85,
  aquarium: 0.85,
  bar: 0.50,
  bank: 0.10,
  gas_station: 0.05,
  // デフォルト
  _default: 0.30,
};

function categoryScore(types: string[]): number {
  const scores = types.map(t => CATEGORY_PRIORITY[t] ?? CATEGORY_PRIORITY._default);
  return Math.max(...scores);
}
```

---

### 3. 写真集中度スコア

グループに属する写真枚数が多いほど「しっかり滞在した場所」として優先する。

```typescript
function photoConcentrationScore(groupPhotoCount: number, totalPhotoCount: number): number {
  if (totalPhotoCount === 0) return 0;
  const ratio = groupPhotoCount / totalPhotoCount;
  return Math.min(ratio * 2, 1.0);  // 50%以上で最大スコア
}
```

---

### 4. メモ / タイトル一致スコア

ユーザーのメモやノートタイトルに候補地名が含まれる場合にボーナスを与える。

```typescript
function textMatchScore(candidateName: string, text: string): number {
  if (!text || !candidateName) return 0;
  const normalizedName = candidateName.toLowerCase().replace(/\s/g, '');
  const normalizedText = text.toLowerCase().replace(/\s/g, '');
  if (normalizedText.includes(normalizedName)) return 1.0;
  // 部分一致（最低4文字以上）
  if (normalizedName.length >= 4) {
    const partial = normalizedName.slice(0, Math.floor(normalizedName.length * 0.7));
    if (normalizedText.includes(partial)) return 0.5;
  }
  return 0;
}
```

---

### 5. 複数写真一致ボーナス

同一の `providerPlaceId` が複数の PlaceGroup の候補として出現した場合はボーナスを加算する。

```typescript
function multiGroupBonus(candidatePlaceId: string, allGroupCandidates: PlaceCandidateDoc[][]): number {
  const occurrences = allGroupCandidates.filter(
    group => group.some(c => c.providerPlaceId === candidatePlaceId)
  ).length;
  return Math.min((occurrences - 1) * 0.1, 0.3);  // 最大+0.3
}
```

---

### 総合スコア算出（Cloud Functions 実装予定）

```typescript
function calculateCandidateScore(
  candidate: PlaceCandidateDoc,
  group: PlaceGroupDoc,
  note: NoteDoc,
  allGroupCandidates: PlaceCandidateDoc[][]
): number {
  const dist = distanceScore(candidate.distanceMeters ?? 200);
  const cat = categoryScore(candidate.types);
  const photo = photoConcentrationScore(group.photoCount, note.photoCount ?? 1);
  const memo = textMatchScore(candidate.name, note.memo ?? '');
  const title = textMatchScore(candidate.name, note.title ?? '');
  const rating = (candidate.rating ?? 3.0) / 5.0;
  const bonus = multiGroupBonus(candidate.providerPlaceId ?? '', allGroupCandidates);

  return (
    dist * 0.30 +
    cat * 0.20 +
    photo * 0.15 +
    memo * 0.15 +
    title * 0.10 +
    rating * 0.05 +
    bonus * 0.05
  );
}
```

---

## AIランキング設計

### AI の役割

1. スコアリング結果上位 3〜5件の候補を受け取る
2. 候補の中から最も自然な選択をテキストで提案する
3. 複数候補が同程度の場合はユーザー提示用の表現を整える
4. confidence を出力する
5. **候補外の場所を断定しない**

### AI に送るデータ

```json
{
  "noteTitle": "京都の旅",
  "noteMemo": "嵐山と金閣寺を巡った",
  "photoCount": 24,
  "takenAtRange": "2026-03-15 09:00 〜 2026-03-15 17:30",
  "candidates": [
    {
      "name": "金閣寺（鹿苑寺）",
      "types": ["tourist_attraction", "museum"],
      "distanceMeters": 45,
      "rating": 4.7,
      "score": 0.88
    },
    {
      "name": "金閣寺バス停",
      "types": ["transit_station"],
      "distanceMeters": 120,
      "rating": null,
      "score": 0.41
    }
  ]
}
```

**注意: 写真画像は AI に送らない。座標も送らない。**

### AI プロンプト構造

```
あなたは思い出ノートアプリのアシスタントです。
ユーザーが訪れた場所の候補を以下に示します。

ノート情報:
- タイトル: {{noteTitle}}
- メモ: {{noteMemo}}
- 写真枚数: {{photoCount}}
- 撮影時間帯: {{takenAtRange}}

場所候補（スコア降順）:
{{candidates}}

以下のルールに従って回答してください:
1. 候補の中から最も適切な1件を選んでください
2. 候補外の場所を断定しないでください
3. 不確かな場合は needsUserConfirmation を true にしてください
4. 自然で簡潔なラベルを日本語で生成してください
5. confidence は 0.0〜1.0 で返してください

JSON で返してください:
{
  "selectedName": "...",
  "summaryLabel": "...",
  "confidence": 0.0〜1.0,
  "reason": "...",
  "needsUserConfirmation": true/false
}
```

### AI 出力例

```json
{
  "selectedName": "金閣寺（鹿苑寺）",
  "summaryLabel": "金閣寺",
  "confidence": 0.88,
  "reason": "GPS距離が45mと最も近く、観光地カテゴリ・高評価であり、メモの「金閣寺」とも一致している。",
  "needsUserConfirmation": false
}
```

不確かな場合の例:

```json
{
  "selectedName": "浅草寺",
  "summaryLabel": "浅草周辺",
  "confidence": 0.62,
  "reason": "GPS距離は近いが、浅草寺・仲見世通り・雷門など複数の有力候補が密集しており、どれが最も写真の場所かは不確か。",
  "needsUserConfirmation": true
}
```

---

## confidence 閾値と UI の対応

| confidence | 状態 | UI 表示 |
|---|---|---|
| 0.80 以上 | 高い | 場所名を自動表示（要確認マークなし） |
| 0.60 〜 0.79 | 中程度 | 場所名を表示 + 「確認してください」バッジ |
| 0.40 〜 0.59 | 低い | 「候補あり・要確認」として複数候補を提示 |
| 0.40 未満 | 不確か | 「場所を特定できませんでした」+ 手動入力促進 |

---

## スコアリングの限界と注意事項

1. **GPS 精度**: 屋内・高層ビル周辺では GPS が 100m 以上ずれる場合がある。距離スコアだけに頼らない。
2. **観光地密集**: 京都・浅草など観光スポットが密集したエリアでは、複数候補が同程度のスコアになりやすい。`needsUserConfirmation=true` を積極的に使う。
3. **AIの幻覚防止**: AI プロンプトに「候補外の場所を断定しない」ルールを明示し、出力に `selectedName` が候補リストにない場合はシステム側でエラーとして扱う。
4. **メモなし・タイトル汎用**: メモが空・タイトルが「旅行」のような汎用的な場合は、テキスト一致スコアに頼れない。距離・カテゴリ・集中度で判断する。
