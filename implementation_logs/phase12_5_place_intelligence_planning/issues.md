# Phase 12.5 Place Intelligence Planning — Issues

## I1: Google Places API プロバイダの日本語精度が未確認

**状況:** `languageCode: 'ja'` パラメータを指定した場合に、日本語の施設名が正しく返されるか実際に確認していない。特に小規模カフェ・地方の観光地での品質は未知数。

**影響:** 日本語名称が返らない場合、UI 表示で英語名称が混在する可能性がある。

**対応方針:** Phase 12.5A で実際に API を叩いてテストする。Foursquare との比較テストを実施する。

---

## I2: Google Maps Platform ToS のキャッシュルール変動リスク

**状況:** Google は 2024年に ToS を改定し、キャッシュ期間の上限が変更された。今後も変更される可能性がある。

**対応方針:** `fetchedAt` フィールドと設定可能なキャッシュ期間変数で管理し、ToS 変更時に対応しやすくする。Phase 12.5A で最新 ToS を確認する。

---

## I3: react-native-maps と expo-maps (beta) の選定が未確定

**状況:** `react-native-maps` は実績が多いが EAS Build 必須。`expo-maps` は Expo SDK 51+ で実験的サポートで Expo Go でも動く可能性があるが beta。

**影響:** Phase 12.5F の EAS Build 必要性とテスト環境に影響する。

**対応方針:** Phase 12.5A で最新の expo-maps の対応状況を確認してから採用を決定する。基本的には `react-native-maps` を第一候補とする。

---

## I4: GPS 精度による候補取得精度のばらつき

**状況:** 屋内・高層ビル周辺・地下施設では GPS が 100m 以上ずれることがある。Nearby Search の半径を 200m に設定した場合、実際の場所が範囲外になるリスクがある。

**対応方針:** confidence が低い場合は自動確定せず `needsUserConfirmation=true` とする。半径設定を調整可能なパラメータにする（Phase 12.5C）。

---

## I5: 観光地密集エリアでの候補多重マッチ問題

**状況:** 浅草・京都・原宿など観光スポットが密集したエリアでは、同程度の候補が多数出てくる可能性がある。AIが1件に絞りにくい。

**対応方針:** `needsUserConfirmation=true` を積極的に使い、候補一覧画面でユーザーが選ぶフローに誘導する。

---

## I6: GPS なし写真が多いノートでの動作

**状況:** スクリーンショット・加工済み写真には GPS がない。GPS ありの写真が 0 枚の場合、場所推定を実行できない。

**対応方針:** GPS ありの写真が 0 枚の場合は `enrichNotePlaces` を早期リターン（`status: 'no_gps_data'`）し、UI に「このノートには GPS データのある写真がありません」を表示する。

---

## I7: API コスト超過リスク

**状況:** 1ユーザーが短時間に多数のノートを作成した場合、Places API コストが急増する可能性がある。

**対応方針:** 1ユーザー/日 10回、プロジェクト全体 50,000 リクエスト/日の上限を設ける。Cloud Console でハードリミットを設定する。

---

## I8: Phase 8 の PlaceGroup 型との名前衝突

**状況:** `src/features/map/types/index.ts` に既に `PlaceGroup` 型が定義されている。Phase 12.5B で Firestore 用の `PlaceGroupDoc` を追加する際に名前が紛らわしくなる。

**対応方針:** Phase 12.5B の実装時に既存の `PlaceGroup` を `LocalPlaceGroup` にリネームするか、Firestore 用を `PlaceGroupDoc` という命名で分離するかを決定する（既存コードへの影響を最小化する方を選ぶ）。

---

## I9: Android の EXIF GPS 符号処理（南半球・西経）

**状況:** Phase 8 の `implementation_logs/phase8/issues.md` (I5) で指摘されていた。N/S/E/W の符号変換が Android で正しく動作しているか未確認。日本国内（北緯・東経）では問題が出ていないが、海外撮影の写真では問題になる可能性がある。

**対応方針:** Phase 12.5B のデータモデル確認時に既存の latitude/longitude の符号を検証する。必要なら `locationUtils.ts` の GPS 正規化処理を修正する。

---

## I10: 候補データのキャッシュと Firestore コスト

**状況:** PlaceGroup × 3件 + candidates × 5件 × 3 = 18 ドキュメント。ノートが増えるにつれて Firestore 読み取りコストが増加する。

**対応方針:** Detail 画面では `visitedPlacesSummary` のみを NoteDoc から読む（candidates サブコレクションは places 画面を開いたときのみロード）。Firestore 読み取りの最適化は Phase 12.5E で対応する。
