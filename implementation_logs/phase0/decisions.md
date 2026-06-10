# Phase 0 技術決定メモ

## 実施日
2026-06-10

---

## 決定事項

### 1. プロジェクトテンプレート: blank-typescript を選択
- **理由**: tabs テンプレートは不要なファイルが多く、構成の自由度が低い
- **影響**: Expo Router を手動設定する必要があったが、目的に沿った構成にできた

### 2. --legacy-peer-deps の使用
- **理由**: expo-router 56.2.9 が内部で react-dom@19.2.7 を要求するが、インストール済みの react@19.2.3 との minor version 不一致が起きた
- **内容**: zustand, zod, react-hook-form, dayjs のインストールに `--legacy-peer-deps` を使用
- **リスク**: 低。Expo SDK の既知の内部依存問題。実際の実行には影響しない
- **対応**: npm の既知の警告。Expo 56 の次マイナーバージョンで解消見込み

### 3. src/ の構造を spec 準拠の feature-based に設定
- **理由**: Phase 1 以降で Firebase 接続を追加しやすくするため
- **変更点**: `src/shared/`, `src/core/`, `src/features/`, `src/types/`, `src/utils/` に分割

### 4. firebase/ のスタブを "全拒否 rules" で作成
- **理由**: 誤って開発環境から本番 Firebase に書き込まないよう安全デフォルト
- **内容**: `allow read, write: if false;` でロック
- **Phase 1 で**: 認証・権限ベースの Rules に更新する

### 5. env.ts を静的 ENV オブジェクトに変更
- **理由**: Expo の `expo/no-dynamic-env-var` lint ルールに違反した
- **変更内容**: `process.env[key]` の動的アクセスを避け、静的な `process.env.EXPO_PUBLIC_xxx` に変更
- **影響**: Phase 1 で Firebase 接続時は ENV.FIREBASE_API_KEY などで参照する

### 6. @expo/vector-icons は別途インストール不要と判断
- **理由**: expo SDK に同梱されている。単独でインストールすると react-dom の peer 依存衝突が発生した
- **使用方法**: `import { Ionicons } from '@expo/vector-icons'` でそのまま使用できる

### 7. expo start の完全実行をスキップ
- **理由**: WSL2 環境ではデバイス/エミュレータへの接続が不可
- **代替確認**: `npx tsc --noEmit` と `npx expo lint` で構文・型の正確性を確認
- **Windows での起動方法**: PowerShell で `cd memory-note-app && npx expo start` を実行
