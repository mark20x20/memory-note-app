# Phase 12.5F-1 Map SDK / Numbered Pins — Next Steps

## フェーズ完了条件

Phase 12.5F-1 は以下がすべて完了した時点で完了とみなす。

- [x] `react-native-maps` が導入されている
- [x] `app/(app)/notes/[noteId]/map.tsx` が作成されている
- [x] Marker に `#1`, `#2` の番号が表示される
- [x] 下部カードにも同じ番号が表示される
- [x] Detail画面（VisitedPlacesSection）から「地図で見る」でMap screenへ遷移できる
- [x] Places一覧からもMap screenへ遷移できる
- [x] 位置情報なし / PlaceGroupなし の空状態が表示される
- [x] 確認済み / 要確認 バッジが表示される
- [x] 簡易旅順プレビューが表示される
- [x] MapPreview は削除されていない
- [x] AIランキングは実装していない
- [x] Text Search fallback は実装していない
- [x] Functions は変更していない
- [x] Firebase deploy は実行していない
- [x] `npx tsc --noEmit` が Exit 0
- [x] `npx expo lint` が Exit 0
- [x] 実装ログが作成されている

---

## Step 1: 実機テスト（人間が実施）

1. `npx expo start` でアプリを起動（iPhone 実機 + Expo Go）
2. ノート詳細画面を開く
3. 「訪れた場所」セクションに「地図で見る」リンクがあることを確認
4. 「地図で見る」タップ → Map 画面へ遷移することを確認
5. 地図上に `#1`, `#2`, `#3` ... の番号付きピンが表示されることを確認
6. 下部カードに同じ番号・場所名・カテゴリタグ・確認バッジが表示されることを確認
7. カードタップ → 候補確認画面へ遷移することを確認
8. 旅順プレビューが縦タイムラインで表示されることを確認
9. 場所がない場合の空状態を確認
10. 「訪れた場所」一覧画面にも「地図で見る」ボタンがあることを確認

---

## Step 2: Android テスト（EAS Build 後）

Phase 12.5F-2 以降:

1. EAS Development Build のセットアップ
2. Google Maps API key の設定（EAS Secret 経由）
3. Android 実機で地図表示確認
4. `app.json` に `android.config.googleMaps.apiKey` を追加

---

## Step 3: 旅順の精度向上（将来）

```
Phase 12.5G: 撮影時刻ベースの旅順

- PlaceGroupDoc に startAt / endAt を追加
- Cloud Functions の enrichNotePlaces で写真撮影時刻を集計
- map.tsx の旅順プレビューを startAt 昇順に変更
- ルート線描画（MapView Polyline）の検討
```

---

## Step 4: fitToCoordinates 実装（将来）

Map 画面で全ピンが自動フィットするよう:

```typescript
const mapRef = useRef<MapView>(null);
// onLayout または onMapReady で:
mapRef.current?.fitToCoordinates(coordinates, {
  edgePadding: { top: 60, right: 40, bottom: 300, left: 40 },
  animated: true,
});
```
