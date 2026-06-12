# Phase 12.5: 実装計画更新内容

## 変更概要

Phase 12（SNS Share Card）完了後、Phase 13（Search / Calendar）の前に  
**Phase 12.5: Place Intelligence / Location Enrichment** を追加する。

旧 Phase 13 以降は後ろにずらす（番号体系は維持）。

---

## 新 Phase 一覧（更新後）

| Phase | 名称 | ステータス |
|---|---|---|
| Phase 0〜12 | （省略） | 完了 |
| **Phase 12.5** | **Place Intelligence / Location Enrichment** | **NEW — 計画中** |
| Phase 13 | Search / Calendar / Timeline | 後続（Phase 12.5 完了後） |
| Phase 14 | Settings / Privacy / Support | 後続 |
| Phase 15 | Analytics / Monitoring / Cost Controls | 後続 |
| Phase 16 | QA / EAS Build / Store Release | 後続 |
| Phase 17 | Streamlit Admin Dashboard / AI Ops | 後続 |

---

## Phase 12.5 のサブフェーズ分割

Phase 12.5 は規模が大きいため、以下の 6 つのサブフェーズに分割して実装する。

| サブフェーズ | 名称 | 内容 |
|---|---|---|
| **Phase 12.5A** | Planning / Provider Decision | プロバイダ確定・APIキー準備・コスト試算最終確認 |
| **Phase 12.5B** | Data Model / Firestore Schema | PlaceGroup・PlaceCandidate データモデル実装・Firestore Rules 更新 |
| **Phase 12.5C** | Cloud Functions Candidate Retrieval | `enrichNotePlaces` / `getPlaceCandidatesForGroup` 実装・デプロイ |
| **Phase 12.5D** | Candidate Scoring / AI Ranking | スコアリングロジック実装・AI ランキング統合 |
| **Phase 12.5E** | Places UI / User Confirmation | Detail 画面への Places セクション追加・places 画面群実装 |
| **Phase 12.5F** | Map SDK / Pin Plotting | `react-native-maps` 導入・本格ピン表示・EAS Build 対応 |

---

## Phase 8 の再定義

| 変更前 | 変更後 |
|---|---|
| Phase 8: Map / Place Grouping（場所推定含む） | Phase 8: 簡易MapPreview / GPS Grouping（完了）|

**Phase 8 は完了とみなす。** 実装内容:
- React Native View ベースの MapPreview ✅
- 緯度・経度の抽出 ✅
- 約 220m 以内の簡易グループ化 ✅
- 位置情報付き写真のピン表示 ✅

**Phase 8 で未実装だったもの（Phase 12.5 に再定義）:**
- 本格的な Map SDK 表示 → Phase 12.5F
- 施設候補取得・場所名推定 → Phase 12.5C / 12.5D
- ユーザー確認 UI → Phase 12.5E
- AI による場所補助 → Phase 12.5D

---

## Phase 12.5A の実装前チェックリスト

Phase 12.5 の実装を始める前に、以下を人間が確認・承認する必要がある。

- [ ] Google Places API (New) の課金アカウント有効確認
- [ ] `languageCode: 'ja'` での日本語名称返却テスト
- [ ] Foursquare Places との精度比較テスト実施
- [ ] Google Maps ToS / キャッシュルール確認
- [ ] `react-native-maps` vs `expo-maps` (beta) の採用判断
- [ ] EAS Build 設定・`eas.json` の development profile 確認
- [ ] Firebase Secret Manager へ `GOOGLE_PLACES_API_KEY` 追加
- [ ] Google Cloud Console でのAPIキー制限設定

---

## Phase 13 の扱い

Phase 13（Search / Calendar / Timeline）は変更なし。Phase 12.5 完了後に着手する。

Phase 12.5 で場所データが確定することで、Phase 13 の以下機能が強化される:

- 「浅草のノート」のような場所軸での検索
- カレンダービューに場所情報を追加表示
- On This Day に場所名を含めた表示

これらの場所連携は Phase 13 の実装時に別途設計する。

---

## Development Tasks 追加（TASK-0120〜0130）

既存タスクは TASK-0001〜TASK-0116。Phase 12.5 向けとして TASK-0120〜0130 を追加する（TASK-0117〜0119 は予備番号として空ける）。

