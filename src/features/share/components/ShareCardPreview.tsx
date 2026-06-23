// Phase 12: ShareCardPreview — SNS共有カードプレビューコンポーネント
// フォーマット（1:1 / 4:5 / 9:16）に応じてアスペクト比を変え、
// 写真コラージュ・タイトル・AI日記/メモ・日付・アプリ名を表示する。
// このコンポーネントを react-native-view-shot で capture する。

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';
import type { NoteDoc } from '@/core/repositories/noteRepository';
import type { PhotoDoc } from '@/core/repositories/photoRepository';
import type { ShareCardFormat } from '../types';
import { SHARE_CARD_FORMATS } from '../types';
import { PhotoCollage } from './PhotoCollage';

// ────────────────────────────────────────────────────────────────────────────

export type ShareCardPreviewProps = {
  note: NoteDoc;
  photos: PhotoDoc[];
  format: ShareCardFormat;
  /** カードの表示幅（px）。高さはアスペクト比から算出。 */
  cardWidth: number;
};

function formatDate(ts: { toDate: () => Date } | null | undefined): string | null {
  if (!ts || typeof ts.toDate !== 'function') return null;
  const d = ts.toDate();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ────────────────────────────────────────────────────────────────────────────

export const ShareCardPreview = forwardRef<View, ShareCardPreviewProps>(
  function ShareCardPreview({ note, photos, format, cardWidth }, ref) {
    const { aspectRatio } = SHARE_CARD_FORMATS[format];
    const cardHeight = cardWidth / aspectRatio;

    // テキストコンテンツ: AI日記 > メモ > プレースホルダー
    const textContent =
      note.aiDiary && note.aiDiary.trim()
        ? note.aiDiary.trim()
        : note.memo && note.memo.trim()
        ? note.memo.trim()
        : null;

    const dateStr = formatDate(note.createdAt);
    const photoCount = note.photoCount ?? photos.length;
    const isShared = note.noteType === 'shared';

    // story フォーマットは写真比率を少し小さくしてテキスト領域を確保
    const photoFlex = format === 'story' ? 5 : 4;
    const contentFlex = format === 'story' ? 3 : 2;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[styles.card, { width: cardWidth, height: cardHeight }]}
      >
        {/* ── 写真コラージュ ── */}
        <View style={{ flex: photoFlex }}>
          <PhotoCollage photos={photos} maxPhotos={4} />
        </View>

        {/* ── コンテンツ領域 ── */}
        <View style={[styles.content, { flex: contentFlex }]}>
          {/* ノートタイプバッジ（共有ノートのみ） */}
          {isShared ? (
            <View style={styles.sharedBadge}>
              <Text style={styles.sharedBadgeText}>🤝 共有ノート</Text>
            </View>
          ) : null}

          {/* タイトル */}
          <Text style={styles.title} numberOfLines={2}>
            {note.title}
          </Text>

          {/* 場所概要 (UI-9: visitedPlacesSummary から取得) */}
          {note.visitedPlacesSummary?.areaLabel ? (
            <Text style={styles.locationHint} numberOfLines={1}>
              📍 {note.visitedPlacesSummary.areaLabel}
            </Text>
          ) : note.visitedPlacesSummary?.topPlaceLabels?.[0] ? (
            <Text style={styles.locationHint} numberOfLines={1}>
              📍 {note.visitedPlacesSummary.topPlaceLabels[0]}
            </Text>
          ) : null}

          {/* AI日記 / メモ */}
          {textContent ? (
            <Text style={styles.diary} numberOfLines={format === 'story' ? 6 : 4}>
              {textContent}
            </Text>
          ) : (
            <Text style={styles.diaryPlaceholder}>思い出の記録</Text>
          )}

          {/* フッター: 日付 + 写真枚数 + ブランド */}
          <View style={styles.footer}>
            <View style={styles.footerMeta}>
              {dateStr ? (
                <Text style={styles.footerMetaText}>{dateStr}</Text>
              ) : null}
              {photoCount > 0 ? (
                <Text style={styles.footerMetaText}>📷 {photoCount}枚</Text>
              ) : null}
            </View>
            <Text style={styles.brand}>Memory Note</Text>
          </View>
        </View>
      </View>
    );
  }
);

// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderRadius: 0, // 画像としてキャプチャするため角丸なし
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'space-between',
    gap: 4,
  },
  sharedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 2,
  },
  sharedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  locationHint: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mapAccent,
  },
  diary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  diaryPlaceholder: {
    fontSize: 13,
    color: colors.textTertiary,
    fontStyle: 'italic',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  footerMetaText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mapAccent,
    letterSpacing: 0.5,
  },
});
