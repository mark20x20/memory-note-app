# Phase 12.5H-5 Decisions

## walking/driving を先に実装する理由

1. **API 複雑性**: transit（TRANSIT）は Google Routes API でも対応可能だが、
   乗換ステップ（transit legs）の詳細表示が walking/driving とは別の UI設計が必要。
2. **段階リリース**: まず単純な2モードを動かしてインフラを検証し、
   transit は Phase 12.5H-6 で別フェーズとして追加することで、
   問題の切り分けがしやすい。
3. **コスト管理**: transit は乗換検索を含むため別の API コストが発生する可能性がある。

## transit を後回しにする理由

- TRANSIT モードは乗換ステップの UI（路線・乗換案内）が別途必要
- Google Routes API の TRANSIT レスポンスには legs/steps が含まれ、
  walking/driving とは別のパース・表示ロジックが必要
- Phase 12.5H-6 で TRANSIT 専用のルートカードとして実装する予定

## Route API 結果を segment ごとに保存する理由

1. **部分更新**: 1区間だけ座標が変わった場合に、その区間だけ再生成できる
2. **キャッシュ粒度**: 区間ごとに expiresAt / status を管理でき、
   一部失敗しても他は保持できる
3. **読み取り効率**: `getNoteRouteSegments` で必要な区間だけ取得できる

## API 失敗時も他 segment を継続する理由

- 1区間の API エラーで全体を失敗にすると、
  成功した区間のキャッシュが無駄になる
- 失敗区間は `status: 'failed'` として保存し、次回 generateNoteRoutes 実行時に
  再生成（stale 判定で再試行）できる
- UI 側でも「失敗区間は直線フォールバック表示」として自然に扱える

## Premium 判定を仮実装にする理由

- RevenueCat 連携（Phase 12.5H-7）がまだ完了していない
- 開発・テスト段階で Routes API を呼べないと実ルート生成の動作確認ができない
- `isPremiumUser = true` のハードコードは TODO コメントで明示し、
  本番リリース前に必ず置き換えることを文書化した

## routeGenerationStatus を map.tsx ローカルステートで管理する理由

- ルート生成はユーザーが明示的にボタンを押したときだけ実行する一時的な操作
- Firestore リアルタイムリスナーではなく callable の呼び出し結果を追跡するだけでよい
- グローバルステート管理（Context/Redux 等）は過剰な抽象化になる
