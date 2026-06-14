# 05 UI Flow and Route Display

## Map 画面のルートモード選択UI（Phase 12.5H-1 実装済み）

```
ルート表示
[直線] [徒歩 Premium] [車 Premium] [公共交通 Premium]
```

---

## 状態ごとのUI

### 1. 無料ユーザー + 直線モード（現状維持）

```
━━━━━━━━━━━━━━━━━━━━━━━━
地図（PlaceGroupを直線破線でつないだPolyline）
━━━━━━━━━━━━━━━━━━━━━━━━

ルート表示
[直線 ✓] [徒歩 Premium] [車 Premium] [公共交通 Premium]

（注記）訪問順を線で表示しています。実際の移動ルートとは異なる場合があります。

━━━━━━━━━━━━━━━━━━━━━━━━
場所カード（横スクロール）...
```

---

### 2. 無料ユーザー + Premium モード選択

```
━━━━━━━━━━━━━━━━━━━━━━━━
地図（直線破線Polylineのまま）
━━━━━━━━━━━━━━━━━━━━━━━━

ルート表示
[直線] [徒歩 Premium ✓] [車 Premium] [公共交通 Premium]

┌─────────────────────────────────────┐
│ 実ルート表示はプレミアム機能です          │
│                                     │
│ 徒歩での移動時間や距離を記録できます。    │
│ 移動時間・距離・乗換情報まで             │
│ 記録できるようになります。               │
│                                     │
│ [今は直線ルートで表示]                  │
└─────────────────────────────────────┘
```

---

### 3. Premium ユーザー + Premium モード選択 + 未生成

```
━━━━━━━━━━━━━━━━━━━━━━━━
地図（直線破線Polylineのまま）
━━━━━━━━━━━━━━━━━━━━━━━━

ルート表示
[直線] [徒歩 ✓] [車] [公共交通]

┌─────────────────────────────────────┐
│ 徒歩ルートを生成する                   │
│                                     │
│ #1 → #2 → #3 の実際の徒歩ルートを    │
│ 取得して表示します。                   │
│ （初回のみ少し時間がかかります）         │
│                                     │
│ [ルートを生成]                        │
└─────────────────────────────────────┘
```

---

### 4. Premium ユーザー + ルート生成中

```
━━━━━━━━━━━━━━━━━━━━━━━━
地図（直線破線Polylineのまま＋ローディング表示）
━━━━━━━━━━━━━━━━━━━━━━━━

ルート表示
[直線] [徒歩 ✓] [車] [公共交通]

┌─────────────────────────────────────┐
│  ⏳ ルートを取得中...                  │
│                                     │
│  3区間中 1区間目を処理中               │
└─────────────────────────────────────┘
```

---

### 5. Premium ユーザー + ルート生成済み（成功）

```
━━━━━━━━━━━━━━━━━━━━━━━━
地図（実ルートPolylineが描画されている）
━━━━━━━━━━━━━━━━━━━━━━━━

ルート表示
[直線] [徒歩 ✓] [車] [公共交通]

区間情報
#1 浅草寺 → #2 スカイツリー  徒歩 22分 / 1.7km
#2 スカイツリー → #3 両国国技館  徒歩 18分 / 1.4km

━━━━━━━━━━━━━━━━━━━━━━━━
場所カード（横スクロール）...
```

---

### 6. Premium ユーザー + 一部区間で取得失敗

```
━━━━━━━━━━━━━━━━━━━━━━━━
地図（成功区間は実ルート、失敗区間は直線破線）
━━━━━━━━━━━━━━━━━━━━━━━━

ルート表示
[直線] [徒歩 ✓] [車] [公共交通]

区間情報
#1 浅草寺 → #2 スカイツリー  徒歩 22分 / 1.7km
#2 スカイツリー → #3 場所不明  ——（ルート取得失敗）

（注記）一部区間で実ルートを取得できませんでした。直線ルートで表示しています。

[再試行]  [今は直線ルートで表示]
```

---

### 7. Transit モード（公共交通）の表示例

簡易表示（初期実装 Phase 12.5H-6）:

