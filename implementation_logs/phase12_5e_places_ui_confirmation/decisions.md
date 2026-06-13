# Phase 12.5E Places UI / User Confirmation — Decisions

## D1: 自動推定は仮候補として扱う

**決定:** `userConfirmed=false` の場所は「要確認」バッジで表示し、確定済みとして見せない。

**理由:**
- 本アプリの目的はレストラン特定ではなく、写真を地図・時系列・旅順で整理すること
- 密集地では会社・歯医者・学校などが近距離候補として出るため、自動確定は誤判定リスクが高い
- ユーザーが選択・修正できるUXを優先する

---

## D2: ユーザー確認を必須にする

**決定:** `enrichNotePlaces` 実行後も `userConfirmed=false` のままにし、ユーザーが明示的に選択または手動入力するまで確定しない。

**理由:**
- 誤った場所でノートが確定されることを防ぐ
- `selectPlaceCandidate` か `updatePlaceGroupManually` の明示操作のみ `userConfirmed=true` にする

---

## D3: 候補リストを「訪問候補」と「その他の近隣」に分類する

**決定:** 候補確認画面で候補を2グループに分けて表示する。
- 訪問候補: restaurant/cafe/tourist_attraction/station/hotel/shopping/museum/park 等
- その他の近隣: office/service/school/car_repair 等

**理由:**
- 密集地では非訪問候補（会社・サービス業・学校）が上位に出る
- UIレベルで分類するだけでAIランキングなしに視認性を上げられる
- 分類ロジックはシンプルなセット参照（`PRIORITY_TYPES`）のみ

---

## D4: レストラン特定を主目的にしない

**決定:** UIの文言・バッジ・説明文はすべて「レストラン」「おすすめ」ではなく「訪れた場所」「近くの候補」として表示する。

**文言方針:**
- 「おすすめ」→ 「近くの施設候補」
- 「AIが選んだ」→ 使わない
- 「正解」→ 使わない
- 「推定された場所」→ 採用（確定ではないことを示す）

---

## D5: AIランキングを使わない

**決定:** OpenAI / その他 AI による候補リランキングは実装しない。

**理由:**
- D1・D2 と同じ: 自動確定リスク
- 現状の課題は AI ランキングではなく、ユーザーが選択・修正できる UI の整備
- 候補は `distanceMeters` 昇順（近い順）で表示し、ユーザーが選ぶ

---

## D6: 手動入力を正式導線にする

**決定:** 候補にない場所はユーザーが場所名・カテゴリを直接入力できる（`updatePlaceGroupManually`）。

**理由:**
- Google Places に登録されていない場所・ローカル施設でも記録できる
- 自分で名前をつけることが「思い出ノート」の体験として自然
- 入力インターフェースはシンプルなテキスト + カテゴリチップのみ

---

## D7: viewer は未確認グループの候補操作不可

**決定:** viewer は `userConfirmed=true` の場所のみ閲覧・遷移可。未確認グループをタップしても何もしない。

**理由:**
- 候補選択・修正は owner/editor の責務
- viewer に候補一覧を見せることに情報漏洩リスクはないが、混乱を避けるため操作を制限

---

## D8: VisitedPlacesSection は placeGroups を自前で onSnapshot 購読する

**決定:** Detail 画面からグループデータを props で渡すのではなく、`VisitedPlacesSection` 内で直接 `subscribePlaceGroupsByNoteId` を呼ぶ。

**理由:**
- Detail 画面のコードを最小限の変更にする
- `noteId` と `note` の2 props で完結し、シンプルなインターフェースを維持
- PlaceGroup データは場所セクション専用であり、Detail 画面全体で共有不要
