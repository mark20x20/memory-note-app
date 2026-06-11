# 画面優先順位 — Figma Make 生成・実装計画

## 優先度A: Phase 5〜9 に直結する画面（最優先で Figma 生成・実装）

これらは「写真を選ぶ → ノートを作る → 見返す」のコア体験に必須です。

| 画面ID | 画面名 | 実装Phase | Figma生成Phase | 備考 |
|---|---|---|---|---|
| SCR-HOME-001 | ホーム / ノート一覧 | Phase 5〜 | Phase 5前 | 空状態は Phase 4 済み |
| SCR-HOME-002 | ホーム空状態 | Phase 4 完了 | Phase 4 済み | ✅ 実装済 |
| SCR-CREATE-001 | 作成開始 | Phase 5 | Phase 5前 | Placeholder 済み |
| SCR-CREATE-002 | 写真選択 | Phase 6 | Phase 5前 | ピッカーUI |
| SCR-UPLOAD-001 | アップロード進捗 | Phase 7 | Phase 6前 | プログレスバー |
| SCR-UPLOAD-002 | 処理中 | Phase 7 | Phase 6前 | ローディング演出 |
| SCR-AI-001 | 生成プレビュー | Phase 9 | Phase 9前 | ノート草案確認 |
| SCR-AI-002 | AIタイトル編集 | Phase 9 | Phase 9前 | インライン編集 |
| SCR-AI-003 | AI日記編集 | Phase 9 | Phase 9前 | インライン編集 |
| SCR-NOTE-001 | ノート詳細 | Phase 9〜10 | Phase 9前 | Placeholder 済み |
| SCR-MAP-001 | ノート地図 | Phase 8 | Phase 8前 | 地図単独表示 |
| SCR-SET-001 | 設定トップ | Phase 4 完了 | Phase 4 済み | ✅ Placeholder 済み |

---

## 優先度B: 共有・SNS・設定に関わる画面（Phase 10〜14 で実装）

コア体験が成立した後に実装する。アプリの価値を高める機能群。

| 画面ID | 画面名 | 実装Phase | Figma生成Phase |
|---|---|---|---|
| SCR-NOTE-002 | ノート編集 | Phase 10 | Phase 10前 |
| SCR-NOTE-003 | 写真一覧 / スポット一覧 | Phase 10 | Phase 10前 |
| SCR-SHARE-001 | 共有メンバー管理 | Phase 11 | Phase 11前 |
| SCR-SHARE-002 | メンバー招待 | Phase 11 | Phase 11前 |
| SCR-SHARE-003 | 権限変更 | Phase 11 | Phase 11前 |
| SCR-SHARE-004 | 共有ノート離脱 | Phase 11 | Phase 11前 |
| SCR-SHARE-005 | 削除確認 | Phase 10 | Phase 10前 |
| SCR-CARD-001 | 共有カード設定 | Phase 12 | Phase 12前 |
| SCR-CARD-002 | カードプレビュー | Phase 12 | Phase 12前 |
| SCR-CARD-003 | カード保存完了 | Phase 12 | Phase 12前 |
| SCR-CARD-004 | 共有シート起動案内 | Phase 12 | Phase 12前 |
| SCR-MAP-002 | カレンダー | Phase 13 | Phase 13前 |
| SCR-MAP-003 | 検索 | Phase 13 | Phase 13前 |
| SCR-SET-002 | 権限説明 | Phase 14 | Phase 14前 |
| SCR-SET-003 | プライバシー | Phase 14 | Phase 14前 |
| SCR-SET-004 | 利用規約 | Phase 14 | Phase 14前 |

---

## 優先度C: 後続改善・補助画面（P1 / v1.1以降）

コア体験・共有体験が成立してから検討。

| 画面ID | 画面名 | 実装Phase | 備考 |
|---|---|---|---|
| SCR-AI-004 | 場所名編集 | Phase 9 以降 | P1 |
| SCR-NOTE-004 | 写真詳細 | Phase 10 以降 | P1 |
| SCR-MAP-004 | On This Day | Phase 13 | P1 |
| SCR-SET-005 | 問い合わせ | Phase 14 | P1 |
| SCR-ERR-001 | 権限不足 | Phase 11 | 共通コンポーネント |
| SCR-ERR-002 | 空状態 | Phase 4 完了 | ✅ `EmptyState.tsx` 済み |
| SCR-ERR-003 | アップロード失敗 | Phase 7 | `/(app)/create/upload` 内 |
| SCR-ERR-004 | AI失敗 | Phase 9 | `/(app)/create/ai-preview` 内 |
| SCR-ERR-005 | 削除失敗 | Phase 10 | P1 |

---

## Figma 生成の優先順位まとめ

次にFigma Makeで生成すべき画面（Phase 5 開始前）:

1. **SCR-CREATE-001** — 作成開始（本実装版）
2. **SCR-CREATE-002** — 写真選択
3. **SCR-HOME-001** — ホーム（ノートカード一覧が並んでいる状態）

その後 Phase 6〜7 開始前:

4. **SCR-UPLOAD-001** — アップロード進捗
5. **SCR-UPLOAD-002** — 処理中

Phase 8〜9 開始前:

6. **SCR-MAP-001** — ノート地図
7. **SCR-AI-001** — 生成プレビュー
8. **SCR-AI-002/003** — タイトル / 日記 編集
9. **SCR-NOTE-001** — ノート詳細（完成版）
