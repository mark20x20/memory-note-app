# UI-9 Next Steps

## 完了確認チェックリスト

- [x] share.tsx のデフォルトフォーマットが `portrait` (4:5) になっている
- [x] フォーマットセレクター (1:1 / 4:5 / 9:16) が表示される
- [x] カードプレビューが表示される (ShareCardPreview)
- [x] カードにメイン写真が表示される (PhotoCollage)
- [x] カードにタイトルが表示される (fontSize: 20)
- [x] カードに日付が表示される
- [x] カードに場所概要が表示される (visitedPlacesSummary.areaLabel または topPlaceLabels[0])
- [x] カードに AI日記/メモ抜粋が表示される
- [x] カードに写真枚数が表示される
- [x] カードにブランド名 "Memory Note" が表示される
- [x] サブタイトル "思い出をきれいにまとめる" が表示される
- [x] 「画像を保存」ボタンが動作する (MediaLibrary)
- [x] 「共有する」ボタンが動作する (Sharing)
- [x] エラー / 成功バナーが表示される
- [x] preview.tsx → share.tsx 導線が確認済み
- [x] share.tsx → back() 戻り導線が確認済み
- [x] TypeScript Exit 0
- [x] Expo lint Exit 0

---

## 次フェーズ候補

### UI-10: Share Card に mini map を追加

- share card 内に地図 (位置情報) を埋め込む
- EventMapPreview の静止画版を captureRef 対象の View 内に配置
- visitedPlacesSummary.topPlaceLabels の位置を MapView で表示

### UI-11: Card Information Controls

- title / date / place / diary on/off トグルを追加
- 仕様書 Section 3 の対応
- preview が動的に切り替わる

### UI-12: AI日記再生成を preview.tsx に追加 (旧 UI-9 next step)

- canGenerateAiDiary gating
- AiDiarySection コンポーネントの移植

### AI Diary Regeneration path (残件)

- 現在 index.tsx (redirect) → preview.tsx で AI 再生成の導線がない
- edit.tsx 経由が現状の唯一のパス
- preview に「AI日記を生成」ボタンを追加するか、edit の AI タブを改善する
