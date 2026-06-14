# Phase 12.5G-7 Issues

## `preview.tsx` を追加した時の detail との役割整理が必要

現在 `index.tsx` が detail screen としてかなり多くの役割を持っているため、
preview を入れる場合は:
- detail を残すか
- detail を preview に寄せるか

の整理が必要。

## save API は concern ごとに分かれる可能性が高い

以下は保存単位が異なる可能性がある:
- note fields
- photo order / cover
- flow edits
- place corrections

そのため「1つの update payload」に無理にまとめない方が安全な可能性がある。

## Flows tab は route 遷移との境界がまだ曖昧

軽い操作:
- 並べ替え
- 簡単な分割

重い操作:
- 写真移動
- flow再構成

この境界は実装時に再調整が必要。