| Task ID | Phase | タスク | 成果物 | 依存関係 | 優先度 |
|---|---|---|---|---|---|
| TASK-0120 | Phase 12.5A | Place Intelligence プロバイダ選定・APIキー計画 | プロバイダ確定・Google Cloud 設定 | TASK-0090, TASK-0054 | P0 |
| TASK-0121 | Phase 12.5B | PlaceCandidate / PlaceGroup データモデル実装 | Firestore スキーマ・型定義・Rules | TASK-0120, TASK-0012 | P0 |
| TASK-0122 | Phase 12.5C | Place enrichment Cloud Functions 実装・デプロイ | `enrichNotePlaces` / `getPlaceCandidatesForGroup` | TASK-0121, TASK-0054 | P0 |
| TASK-0123 | Phase 12.5A | Places API secret / キー管理設定 | Secret Manager 登録・キー制限設定 | TASK-0120 | P0 |
| TASK-0124 | Phase 12.5C | 候補取得実装（Google Places Nearby Search） | API呼び出し・レスポンス整形・Firestore 保存 | TASK-0122, TASK-0123 | P0 |
| TASK-0125 | Phase 12.5D | 候補スコアリング・AI ランキング実装 | スコアリング関数・AI プロンプト・候補自動選択 | TASK-0124, TASK-0055 | P0 |
| TASK-0126 | Phase 12.5E | ユーザー確認 / 手動修正 UI 実装 | places・places/[id]・manual 画面 | TASK-0125, TASK-0064 | P0 |
| TASK-0127 | Phase 12.5E | Detail 画面への「訪れた場所」セクション追加 | VisitedPlacesSection コンポーネント | TASK-0126 | P0 |
| TASK-0128 | Phase 12.5F | Map SDK 導入・ピン表示実装 | react-native-maps・EAS Build 対応 | TASK-0126, TASK-0048 | P1 |
| TASK-0129 | Phase 12.5A | プライバシー・コスト・利用制限 設計確定 | コスト上限・Rate Limit・ログ方針 | TASK-0120 | P0 |
| TASK-0130 | Phase 12.5E | AI 日記・共有カードへの場所情報連携 | generateMemoryDiary プロンプト更新・shareCard 場所表示 | TASK-0127, TASK-0057, TASK-0085 | P1 |

---

## Reference Map 更新内容

### 追加画面

| Screen ID | 名称 | Route | Phase |
|---|---|---|---|
| SCR-PLACE-001 | 訪れた場所一覧 | `/(app)/notes/[noteId]/places` | 12.5E |
| SCR-PLACE-002 | 場所候補確認 | `/(app)/notes/[noteId]/places/[placeGroupId]` | 12.5E |
| SCR-PLACE-003 | ノート地図（Map SDK） | `/(app)/notes/[noteId]/map` | 12.5F |
| SCR-PLACE-004 | 手動場所編集 | `/(app)/notes/[noteId]/places/manual` | 12.5E |

### 更新画面

| Screen ID | 変更内容 |
|---|---|
| SCR-MAP-001 | Phase 8 の簡易 MapPreview から Phase 12.5F の本格 Map SDK に移行予定。実装は `SCR-PLACE-003` に統合。Phase 8 完了扱い。 |

---

## 実装優先順

```
Phase 12.5A（プロバイダ選定）
  ↓
Phase 12.5B（データモデル）
  ↓
Phase 12.5C（Cloud Functions）
  ↓
Phase 12.5D（スコアリング）
  ↓
Phase 12.5E（UI）
  ↓
Phase 12.5F（Map SDK） ← Phase 13 と並行可能
```

Phase 12.5F（Map SDK）は他の機能に依存しないため、Phase 13 と並行して進めることも可能。ただし EAS Development Build が必要になるため、ビルド設定の準備を先に行う。

---

## Codex への実装依頼順（推奨）

Phase 12.5B を実装依頼する場合の渡す情報:

```
画面ID: なし（バックエンドのみ）
実装内容: PlaceGroupDoc / PlaceCandidateDoc の型定義 + Firestore Rules 追加
入力: docs/phase12_5_place_intelligence/03_data_model.md
参照: firebase/firestore.rules（既存）
出力: src/core/repositories/placeGroupRepository.ts（新規）
      firebase/firestore.rules（更新）
権限制約: owner/editor が CRUD, viewer は read のみ
受け入れ条件: npx tsc --noEmit が通る / npx expo lint が通る
```
