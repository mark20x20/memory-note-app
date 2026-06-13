// Phase 10: ノート編集画面
// Phase 11: 権限制御を追加。
// - viewer が URL 直接アクセスした場合は権限エラーを表示し、保存ボタンを無効化
// - editor は title / memo / noteType / aiDiary を編集可、削除ボタン非表示
// - owner は全機能を使用可（削除ボタンあり）
// Phase 12.5G-4: フロー管理セクションを追加。

import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useUpdateNote } from '@/features/memoryNotes/hooks/useUpdateNote';
import { useDeleteNote } from '@/features/memoryNotes/hooks/useDeleteNote';
import { canEdit, canDelete } from '@/features/memoryNotes/utils/permissions';
import type { NoteType } from '@/core/repositories/noteRepository';
import {
  enrichNotePlacesCallable,
  GROUPING_PRESETS,
} from '@/features/placeIntelligence/api/placeFunctionsClient';

export default function NoteEditScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note, isLoading } = useNoteDetail(noteId ?? null);
  const { update, isUpdating, error: updateError } = useUpdateNote();
  const { deleteNote, isDeleting, error: deleteError } = useDeleteNote();

  // フォームの状態
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('personal');
  const [aiDiary, setAiDiary] = useState('');
  const [initialized, setInitialized] = useState(false);

  // フロー再作成
  const [recreatingFlow, setRecreatingFlow] = useState(false);

  // Phase 11: 権限チェック
  const userCanEdit = uid && note ? canEdit(note, uid) : false;
  const userCanDelete = uid && note ? canDelete(note, uid) : false;

  // ノートが読み込まれたら初期値をセット（1回だけ）
  useEffect(() => {
    if (note && !initialized) {
      setTitle(note.title);
      setMemo(note.memo ?? '');
      setNoteType(note.noteType);
      setAiDiary(note.aiDiary ?? '');
      setInitialized(true);
    }
  }, [note, initialized]);

  const isBusy = isUpdating || isDeleting;

  async function handleRecreateFlow() {
    if (!noteId) return;
    Alert.alert(
      'この日の流れを再作成',
      '既存のフロー分割がリセットされます。標準設定（90分間隔）で再作成しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '再作成',
          onPress: async () => {
            setRecreatingFlow(true);
            try {
              await enrichNotePlacesCallable({
                noteId,
                forceRefresh: true,
                grouping: GROUPING_PRESETS['standard'],
              });
              Alert.alert('完了', 'この日の流れを再作成しました。');
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : '再作成に失敗しました';
              Alert.alert('エラー', msg);
            } finally {
              setRecreatingFlow(false);
            }
          },
        },
      ]
    );
  }

  const hasAiDiary =
    note?.aiDiaryStatus === 'completed' ||
    note?.aiDiaryStatus === 'edited';

  const handleSave = async () => {
    if (!noteId) return;
    if (!userCanEdit) return; // 念のため
    if (!title.trim()) {
      Alert.alert('入力エラー', 'タイトルを入力してください');
      return;
    }
    try {
      await update(noteId, {
        title,
        memo,
        noteType,
        ...(hasAiDiary ? { aiDiary } : {}),
      });
      router.back();
    } catch {
      // error は useUpdateNote の state に格納済み
    }
  };

  const handleDelete = () => {
    if (!noteId) return;
    Alert.alert(
      'ノートを削除',
      'このノートと関連する写真をすべて削除します。\nこの操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              // deleteNote が成功すると router.replace('/(app)/home') が呼ばれる
            } catch {
              // error は useDeleteNote の state に格納済み
            }
          },
        },
      ]
    );
  };

  if (isLoading || !initialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="編集" onBack={() => router.back()} />
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
        <ScreenHeader title="編集" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorText}>ノートが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Phase 11: viewer は編集不可 — 権限エラー表示
  if (!userCanEdit) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="編集" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔒</Text>
          <Text style={styles.errorText}>編集権限がありません</Text>
          <Text style={styles.errorDetail}>このノートを編集するには editor 以上の権限が必要です。</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="編集"
        onBack={() => router.back()}
        rightElement={
          <TouchableOpacity
            style={[styles.saveButton, isBusy && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isBusy}
            hitSlop={8}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveButtonText}>保存</Text>
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* エラー表示 */}
          {(updateError || deleteError) ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                {updateError ?? deleteError}
              </Text>
            </View>
          ) : null}

          {/* タイトル */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>タイトル</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="タイトルを入力"
              placeholderTextColor={colors.textTertiary}
              maxLength={100}
              editable={!isBusy}
            />
          </View>

          {/* メモ */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>メモ</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={memo}
              onChangeText={setMemo}
              placeholder="メモを入力（任意）"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
              editable={!isBusy}
            />
          </View>

          {/* ノート種別 */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ノートの種類</Text>
            <View style={styles.noteTypeRow}>
              <TouchableOpacity
                style={[
                  styles.noteTypeButton,
                  noteType === 'personal' && styles.noteTypeButtonActive,
                ]}
                onPress={() => setNoteType('personal')}
                disabled={isBusy}
              >
                <Text
                  style={[
                    styles.noteTypeButtonText,
                    noteType === 'personal' && styles.noteTypeButtonTextActive,
                  ]}
                >
                  👤 個人ノート
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.noteTypeButton,
                  noteType === 'shared' && styles.noteTypeButtonActive,
                ]}
                onPress={() => setNoteType('shared')}
                disabled={isBusy}
              >
                <Text
                  style={[
                    styles.noteTypeButtonText,
                    noteType === 'shared' && styles.noteTypeButtonTextActive,
                  ]}
                >
                  🤝 共有ノート
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI日記本文（completedまたはedited状態のときのみ表示） */}
          {hasAiDiary ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>AI日記</Text>
              <Text style={styles.fieldCaption}>
                内容を直接編集できます
              </Text>
              <TextInput
                style={[styles.input, styles.inputMultiline, styles.aiDiaryInput]}
                value={aiDiary}
                onChangeText={setAiDiary}
                placeholder="AI日記を入力"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={6}
                maxLength={500}
                textAlignVertical="top"
                editable={!isBusy}
              />
            </View>
          ) : null}

          {/* ── この日の流れ（フロー管理） ── */}
          <View style={styles.flowSection}>
            <Text style={styles.flowSectionTitle}>この日の流れ</Text>
            <Text style={styles.flowSectionDesc}>
              写真の撮影時間と位置情報から、1日の流れを作成・管理できます。
            </Text>
            <View style={styles.flowButtonRow}>
              <TouchableOpacity
                style={styles.flowButton}
                onPress={() => router.push(`/(app)/notes/${noteId}/flow-settings`)}
                disabled={isBusy}
              >
                <Text style={styles.flowButtonText}>フロー分割設定</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.flowButton, recreatingFlow && styles.flowButtonDisabled]}
                onPress={handleRecreateFlow}
                disabled={isBusy || recreatingFlow}
              >
                {recreatingFlow ? (
                  <ActivityIndicator size="small" color={colors.mapAccent} />
                ) : (
                  <Text style={styles.flowButtonText}>この日の流れを再作成</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 保存ボタン（スクロール内でも押せるよう補助） */}
          <TouchableOpacity
            style={[styles.primaryButton, isBusy && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isBusy}
            activeOpacity={0.85}
          >
            {isUpdating ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>保存する</Text>
            )}
          </TouchableOpacity>

          {/* Phase 11: owner のみ削除ボタンを表示 */}
          {userCanDelete ? (
            <>
              <TouchableOpacity
                style={[styles.deleteButton, isBusy && styles.buttonDisabled]}
                onPress={handleDelete}
                disabled={isBusy}
                activeOpacity={0.85}
              >
                {isDeleting ? (
                  <ActivityIndicator color={colors.error} size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>このノートを削除する</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.deleteCaption}>
                削除すると写真も含めて完全に消去されます
              </Text>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 20,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fieldCaption: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: -2,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 12,
  },
  aiDiaryInput: {
    minHeight: 130,
    lineHeight: 24,
  },
  noteTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noteTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  noteTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  noteTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  noteTypeButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.error,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
  deleteCaption: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: -12,
  },
  saveButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 44,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // フロー管理セクション
  flowSection: {
    gap: 10,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  flowSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  flowSectionDesc: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  flowButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flowButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.mapAccent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  flowButtonDisabled: {
    opacity: 0.6,
  },
  flowButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mapAccent,
  },
});
