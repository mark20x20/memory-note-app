# UI-23 Settings Screen Polish — 次のステップ

## 完了した画面

- Onboarding ✓ (UI-18)
- Home ✓ (UI-19)
- Create ✓ (UI-20)
- Preview ✓ (UI-21)
- Edit ✓ (UI-22)
- Settings ✓ (UI-23)

## 主要画面のポリッシュ完了

UI-18 〜 UI-23 で全主要画面が warm / calm / photo-first デザインに統一されました。

## 次の作業候補

### 機能実装 (UI polish 以外)

#### プロフィール編集
- `displayName` / `photoURL` の変更
- Firebase Auth `updateProfile` を使用
- Settings 画面の Profile Card から導線

#### 外部リンク実装
- 利用規約 / プライバシーポリシー / お問い合わせ
- `Linking.openURL` または WebView
- URL が決定したら "準備中" バッジを削除

#### 権限設定リンク
- iOS: `Linking.openURL('app-settings:')` でシステム設定アプリへ
- 写真・位置情報の権限確認

### さらなるポリッシュ候補

#### UI-24: Calendar Screen Polish
- `app/(app)/calendar.tsx` の warm 化
- ノートカードのサムネイル表示

#### UI-25: Map Screen Polish
- `app/(app)/notes/[noteId]/map.tsx` の warm 化
- EventMapPreview の写真統合

#### UI-26: Share Card Screen Polish
- `app/(app)/notes/[noteId]/share-card.tsx` の仕上げ
