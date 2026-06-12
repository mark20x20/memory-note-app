# Phase 12 Issues — SNS Share Card

## I1: story フォーマット (9:16) でカードが画面に収まらない場合がある

**状況:** story フォーマットは cardWidth / (9/16) = cardWidth × 16/9 の高さになる。画面幅 375px のデバイスでは高さ約 556px となり、ScrollView 内にカードが収まる。フォーマットセレクターとボタンも画面内に表示される。

**対応:** ScrollView で縦スクロールできるため、カードは必ず表示される。問題なし。

---

## I2: Expo Go での react-native-view-shot 動作確認が必要

**状況:** `react-native-view-shot` はネイティブモジュールを使う。Expo Go では SDK に含まれていないと動作しない場合がある。

**対応:** SDK 54 向け `expo install` でインストール済み（v4.0.3）。Expo Go で動作しない場合は EAS Development Build を使う。その場合は `implementation_logs/phase12/next_steps.md` の手順に従う。

---

## I3: Android での `captureRef` 失敗リスク

**状況:** Android ではビューが最適化されて省略される場合があり、`captureRef` が null ビューを参照してしまう。

**対応:** `ShareCardPreview` の最外 View に `collapsable={false}` を設定済み。それでも失敗する場合は `androidLayerType="software"` を追加する。

---

## I4: iOS の写真ライブラリ権限ダイアログのタイミング

**状況:** iOS では `MediaLibrary.requestPermissionsAsync()` を呼んだタイミングで権限ダイアログが表示される。初回のみ。

**対応:** `captureAndSave` の先頭で毎回 `requestPermissionsAsync()` を呼ぶ実装にしており、許可済みなら即時 `granted` が返る。ユーザー体験上の問題なし。

---

## I5: 共有画像の解像度

**状況:** `captureRef` はデバイスのピクセル密度（dpr）に応じた解像度で出力する。Retina ディスプレイ（dpr=3）では表示幅 335px × dpr3 = 1005px の実解像度画像が生成される。

**対応:** `captureRef` に `snapshotContentContainer: true` は不要（ScrollView を capture しないため）。現状の出力でほとんどの SNS 用途に対応できる。より高解像度が必要な場合は `format: 'png'` + `quality: 1` を検討する。

---

## I6: expo-sharing が利用できない環境

**状況:** iOS シミュレータや一部 Android エミュレータでは `Sharing.isAvailableAsync()` が `false` を返す場合がある。

**対応:** `isAvailableAsync()` が `false` の場合は `Alert.alert` で通知する実装にしている。

---

## I7: 写真が Firebase Storage URL の場合、capture 前に完全に描画されていない場合がある

**状況:** `Image` コンポーネントが Firebase Storage の URL を読み込む際、非同期でキャッシュが完了する前に `captureRef` を呼ぶと写真が空白になる場合がある。

**対応:** 現実装では「写真を読み込み中...」のローディング中はボタンを非表示にしていないが、ユーザーが写真をプレビューで確認してからボタンを押すフローのため、実使用上は問題少ない。Phase 15 以降でプリロード完了後に capture を行う改善を検討する。