```
区間情報
#1 浅草駅 → #2 秋葉原駅
  公共交通 14分 / 5駅
  東武スカイツリーライン → 京浜東北線

#2 秋葉原駅 → #3 上野駅
  公共交通 4分 / 1駅
  京浜東北線
```

乗換ステップ詳細は Phase 12.5H-6 以降で実装。

---

## EventMapPreview（ノート詳細の地図プレビュー）

Phase 12.5H-1 で追加済みの「訪問順を線で表示」テキストをそのまま維持する。
EventMapPreview はサイズが小さい（デフォルト 180px）ため、
ルートモード選択UIや区間情報を追加しない。

```
[地図プレビュー: 直線破線Polyline付き]
訪問順を線で表示                        地図で見る →
```

実ルートに対応させるとしたら:
- Premium 生成済みかつ travelMode が選択されている場合のみ実ルート Polyline を表示
- 「ルートを生成」ボタンは Map 画面のみ

---

## 画面遷移フロー

```
ノート詳細（index.tsx）
  └─「地図で見る」タップ
     └─ Map 画面（map.tsx）
        └─ ルートモード選択UI
           ├─ 直線 → Polyline 直線
           ├─ 徒歩/車/公共交通（Free）→ Premium 案内カード
           └─ 徒歩/車/公共交通（Premium, 未生成）→ 「ルートを生成」カード
                └─「ルートを生成」タップ
                   └─ generateNoteRoutes 呼び出し（Loading）
                      └─ 成功 → 実ルートPolyline + 区間情報
                      └─ 失敗 → エラー表示 + 直線フォールバック
```

---

## Polyline の表示方針

| 状態 | Polyline | 色 | スタイル |
|------|---------|-----|---------|
| 直線モード | PlaceGroup 間を直線でつなぐ | #4FA8A1（ティール） | 破線 [8, 5] |
| 実ルート（walking）| decodedPolyline を描画 | #4FA8A1（ティール） | 実線 |
| 実ルート（driving）| decodedPolyline を描画 | #5B8DD9（ブルー） | 実線 |
| 実ルート（transit）| decodedPolyline を描画 | #D97B4F（オレンジ） | 実線 |
| 失敗区間のフォールバック | 直線 | #AAAAAA（グレー） | 破線 |

色の使い分けで移動手段を直感的に判別できるようにする。

---

## 区間カードコンポーネント設計（将来）

```ts
type RouteSegmentCardProps = {
  fromLabel: string;
  toLabel: string;
  fromNumber: number;
  toNumber: number;
  travelMode: 'walking' | 'driving' | 'transit';
  distanceMeters?: number;
  durationSeconds?: number;
  status: 'generated' | 'failed' | 'stale';
};

// 表示例（durationSeconds=720, distanceMeters=1700）
// "徒歩 12分 / 1.7km"
function formatRouteSegment(seg: RouteSegmentCardProps): string {
  const duration = seg.durationSeconds != null
    ? `${Math.round(seg.durationSeconds / 60)}分`
    : null;
  const distance = seg.distanceMeters != null
    ? seg.distanceMeters >= 1000
      ? `${(seg.distanceMeters / 1000).toFixed(1)}km`
      : `${seg.distanceMeters}m`
    : null;
  const modeLabel = getTravelModeLabel(seg.travelMode);
  return [modeLabel, duration, distance].filter(Boolean).join(' / ');
}
```

このコンポーネントは `src/features/map/components/RouteSegmentCard.tsx` として実装予定。

---

## ローカル State の設計（map.tsx の将来）

```ts
// 現在（Phase 12.5H-1）
const [routeMode, setRouteMode] = useState<RouteDisplayMode>('straight');
const [premiumTravelMode, setPremiumTravelMode] = useState<PremiumRouteTravelMode>('walking');

// 追加予定（Phase 12.5H-5+）
const [routeSegments, setRouteSegments] = useState<RouteSegmentSummary[]>([]);
const [routeGenerationStatus, setRouteGenerationStatus] = useState<
  'idle' | 'loading' | 'success' | 'error'
>('idle');
const [routeGenerationError, setRouteGenerationError] = useState<string | null>(null);
```
