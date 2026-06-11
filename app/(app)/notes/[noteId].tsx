import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';

export default function NoteDetailScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="ノート詳細"
        onBack={() => router.back()}
        rightElement={
          <TouchableOpacity style={styles.shareButton} hitSlop={8}>
            <Text style={styles.shareButtonText}>↗</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cover photo placeholder */}
        <View style={styles.coverPhoto}>
          <Text style={styles.coverEmoji}>🖼</Text>
          <Text style={styles.coverPlaceholderText}>カバー写真</Text>
        </View>

        {/* Note meta */}
        <View style={styles.metaSection}>
          <Text style={styles.noteTitle}>思い出のタイトル</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>📅 2024年夏</Text>
            </View>
            <View style={[styles.metaChip, styles.metaChipMap]}>
              <Text style={[styles.metaChipText, styles.metaChipTextMap]}>📍 場所名</Text>
            </View>
          </View>
        </View>

        {/* AI diary placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>日記</Text>
          <View style={styles.diaryCard}>
            <Text style={styles.diaryPlaceholder}>
              AIが生成した短文日記がここに表示されます。{'\n'}写真・場所・日付から自動で作られます。
            </Text>
          </View>
        </View>

        {/* Photo grid placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>写真</Text>
          <View style={styles.photoGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={styles.photoCell}>
                <Text style={styles.photoCellEmoji}>🏞</Text>
              </View>
            ))}
          </View>
          <Text style={styles.placeholderCaption}>写真表示は Phase 7 以降で実装予定</Text>
        </View>

        {/* Map placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>地図</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺</Text>
            <Text style={styles.mapPlaceholderText}>
              訪れた場所がピンで表示されます
            </Text>
          </View>
          <Text style={styles.placeholderCaption}>地図表示は Phase 8 以降で実装予定</Text>
        </View>

        {/* Spots placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>スポット一覧</Text>
          <View style={styles.spotsCard}>
            {['カフェ', 'レストラン', '観光地'].map((spot) => (
              <View key={spot} style={styles.spotRow}>
                <View style={styles.spotPin}>
                  <Text style={styles.spotPinText}>●</Text>
                </View>
                <Text style={styles.spotName}>{spot}</Text>
              </View>
            ))}
            <Text style={styles.placeholderCaption}>スポット詳細は Phase 9 以降で実装予定</Text>
          </View>
        </View>

        {/* Members placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>メンバー</Text>
          <View style={styles.membersRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>👤</Text>
            </View>
            <Text style={styles.memberLabel}>あなた（Owner）</Text>
          </View>
        </View>

        {/* Note ID — subtle helper */}
        <Text style={styles.noteIdHint}>ノートID: {noteId ?? '—'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 48,
  },
  shareButton: {
    padding: 4,
  },
  shareButtonText: {
    fontSize: 20,
    color: colors.primary,
  },
  // Cover
  coverPhoto: {
    height: 200,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  coverEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  coverPlaceholderText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  // Meta
  metaSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  noteTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaChip: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaChipMap: {
    backgroundColor: colors.mapAccentLight,
  },
  metaChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaChipTextMap: {
    color: colors.mapAccent,
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  // Diary
  diaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  diaryPlaceholder: {
    fontSize: 14,
    color: colors.textTertiary,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Photo grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  photoCell: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoCellEmoji: {
    fontSize: 24,
  },
  // Map
  mapPlaceholder: {
    height: 140,
    backgroundColor: colors.mapAccentLight,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  mapEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: colors.mapAccent,
  },
  placeholderCaption: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  // Spots
  spotsCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spotPin: {
    width: 20,
    alignItems: 'center',
  },
  spotPinText: {
    fontSize: 10,
    color: colors.mapAccent,
  },
  spotName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Members
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceIvory,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
  },
  memberLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Note ID hint
  noteIdHint: {
    marginTop: 32,
    marginHorizontal: 20,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
