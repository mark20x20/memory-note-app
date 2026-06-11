# Phase 6 Design Decisions

## D1: photos feature ディレクトリを新規作成

**決定:** `src/features/photoUpload/` は空だったため、新規に `src/features/photos/` を作成した。

**理由:** 仕様書の指示通り `src/features/photos/types/index.ts` と `src/features/photos/hooks/usePhotoPicker.ts` を作成。Phase 7 以降の Storage アップロード実装では `photoUpload/` を使うか `photos/` に統合するかを改めて判断する。

## D2: 写真のIDはローカル生成（Firestore IDを使わない）

**決定:** `PickedPhoto.id` は `photo_${Date.now()}_${counter}` 形式のローカル ID にした。

**理由:** Phase 6 では写真を Firestore/Storage に保存しないため Firestore ID が存在しない。ローカル ID で React の `key` とリスト操作（removePhoto）に使用する。Phase 7 でアップロード後に実際のStorageパスに置き換え予定。

## D3: 重複選択の防止を省略

**決定:** 同じ写真の重複選択防止ロジックを実装しなかった。

**理由:** expo-image-picker が返す URI はセッションごとに変わる可能性があり、確実な重複判定が難しい。Phase 6 の範囲では上限10枚チェックのみとし、重複防止は Phase 7 以降に検討する。

## D4: Create画面のデバッグ導線を廃止し、メイン導線に統合

**決定:** Phase 5 の「写真なしでテスト作成する」デバッグセクションを廃止。フォーム（タイトル/メモ/種別）をメイン導線に組み込んだ。

**理由:** Phase 6 で写真選択が実装済みになったため「開発中の確認用」という位置づけが不要になった。タイトルのみでノートは作成できる仕様は変わらないため、Phase 5 のテスト確認機能は損なわれない。

## D5: 写真未選択でもノート保存可能にする

**決定:** 写真が0枚でもタイトルがあればノート保存できる。

**理由:** Phase 5 のテスト保存フローを維持するため。UI では写真を選ばずにフォーム入力→保存も自然にできるようにした。

## D6: EXIF GPS の符号処理

**決定:** `GPSLatitudeRef` / `GPSLongitudeRef` の S/W 符号変換を現時点では実装しない。

**理由:** expo-image-picker は GPS を decimal degrees で返すが、正負の符号付与には `GPSLatitudeRef`（N/S）と `GPSLongitudeRef`（E/W）を参照する必要がある。Phase 6 では GPS を内部状態に保持するだけで地図表示は行わないため、Phase 8 の地図実装時に符号処理を行う。
