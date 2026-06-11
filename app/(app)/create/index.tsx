import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useCreateNote } from '@/features/memoryNotes/hooks/useCreateNote';
import { useAuth } from '@/core/auth/AuthContext';

const CREATION_STEPS = [
  {
    step: 1,
    emoji: '📷',
    title: '写真を選ぶ',
    description: 'カメラロールから複数枚選択。GPS情報があれば自動で地図に配置されます。',
  },
  {
    step: 2,
    emoji: '🤖',
    title: 'AIが整理する',
    description: '日付・場所・タイトルを自動生成。内容は後から編集できます。',
  },
  {
    step: 3,
    emoji: '📖',
    title: 'ノートが完成',
    description: '写真・地図・日記がひとまとめに。友達や家族と共有もできます。',
  },
] as const;

export default function CreateScreen() {
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const {
    title, setTitle,
    memo, setMemo,
    noteType, setNoteType,
    isSaving, error, saveNote,
  } = useCreateNote();

  async function handleSave() {
    if (!uid) return;
    const noteId = await saveNote(uid);
    if (noteId) {
      router.replace(`/(app)/notes/${noteId}`);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="新しい思い出を作る"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── メイン導線: 写真から作る ── */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>📸</Text>
          <Text style={styles.heroTitle}>写真を選んで{'\n'}思い出ノートを作ろう</Text>
          <Text style={styles.heroDescription}>
            写真を選ぶだけで、日付・場所・AIコメント付きの思い出ノートが自動で作れます
          </Text>
        </View>

        {/* 3ステップカード */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionLabel}>作成の流れ</Text>
          <View style={styles.stepsCard}>
            {CREATION_STEPS.map((item, index) => (
              <View key={item.step}>
                <View style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{item.step}</Text>
                  </View>
                  <Text style={styles.stepEmoji}>{item.emoji}</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{item.title}</Text>
                    <Text style={styles.stepDescription}>{item.description}</Text>
                  </View>
                </View>
                {index < CREATION_STEPS.length - 1 && (
                  <View style={styles.stepConnector} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 写真を選ぶボタン — disabled until Phase 6 */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoButton} disabled activeOpacity={0.85}>
            <Text style={styles.photoButtonText}>📷　写真を選ぶ</Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>
            写真選択は Phase 6 で対応予定です。今は下のテスト作成で保存確認できます。
          </Text>
        </View>

        {/* ── デバッグ導線: 写真なしでテスト作成 ── */}
        <View style={styles.debugSection}>
          {/* ヘッダー */}
          <View style={styles.debugHeader}>
            <View style={styles.debugBadge}>
              <Text style={styles.debugBadgeText}>開発中の確認用</Text>
            </View>
            <Text style={styles.debugTitle}>写真なしでテスト作成</Text>
            <Text style={styles.debugDescription}>
              写真機能の実装前に、タイトルとメモだけでノート保存を確認できます。
            </Text>
          </View>

          {/* フォーム */}
          <View style={styles.debugForm}>
            {/* タイトル */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                タイトル <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="例：夏の思い出、カフェ巡り..."
                placeholderTextColor={colors.textTertiary}
                maxLength={100}
                returnKeyType="next"
              />
            </View>

            {/* メモ */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>メモ</Text>
              <TextInput
                style={[styles.textInput, styles.memoInput]}
                value={memo}
                onChangeText={setMemo}
                placeholder="思い出のメモを入力（省略可）"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                maxLength={1000}
                textAlignVertical="top"
              />
            </View>

            {/* ノート種別 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ノートの種類</Text>
              <View style={styles.noteTypesRow}>
                <NoteTypeCard
                  emoji="👤"
                  label="個人ノート"
                  desc="自分だけの記録"
                  active={noteType === 'personal'}
                  onPress={() => setNoteType('personal')}
                />
                <NoteTypeCard
                  emoji="🤝"
                  label="共有ノート"
                  desc="Phase 11 以降"
                  active={noteType === 'shared'}
                  disabled
                  onPress={() => {}}
                />
              </View>
            </View>

            {/* エラー */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* 保存ボタン */}
            <TouchableOpacity
              style={[
                styles.debugSaveButton,
                (!title.trim() || isSaving) && styles.debugSaveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!title.trim() || isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={styles.debugSaveButtonText}>写真なしでテスト作成する</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NoteTypeCard({
  emoji,
  label,
  desc,
  active,
  disabled,
  onPress,
}: {
  emoji: string;
  label: string;
  desc: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.noteTypeCard,
        active && styles.noteTypeCardActive,
        disabled && styles.noteTypeCardDimmed,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.noteTypeEmoji}>{emoji}</Text>
      <Text style={styles.noteTypeLabel}>{label}</Text>
      <Text style={styles.noteTypeDesc}>{desc}</Text>
    </TouchableOpacity>
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
  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 28,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Steps
  stepsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceIvory,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepEmoji: {
    fontSize: 20,
    marginTop: -1,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  stepConnector: {
    width: 1.5,
    height: 10,
    backgroundColor: colors.border,
    marginLeft: 27,
  },
  // Photo button
  photoSection: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  photoButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    opacity: 0.35,
  },
  photoButtonText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Debug section
  debugSection: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  debugHeader: {
    backgroundColor: colors.surfaceIvory,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 6,
  },
  debugBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  debugBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  debugDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  // Debug form
  debugForm: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  required: {
    color: colors.error,
  },
  textInput: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.textPrimary,
  },
  memoInput: {
    minHeight: 88,
    paddingTop: 11,
  },
  // Note types
  noteTypesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteTypeCard: {
    flex: 1,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 5,
  },
  noteTypeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  noteTypeCardDimmed: {
    opacity: 0.4,
  },
  noteTypeEmoji: {
    fontSize: 24,
  },
  noteTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noteTypeDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  // Debug save button
  debugSaveButton: {
    backgroundColor: colors.textSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  debugSaveButtonDisabled: {
    opacity: 0.4,
  },
  debugSaveButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
});
