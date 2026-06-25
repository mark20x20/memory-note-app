# UI-18 Onboarding Polish — 設計メモ

## レイアウト方針

### スライド式 → スクロール1ページに変更
旧実装は3ステップのスライドカルーセル。
今回の要件はScrollView 1ページ構成のため、ステート管理（currentSlide）を削除し、
シンプルな静的レイアウトに変更した。

## カラー設計

| 用途 | カラーコード |
|---|---|
| 画面背景 | `#FAF7F2` |
| ヒーロー背景 | `#FFF9F4` |
| アクセント（CTAボタン） | `#F26B5B` |
| フィーチャーアイコン背景 | `#FDE7E2` |
| テキスト（見出し） | `#1A1A1A` |
| テキスト（説明） | `#6B7280` |
| スキップテキスト | `#9CA3AF` |

## コンポーネント構成

```
SafeAreaView (backgroundColor: #FAF7F2)
└── ScrollView
    ├── Hero (backgroundColor: #FFF9F4)
    │   ├── heroEmoji (📔)
    │   ├── heroTitle
    │   └── heroSubtitle
    ├── featureList
    │   └── featureRow × 4
    │       ├── featureIconWrap (backgroundColor: #FDE7E2)
    │       └── featureText
    └── ctaContainer
        ├── ctaButton (「思い出ノートをはじめる」→ /(auth)/login)
        └── skipButton (「あとで見る」→ /(auth)/login)
```

## ナビゲーション
- CTA・スキップ両方とも `router.replace('/(auth)/login')` で遷移
- first-run flag は今回実装しない
