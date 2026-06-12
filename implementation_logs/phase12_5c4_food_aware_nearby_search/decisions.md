# Phase 12.5C-4 Food-aware Nearby Search — Decisions

## D1: food-related ノートでは restaurant/cafe Nearby を優先する

**決定:** `noteType / title / memo` のヒューリスティック判定で food-related と判断した場合、`includedTypes: ['restaurant', 'cafe']` を指定した Nearby Search を追加で実行する。

**理由:**
- 診断スクリプトの T06 で確認済み: `includedTypes: ['restaurant', 'cafe']` を指定すると Wasabi Plus が1位になる
- photo-2 の general Nearby では Wasabi Plus が17位（上位10件に入らない）
- 飲食ノートで non-food（住宅、道路等）が上位に混ざる問題を解消する

---

## D2: general Nearby も補助として使う（food+general 統合）

**決定:** food-related の場合でも、restaurant/cafe Nearby だけでなく general Nearby も実行して `providerPlaceId` で重複排除して統合する。

**理由:**
- `includedTypes` で絞ると飲食以外の観光地・ホテル等が候補から除外される
- 写真には食事以外の場所も写っていることがある（例: 行き帰りに立ち寄った駅や観光地）
- general Nearby を補助とすることで多様な候補を確保しつつ、飲食店を上位に持ってくる

---

## D3: 候補20件保存にした理由

**決定:** `MAX_SAVED_CANDIDATES = 20` に増加。

**理由:**
- Google Places Nearby Search の `maxResultCount` 最大値が 20
- dense エリアでは10件でも目的地が上位20件に入らない可能性がある（診断で Wasabi Plus は17位だった）
- food+general 統合後は最大40件の候補が生まれうるため、絞り込み前の20件を保存することで選択肢を広げる
- 本番UIでは折りたたみ表示でユーザーに提示できる（Phase 12.5E）

---

## D4: AIランキングを使わない

**決定:** OpenAI / その他 AI による候補リランキングは実装しない。

**理由:**
- 場所特定は「おすすめ」ではなく「事実確認」
- AI の「それっぽい」回答は誤確定リスクがある
- 近い飲食店候補を出してユーザーが選ぶ UX の方が安全かつ正確
- 現在の課題は AI ランキングではなく、候補取得精度と候補数

**将来の AI 活用候補:**
- 候補名の日本語整形・要約
- ノートメモとの意味的一致スコア補助
- 複数グループにまたがるエリアラベル生成

---

## D5: userConfirmed=false を維持

**決定:** `enrichNotePlaces` で作成する PlaceGroupDoc は常に `userConfirmed: false` で保存する。

**理由:**
- label は「最近傍候補」から設定するが、これはあくまで初期表示用の仮ラベル
- AIや自動処理が「確定した」ように見せると、誤った場所でノートが確定される恐れがある
- `userConfirmed: true` はユーザーが `selectPlaceCandidate` か `updatePlaceGroupManually` を明示的に実行した場合のみ

---

## D6: `includedTypes` に含める型を最小構成にした

**決定:** `FOOD_INCLUDED_TYPES = ['restaurant', 'cafe']` のみ。

**理由:**
- 診断スクリプトで `['restaurant', 'cafe']` が有効と確認済み
- `bar`, `bakery`, `meal_takeaway` などは API サポートが確認できていない（型名が v1 API と異なる可能性）
- 誤った型を指定すると候補0件になるリスクがある
- 将来的に追加候補をコメントに記載（`placeUtils.ts` 参照）

---

## D7: `isFoodRelatedNote` はヒューリスティックで十分

**決定:** noteType / title / memo のキーワードマッチのみ。NLP・機械学習は使わない。

**理由:**
- 誤判定があっても致命的ではない（food でも general 検索は常に実行される）
- シンプルな実装で保守しやすい
- 本番フェーズでノートタイプが整備されれば noteType での判定精度が上がる
