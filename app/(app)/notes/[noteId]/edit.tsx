// Phase 10: ノート編集画面
// タイトル・メモ・ノート種別・AI日記本文を編集し保存する。
// 削除ボタンで確認ダイアログを表示してノートを削除する。

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
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useUpdateNote } from '@/features/memoryNotes/hooks/useUpdateNote';
import { useDeleteNote } from '@/features/memoryNotes/hooks/useDeleteNote';
import type { NoteType } from '@/core/repositories/noteRepository';

export default function NoteEditScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const { note, isLoading } = useNoteDetail(noteId ?? null);
  const { update, isUpdating, error: updateError } = useUpdateNote();
  const { deleteNote, isDeleting, error: deleteError } = useDeleteNote();

  // フォームの状態
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('personal');
  const [aiDiary, setAiDiary] = useState('');
  const [initialized, setInitialized] = useState(false);

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

  const hasAiDiary =
    note?.aiDiaryStatus === 'completed' ||
    note?.aiDiaryStatus === 'edited';

  const handleSave = async () => {
    if (!noteId) return;
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

          {/* 削除ボタン */}
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
});
