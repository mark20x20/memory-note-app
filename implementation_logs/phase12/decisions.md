# Phase 12 Decisions — SNS Share Card

## D1: ローカル View キャプチャ方式を採用

**決定:** Cloud Functions での画像生成や Firebase Storage への保存を行わず、端末上の View を `react-native-view-shot` でキャプチャする最小実装を採用した。

**理由:**
- Phase 12 スコープ内で完結する。Cloud Functions 追加・デプロイ不要。
- Expo Go でそのまま動作する。
- 端末側で生成するため Firebase コスト発生なし。
- 画像のクォリティは `quality: 0.92` で十分な SNS 投稿品質。

---

## D2: フォーマット 3種（square / portrait / story）

**決定:** 1:1, 4:5, 9:16 の 3 フォーマットを `ShareCardFormat` 型として定義し、フォーマットセレクターで切り替える。

**理由:**
- Instagram フィード（1:1/4:5）・ストーリー（9:16）を主要ターゲットとする。
- フォーマットごとにカード高さ (`cardWidth / aspectRatio`) を算出して同じ Preview コンポーネントに渡す設計で実装を統一できる。

---

## D3: ShareCardPreview を forwardRef コンポーネントに

**決定:** `ShareCardPreview` に `React.forwardRef<View, Props>` を使い、外部から `cardRef` を渡して `captureRef` でキャプチャできるようにした。

**理由:**
- `useShareCardCapture` フックが `cardRef` を管理し、Share 画面から hook の ref をそのまま渡せる。
- hook と component の責務を分離できる。

---

## D4: `collapsable={false}` を captureRef の View に設定

**決定:** `ShareCardPreview` の最外 View に `collapsable={false}` を付与した。

**理由:**
- Android では RN が空のビューを最適化して省略する場合があり、`captureRef` が失敗する。
- `collapsable={false}` で View を確実に DOM ツリーに残す。

---

## D5: expo-media-library plugin を app.json に追加

**決定:** `app.json` の `plugins` に `expo-media-library` を追加した（iOS: photosPermission / savePhotosPermission, isAccessMediaLocationEnabled: false）。

**理由:**
- Expo の managed workflow では、写真ライブラリアクセス権限の説明文を `app.json` で設定する必要がある。
- `isAccessMediaLocationEnabled: false` は共有カードの位置情報埋め込みが不要なため。

---

## D6: 権限制御 — owner / editor / viewer すべてアクセス可能

**決定:** 共有カード画面は閲覧できるユーザー全員（owner / editor / viewer）が開ける。権限チェックはしない。

**理由:**
- 共有カードは公開前提の SNS 投稿用コンテンツ。閲覧権限のあるユーザーが SNS 共有しても問題ない。
- Phase 15 以降で制限が必要になった場合に `canView` チェックを追加できる設計にしてある。

---

## D7: テキストコンテンツ優先順位: aiDiary > memo > プレースホルダー

**決定:** `ShareCardPreview` 内でテキストコンテンツを `aiDiary → memo → プレースホルダー` の優先順で選択する。

**理由:**
- AI 日記は文章として完成度が高く SNS 向き。
- AI 日記がない場合でもメモがあれば表示する。
- どちらもない場合は「思い出の記録」のみ表示してクラッシュしない。

---

## D8: 写真コラージュのレイアウト

**決定:** `PhotoCollage` コンポーネントで枚数別レイアウト（1枚: 全面, 2枚: 左右, 3枚: 大+小2, 4枚以上: 2x2グリッド+N）を実装。

**理由:**
- SNS 映えする自然なコラージュを、外部ライブラリなし（View + Image のみ）で実現。
- 4枚を超える場合は +N オーバーレイで枚数を伝える。
- 0枚でも placeholder を表示してクラッシュしない。

---

## D9: 共有キャンセルをエラーとして扱わない

**決定:** `captureAndShare` でユーザーが OS 共有シートをキャンセルした場合はエラーメッセージを出さない。

**理由:**
- キャンセルは正常な操作。エラー表示は不要でユーザー体験を損なう。
- `error.message` に 'cancel' が含まれる場合のみスキップする。
