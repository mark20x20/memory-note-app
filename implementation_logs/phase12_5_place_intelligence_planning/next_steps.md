# Phase 12.5 Place Intelligence Planning — Next Steps

## 次に実装するフェーズ: Phase 12.5A

---

## Phase 12.5A: プロバイダ決定・事前準備

### 実施内容

実装を開始する前に、以下を人間が確認・実施する必要がある。

### 1. Google Places API のテスト

```bash
# Cloud Shell または curl でテスト
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: YOUR_KEY" \
  -H "X-Goog-FieldMask: places.id,places.displayName,places.types,places.location,places.rating" \
  "https://places.googleapis.com/v1/places:searchNearby" \
  -d '{
    "locationRestriction": {
      "circle": {
        "center": {"latitude": 35.7148, "longitude": 139.7967},
        "radius": 200.0
      }
    },
    "maxResultCount": 5,
    "languageCode": "ja"
  }'
```

確認ポイント:
- `displayName.text` が日本語で返ってくるか
- `types` の内容（tourist_attraction / restaurant 等）
- 期待通りの施設（例: 浅草寺周辺なら「浅草寺」が上位に来るか）

### 2. Firebase Secret Manager への APIキー追加

```bash
cd memory-note-app/firebase/functions
npx firebase functions:secrets:set GOOGLE_PLACES_API_KEY
# → キーを入力
```

### 3. Google Cloud Console でのキー制限設定

Google Cloud Console → Credentials → 対象のAPIキー:
- アプリケーション制限: IP アドレスの制限（Cloud Functions のIP）
- API 制限: Places API (New) のみ有効化
- 1日の上限: Cloud Console の Quotas で設定

### 4. EAS Build 設定確認（Phase 12.5F 向け先行準備）

```bash
cat eas.json
# development profile が存在するか確認
```

---

## Phase 12.5B の実装プロンプト（次の Claude Code セッション向け）

Phase 12.5A の準備が完了したら、以下を Claude Code に渡して実装を依頼する。

```
Phase 12.5B: Data Model / Firestore Schema を実装してください。

参照ドキュメント:
- docs/phase12_5_place_intelligence/03_data_model.md

実装内容:
1. src/features/map/types/index.ts に PlaceGroupDoc / PlaceCandidateDoc / VisitedPlacesSummary 型を追加
   （既存の PlaceGroup 型は LocalPlaceGroup にリネームを検討）
2. src/core/repositories/placeGroupRepository.ts を新規作成
   - subscribePlaceGroupsByNoteId (onSnapshot)
   - getPlaceGroupById
   - createPlaceGroup
   - updatePlaceGroup
   - deletePlaceGroupsForNote (Phase 12.5C の削除連鎖用)
3. firebase/firestore.rules を更新
   - place_groups サブコレクション追加
   - candidates サブコレクション追加
   - owner/editor が CRUD, viewer は read のみ

完了条件:
- npx tsc --noEmit が Exit 0
- npx expo lint が Exit 0
- firebase/firestore.rules が文法エラーなし
```

---

## Phase 12.5C〜F の実装プロンプトは以下を参照

```
docs/phase12_5_place_intelligence/04_cloud_functions_api_design.md
docs/phase12_5_place_intelligence/05_candidate_scoring_and_ai_ranking.md
docs/phase12_5_place_intelligence/06_ui_flow.md
```

---

## Firebase デプロイ（Phase 12.5B 完了後）

```bash
cd memory-note-app

# Firestore Rules のみデプロイ
npx firebase-tools deploy --only firestore:rules --project <project-id>

# Functions 追加後（Phase 12.5C 完了後）
npx firebase-tools deploy --only functions --project <project-id>
```

---

## Phase 12.5 全体の完了定義

| サブフェーズ | 完了条件 |
|---|---|
| 12.5A | プロバイダ確定・APIキー準備完了 |
| 12.5B | PlaceGroupDoc 型定義・Repository・Firestore Rules 更新完了 / tsc + lint 通過 |
| 12.5C | `enrichNotePlaces` / `getPlaceCandidatesForGroup` デプロイ完了 / 実機テスト通過 |
| 12.5D | スコアリング + AI ランキング実装完了 / confidence 値が期待通り |
| 12.5E | places / places/[id] / manual 画面実装完了 / Detail に場所セクション表示 |
| 12.5F | react-native-maps でピン表示・EAS Build 成功 |

---

## Phase 11 の Firebase デプロイリマインダー

Phase 12.5B の前に、**Phase 11 の未デプロイ変更を先にデプロイする**ことを推奨。

```bash
# Phase 11 の Functions + Rules（まだデプロイしていない場合）
npx firebase-tools deploy --only functions,firestore:rules,storage --project <project-id>
```
