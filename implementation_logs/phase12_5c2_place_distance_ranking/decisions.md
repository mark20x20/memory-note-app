# Phase 12.5C-2 Place Distance Ranking — Decisions

## D1: `rankPreference: "DISTANCE"` を採用し、candidates 保存順も distanceMeters 昇順にする

**決定:** Google Places API (New) Nearby Search の request body に `rankPreference: "DISTANCE"` を追加した。

**理由:**
- デフォルトの `rankPreference` は `POPULARITY`（人気順）であり、有名チェーン店や評価数の多い店が上位に出やすい。
- 実機テストの結果、実際に訪問した `Wasabi Plus` が候補に出ず、同じエリアの別チェーン店が上位を占めた。
- ユーザーが実際に訪れた場所は「近い場所」であることが大前提のため、距離順の方が精度が高い。
- `rankPreference: "DISTANCE"` を使うと `maxResultCount` に関わらず最も近い順に返却されるため、候補の先頭が訪問場所である確率が上がる。

**注意:** `rankPreference: "DISTANCE"` を使うと `maxResultCount` の指定は可能だが、`minRating` は指定不可。今回は評価フィルタを使っていないため影響なし。

**追加修正（Phase 12.5C-2 追加）:** Functions 側でも candidates を `distanceMeters` 昇順で保存するよう変更した。`confidence` は削除せず、表示用参考値として残す。距離が同値の場合のみ `confidence` 降順を tie-breaker として使用する。

---

## D2: 保存候補数を5件から10件に増やす

**決定:** `scored.slice(0, 5)` → `scored.slice(0, 10)` に変更した（`fetchAndSaveCandidates` および `enrichNotePlaces` 内の2箇所）。

**理由:**
- 実機テストでは `maxResultCount: 10` でAPIから10件取得しているが、Firestoreには5件しか保存していなかった。
- 距離順でも6〜10位に正解の場所が入る可能性があり、候補をユーザーに提示できなかった。
- 10件保存してもFirestoreのストレージコストは微小（1候補あたり約300 bytes × 10件 = 3KB/グループ）。
- UIでは縦スクロールで10件を表示できるため許容範囲。

---

## D3: AIランキングを延期（Deferred）とする

**決定:** Phase 12.5D から OpenAI APIを使ったAIランキングを除外し、将来タスクに移動する。

**理由:**
- 実機テストの結果、現時点の問題はAIによるリランキングではなく、APIの返却順と候補数の不足だった。
- `rankPreference: "DISTANCE"` + 候補10件で対応できる範囲を先に確認する。
- AIが誤って場所を自動確定するリスクより、距離順候補を複数提示してユーザーが選択する方が安全。
- AIは将来、候補名の要約・日記文への反映・あいまいな場所の補完で活用する想定。
- OpenAI API の利用コストは候補絞り込みが完了してから追加する方がコスト効率が良い。

**AIランキングの将来用途:**
- 候補名の日本語要約・整形
- ノートメモ・タイトルとの意味的な一致スコアリング
- 複数グループをまたいだエリアラベル生成

---

## D4: ユーザー選択UXを優先する

**決定:** `userConfirmed = false` を維持し、AIによる自動確定を行わない方針を継続する。

**理由:**
- 場所の選択はプライバシーに関わる情報であり、誤確定はユーザーの信頼を損なう。
- AIが「最も近い店 = 訪問した店」を自動確定すると、隣の店舗に設定される誤りが発生しうる。
- 距離順10件を提示し、ユーザーが1つ選択するフローが最も安全で実用的。
- 手動修正フロー（`updatePlaceGroupManually`）は既に実装済み。

---

## D5: Phase 12.5D の再定義

**旧定義:** Phase 12.5D = 候補スコアリング / AIランキング実装

**新定義:** Phase 12.5D = Candidate Retrieval Accuracy / User Selection UX Refinement

**Phase 12.5D 実装対象（改訂版）:**
1. 距離順候補取得の実機テスト確認
2. 候補数・距離・カテゴリ表示の改善（UI補助情報の充実）
3. ユーザー選択と手動修正を前提にしたUX改善
4. 日次 API 制限（`usage_counters/{uid}/places_api_calls/{YYYYMMDD}`）
5. `refreshPlaceCandidates` のレート制限（1グループ/日3回）

**AIランキング:** Future / Deferred に移動
