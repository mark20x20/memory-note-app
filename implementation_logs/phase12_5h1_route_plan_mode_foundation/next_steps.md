# Phase 12.5H-1 Next Steps

## 実機確認

- Map画面のルートモードUI確認
  - 直線チップを選択 → Polyline 破線が表示されているか
  - 直線モード時に「訪問順を線で表示しています。」注記が出るか
  - 徒歩/車/公共交通チップを選択 → Premium案内カードが出るか
  - 「今は直線ルートで表示」ボタンで直線モードに戻るか
  - チップのスクロールが横方向に動くか

- EventMapPreview の確認
  - ノート詳細の地図プレビューに「訪問順を線で表示」テキストが出るか（2件以上の場合）
  - テキストが邪魔にならず控えめに見えるか
  - 「地図で見る」リンクの位置が右端に正しく出るか

## 将来の実装事項

- Cloud Functions 経由の Google Routes API 設計
  - トリガー: PlaceGroup 確定時 / 手動要求
  - ルート生成結果を Firestore の route_segments サブコレクションにキャッシュ
  - TTL / 再生成ポリシーの設計

- ルート結果のFirestoreキャッシュ設計
  - `memory_notes/{noteId}/route_segments/{segmentId}` スキーマ設計
  - `VisitRouteSegment` 型の Firestore 保存・読み取り実装

- サブスク判定設計
  - RevenueCat / App Store Subscription の統合
  - `isPremiumUser` を実際のサブスク状態に差し替え
  - プレミアムモード時に実ルートを取得・表示

- EAS Build / Android 実機確認
  - ルートモードUIの Android レイアウト確認
  - Android Map での Polyline 描画確認
