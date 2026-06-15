# Phase 12.5H-6.2 Fix Mixed Route Segment Reload — Next Steps

## 必須

1. **Firebase Functions deploy**
   ```
   firebase deploy --only functions
   ```
   (routeFunctions.ts の null ハンドリング変更が含まれるため)

## テスト手順

1. 区間別モードを選択
2. 各区間に「徒歩」「公共交通」「車」など混合で設定
3. 「選択した移動手段でルートを生成」をタップ
4. `[routeFunctionsClient] getNoteRouteSegments payload {"noteId":"..."}` のみ出ること（travelMode なし）
5. `[map] routeSegments resultCount {"count": N, "effectiveMode": "mixed"}` が出ること
6. エラーが出ないこと

## 確認済み期待ログ（DEV）

区間別モード:
```
[map] loadRouteSegments effectiveMode=mixed
[routeFunctionsClient] getNoteRouteSegments payload {"noteId":"..."}
[map] routeSegments resultCount {"count": 2, "effectiveMode": "mixed"}
```

公共交通単体:
```
[map] premium mode selected {"mode": "transit"}
[map] getNoteRouteSegments final input {"noteId":"...", "travelMode": "transit"}
[routeFunctionsClient] getNoteRouteSegments payload {"noteId":"...", "travelMode": "transit"}
[map] routeSegments resultCount {"count": 2, "effectiveMode": "transit"}
```
