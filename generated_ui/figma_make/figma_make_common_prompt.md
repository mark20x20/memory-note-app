# Figma Make 共通プロンプト — Memory Note / 思い出ノート

> **このファイルは Figma Make を使う場合の任意資料です。**
> Figma Make が使えない場合は、`ui_design_system.md` と `reference_map.md` を参照して直接 React Native 実装を進めてください。
> Figma Make を使わなくても Phase 5 以降へ進めます。

## 1. アプリ概要

**アプリ名**: Memory Note / 思い出ノート  
**用途**: 写真を選ぶだけで、AI が地図付きの思い出ノートを自動生成する日本向けモバイルアプリ  
**ターゲット**: iOS / Android スマートフォン

---

## 2. 共通ベースプロンプト（Figma Make に貼る完成形）

以下をFigma Makeの「共通指示」または各画面プロンプトの先頭に必ず貼ってください。

```
Japanese mobile app UI for "Memory Note / 思い出ノート" — a polished real product screen for a memory notebook app where users capture photos and get AI-generated travel diaries with maps.

Design style:
- 9:16 smartphone screen (iPhone 16 frame or Android standard frame)
- Warm cream background (#FAF7F2)
- Coral main accent color (#F26B5B) — used only for primary buttons, active states, and key highlights
- Teal map/location accent (#4FA8A1) — used only for map pins, location chips, and spot-related elements
- Pure white rounded cards with subtle warm shadows
- Clean spacing with generous padding (20px screen edges, 16px card padding)
- Card border radius: 16px
- Button border radius: 12px
- Soft shadow: rgba(46,42,39,0.08) blur 8px offset 0,2
- Japanese text UI — all labels, titles, and descriptions in natural Japanese
- Not wireframe, not illustration, not placeholder mockup
- Realistic polished app screen with actual content
- Not dark mode
- Not neon colors
- Not social media feed (no likes, followers, comments count)
- Not travel booking app (no prices, star ratings, booking buttons)
- Not futuristic AI dashboard
- Not map navigation app

Typography:
- Screen title: 20px bold
- Section heading: 18px semibold
- Card title: 16px semibold
- Body text: 15px regular
- Sub info: 13px regular muted
- Chip/badge: 12px medium
- Footer hint: 11px regular muted

Color tokens:
- Background: #FAF7F2 (warm cream)
- Card surface: #FFFFFF (pure white)
- Ivory surface: #F4EEE6
- Primary (coral): #F26B5B
- Primary light: #FEF0EE
- Map accent (teal): #4FA8A1
- Map accent light: #E6F4F3
- Text primary: #2E2A27
- Text secondary: #7A746D
- Text tertiary: #B8AD9F
- Border: #E8DED4
```

---

## 3. 画面分類別の追加プロンプト

各画面を生成する際は、上記の共通プロンプトに以下を付け加えてください。

### ホーム / ノート一覧（SCR-HOME-001）

```
Home screen showing a list of memory note cards. Each card shows: cover photo, note title, date chip, location chip (teal), photo count badge. Header with app title and settings icon. FAB (coral circle) at bottom right for creating new note. Bottom navigation bar (5 tabs: ホーム / 地図 / 作成 / カレンダー / 設定). Scrollable note card list with generous spacing.
```

### ホーム空状態（SCR-HOME-002）

```
Home screen empty state. Center-aligned hero section with a warm illustration or large emoji (📷 or 📖). Encouraging Japanese title like "最初の思い出を作りましょう". Short description text. Large coral CTA button "最初の思い出を作る". Below: "できること" feature hint cards showing map, sharing, SNS card features in ivory rounded cards.
```

### 作成開始（SCR-CREATE-001）

```
Note creation start screen. Hero section with creation prompt. 3-step progress card: (1)写真を選ぶ (2)AIが整理する (3)ノートが完成 — each step with emoji icon, title, description. Note type selector: 個人ノート (active, coral border) / 共有ノート (dimmed). Large coral button "写真を選ぶ" at the bottom.
```

### 写真選択（SCR-CREATE-002）

```
Photo picker screen. Grid of photo thumbnails (3 columns). Selected photos highlighted with coral checkmark overlay. "選択中: X枚" counter chip at top. Multiple selection enabled. Confirm button "この写真で作成" at bottom. Clean grid layout with 2px gaps between photos.
```

### アップロード進捗（SCR-UPLOAD-001）

```
Upload progress screen. Card showing upload status with progress bar (coral fill). Each photo shows upload status icon. Percentage and "X / Y 枚アップロード中" text. Note creation title at top. Cancel option. Warm background.
```

### 生成プレビュー（SCR-AI-001）

```
AI generation preview screen. Shows the auto-generated note draft: hero photo, AI-generated title (editable), date and location chips, AI-written short diary text (2-3 lines), photo grid (2x3), mini map with pins. Edit buttons next to title and diary. "保存する" coral CTA at bottom. "再生成" text button.
```

### ノート詳細（SCR-NOTE-001）

```
Note detail screen. Large cover photo (220px). Title in bold, date chip and teal location chip below. "AI日記" card with short diary text. Photo grid (3 columns, 6 photos). Mini map card (teal background, pins). "スポット一覧" card with teal pin dots and place names. Member avatars row. Share button in header.
```

### 設定（SCR-SET-001）

```
Settings screen. Profile card at top: circular avatar with initials, display name, email, plan badge. Section list: アカウント (edit profile, logout), プライバシー・権限 (権限説明, データ管理, AI利用), サポート・情報 (利用規約, プライバシーポリシー, お問い合わせ). Warm card style with dividers. App version at bottom.
```

### 共有カードプレビュー（SCR-CARD-002）

```
SNS share card preview screen. Shows the generated share card in selected ratio (1:1, 4:5, or 9:16). Card contains: large hero photo, note title in bold, date and location text, short diary excerpt, mini map, "Made with Memory Note" small logo. Save to Camera Roll button. Share to SNS button (coral). Ratio selector tabs at top.
```

---

## 4. 生成時の注意事項

### やること

- 完成済みのプロダクト画面として生成する
- 日本語テキストを自然に配置する
- 写真はリアルなスマホ写真風（食事・風景・街並み・カフェなど）
- カードと余白でレイアウトを整理する
- 上部ヘッダー・中央コンテンツ・下部ナビの構成を守る

### やらないこと

- ワイヤーフレームを生成しない
- 英語のみのUIを生成しない
- 旅行サイト・SNSフィード・地図ナビのUIを生成しない
- 生成結果を本番コードとして直接使わない
- 生成結果のデザインをそのままコピーせず、既存の `colors.ts` に合わせて実装する

---

## 5. 生成結果の評価基準

Figma Make の出力を確認する際は以下をチェックしてください。

| チェック項目 | 基準 |
|---|---|
| 実際のアプリ画面に見えるか | ✅ / ❌ |
| 日本語UIとして自然か | ✅ / ❌ |
| 写真が主役になっているか | ✅ / ❌ |
| 旅行サイト風になっていないか | ✅ / ❌ |
| SNSフィード風になっていないか | ✅ / ❌ |
| カードと余白が適切か | ✅ / ❌ |
| コーラルの使いすぎがないか | ✅ / ❌ |
| 参照可能な具体的なレイアウトが得られたか | ✅ / ❌ |
