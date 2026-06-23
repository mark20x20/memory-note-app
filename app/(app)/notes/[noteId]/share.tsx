// Phase 12: SNS共有カード画面
// ノート詳細から遷移して、SNS向け共有画像を生成・保存・共有できる。
// フォーマット: 1:1 (square) / 4:5 (portrait) / 9:16 (story)
// 権限: owner / editor / viewer すべてアクセス可能。

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useNotePhotos } from '@/features/photos/hooks/useNotePhotos';
import { ShareCardPreview } from '@/features/share/components/ShareCardPreview';
import { useShareCardCapture } from '@/features/share/hooks/useShareCardCapture';
import { SHARE_CARD_FORMAT_ORDER, SHARE_CARD_FORMATS } from '@/features/share/types';
import type { ShareCardFormat } from '@/features/share/types';

// ────────────────────────────────────────────────────────────────────────────

const CARD_HORIZONTAL_PADDING = 20;

export default function ShareCardScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const { width: screenWidth } = useWindowDimensions();

  // UI-9: 初期値は 4:5 (portrait) — Instagram feed に最適
  const [selectedFormat, setSelectedFormat] = useState<ShareCardFormat>('portrait');

  const { note, isLoading: noteLoading } = useNoteDetail(noteId ?? null);
  const { photos, isLoading: photosLoading } = useNotePhotos(noteId ?? null);

  const {
    cardRef,
    captureAndSave,
    captureAndShare,
    isCapturing,
    error,
    clearError,
    successMessage,
    clearSuccess,
  } = useShareCardCapture();

  const cardWidth = screenWidth - CARD_HORIZONTAL_PADDING * 2;
  const { aspectRatio } = SHARE_CARD_FORMATS[selectedFormat];
  const cardHeight = cardWidth / aspectRatio;

  // 成功メッセージを3秒後に自動クリア
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(clearSuccess, 3000);
    return () => clearTimeout(timer);
  }, [successMessage, clearSuccess]);

  // ── ローディング ──────────────────────────────────────────────────────────
  if (noteLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="共有カード" onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!note) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="共有カード" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorText}>ノートが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="共有カード" onBack={() => router.back()} />
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>思い出をきれいにまとめる</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── フォーマットセレクター ── */}
        <View style={styles.formatSelector}>
          {SHARE_CARD_FORMAT_ORDER.map((fmt) => {
            const config = SHARE_CARD_FORMATS[fmt];
            const isActive = selectedFormat === fmt;
            return (
              <TouchableOpacity
                key={fmt}
                style={[styles.formatTab, isActive && styles.formatTabActive]}
                onPress={() => setSelectedFormat(fmt)}
                accessibilityLabel={`${config.label} ${config.description}`}
              >
                <Text style={[styles.formatTabLabel, isActive && styles.formatTabLabelActive]}>
                  {config.label}
                </Text>
                <Text style={[styles.formatTabDesc, isActive && styles.formatTabDescActive]}>
                  {config.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── カードプレビュー ── */}
        <View style={[styles.cardWrapper, { height: cardHeight }]}>
          {photosLoading ? (
            <View style={[styles.cardLoading, { width: cardWidth, height: cardHeight }]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.cardLoadingText}>写真を読み込み中...</Text>
            </View>
          ) : (
            <ShareCardPreview
              ref={cardRef}
              note={note}
              photos={photos}
              format={selectedFormat}
              cardWidth={cardWidth}
            />
          )}
        </View>

        {/* ── エラー表示 ── */}
        {error ? (
          <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
            <Text style={styles.errorBannerText}>⚠️ {error}</Text>
            <Text style={styles.errorBannerDismiss}>閉じる</Text>
          </TouchableOpacity>
        ) : null}

        {/* ── 成功表示 ── */}
        {successMessage ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>✅ {successMessage}</Text>
          </View>
        ) : null}

        {/* ── アクションボタン ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton, isCapturing && styles.buttonDisabled]}
            onPress={captureAndSave}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveButtonText}>💾 画像を保存</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton, isCapturing && styles.buttonDisabled]}
            onPress={captureAndShare}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.shareButtonText}>↗ 共有する</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── 注意文 ── */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>📝 共有について</Text>
          <Text style={styles.noticeText}>
            共有画像にはノートのタイトル・写真・日記が含まれます。{'\n'}
            写真の位置情報は画像には記録されません。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scroll: {
    paddingBottom: 48,
  },

  // Format selector
  formatSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  formatTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 2,
  },
  formatTabActive: {
    backgroundColor: colors.primaryLight,
  },
  formatTabLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  formatTabLabelActive: {
    color: colors.primary,
  },
  formatTabDesc: {
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  formatTabDescActive: {
    color: colors.primary,
  },

  // Sub header
  subHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  subHeaderText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // Card preview
  cardWrapper: {
    marginHorizontal: CARD_HORIZONTAL_PADDING,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  cardLoading: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardLoadingText: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Error / Success banners
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  errorBannerDismiss: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  successBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
    padding: 12,
  },
  successBannerText: {
    fontSize: 13,
    color: colors.success,
    textAlign: 'center',
  },

  // Action buttons
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  shareButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Notice
  noticeCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noticeText: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});
