# Phase 8 Next Steps — Map / Place Grouping

## Phase 9 への引き継ぎ

### 必須確認事項（Phase 9 着手前）

1. **TypeScript / Lint チェック**（ユーザー PowerShell で実行）
   ```powershell
   cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
   npx tsc --noEmit
   npx expo lint
   ```

2. **Expo Go 手動確認フロー**
   ```
   ログイン → Home → 位置情報付き写真があるノートを開く
   → Detail → カバー写真表示 → 写真グリッド表示
   → 地図セクションに MapPreview 表示 → ピンが表示される
   → 位置情報なし写真だけのノートを開く → empty 表示確認
   ```

3. **Firebase Rules デプロイ**（未実施の場合）
   ```powershell
   npx firebase-tools deploy --only firestore:rules,storage --project <project-id>
   ```

### Phase 9 実装内容（AI 日記生成）

- Cloud Functions (Firebase) の設定
- OpenAI API 呼び出し
- 写真・場所・日付から短文日記の自動生成
- AI日記の Firestore 保存と Detail 画面への反映
- AI日記プレースホルダー（`diaryCard`）を実データに置き換え

### Phase 10 推奨事項

- `react-native-maps` または `expo-maps` の導入（MapPreview コンポーネントを SDK ベースに置き換え）
- Image Compression（`expo-image-manipulator`）
- GPS 符号処理（GPSLatitudeRef/GPSLongitudeRef）の本格確認
- Reverse Geocoding（場所名推定）
- 写真削除フロー

### Phase 11 推奨事項

- 共有ノートの Storage メンバー読み取り権限
- メンバー管理 UI

## MapPreview コンポーネントの SDK 置き換え方針

Phase 10 以降で `react-native-maps` を導入する際：

1. `src/features/map/components/MapPreview.tsx` の内部実装を SDK ベースに書き換える
2. Props インターフェース（`locations: PhotoLocation[], height?: number`）は変更不要
3. `locationUtils.ts` の `groupNearbyLocations()` は引き続き使用可能（SDK 側の clustering も選択肢）
4. Detail 画面側 (`[noteId].tsx`) は変更不要

## 技術的負債

- `MapPreview.tsx` の `as unknown as number` 型キャスト（I7）→ React Native の DimensionValue 改善後に修正
- `groupNearbyLocations()` の閾値（0.002度）はユーザーテスト後に調整可能
