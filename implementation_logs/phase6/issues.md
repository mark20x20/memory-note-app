# Phase 6 Known Issues

## I1: expo-image-picker は手動インストールが必要

**状況:** bash環境にnpxがないため、インストールを自動実行できなかった。

**対処:** ユーザーがPowerShellで以下を実行すること:
```powershell
cd C:\Users\Masaki\memory_note_agent_system\memory-note-app
npx expo install expo-image-picker
```

## I2: Expo Go での EXIF 取得はデバイスと OS バージョン依存

**状況:** `exif: true` を指定しても、Expo Go 上では EXIF が取れないケースがある（iOS シミュレータ、Android エミュレータで特に発生しやすい）。

**対処:** Phase 6 では EXIF が取れない場合は `takenAt: null` / `latitude: null` として扱う。実機での確認を推奨。

## I3: GPS 符号（N/S/E/W）未処理

**状況:** `GPSLatitudeRef` = "S" の場合は緯度が負になるが、未処理。

**対処:** Phase 8 の地図実装時に符号変換ロジックを追加する（`decisions.md` D6 参照）。

## I4: allowsMultipleSelection が Expo Go (iOS) で動作しない場合がある

**状況:** Expo SDK 54 の iOS Expo Go では、`allowsMultipleSelection: true` が正常に動作しないバージョンがある（iOS 限定の制限）。

**対処:** EAS Build / 開発ビルドでの確認を推奨。Expo Go での確認は参考程度とする。

## I5: 写真サムネイルは選択セッション間で永続化されない

**状況:** Create 画面を離れると `photos` ステートがリセットされる。

**対処:** Phase 6 では Create 画面はステートフルなフローとして扱う。永続化は Phase 7 (Storage アップロード) と同時に検討する。
