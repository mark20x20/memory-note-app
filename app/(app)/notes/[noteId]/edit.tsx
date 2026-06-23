// Phase 10: ノート編集画面
// Phase 11: 権限制御を追加。
// Phase 12.5G-4: フロー管理セクションを追加。
// UI-1: 5タブシェル化 (Overview / Photos / Flows / Places / Memo)
// UI-2: タブに実データを接続。useNoteEditDraft でdraft stateを一元管理。
// UI-3A: usePlaceGroups を導入。FlowsPanel / PlacesPanel の二重購読を解消。

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, EditTabBar, StickyBottomBar } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteEditDraft } from '@/features/memoryNotes/hooks/useNoteEditDraft';
import { useNotePhotos } from '@/features/photos/hooks/useNotePhotos';
import { useDeleteNote } from '@/features/memoryNotes/hooks/useDeleteNote';
import { usePlaceGroups } from '@/features/placeIntelligence/hooks/usePlaceGroups';
import { canEdit, canDelete, canGenerateAiDiary, canManageMembers } from '@/features/memoryNotes/utils/permissions';
import { useGenerateDiary } from '@/features/memoryNotes/hooks/useGenerateDiary';
import { useManageNoteMembers } from '@/features/memoryNotes/hooks/useManageNoteMembers';
import type { EditTabKey } from '@/features/memoryNotes/types/edit';
import { OverviewPanel } from '@/features/memoryNotes/components/edit/panels/OverviewPanel';
import { PhotosPanel } from '@/features/memoryNotes/components/edit/panels/PhotosPanel';
import { FlowsPanel } from '@/features/memoryNotes/components/edit/panels/FlowsPanel';
import { PlacesPanel } from '@/features/memoryNotes/components/edit/panels/PlacesPanel';
import { MemoPanel } from '@/features/memoryNotes/components/edit/panels/MemoPanel';

const TABS: { key: EditTabKey; label: string }[] = [
  { key: 'overview', label: '概要' },
  { key: 'photos', label: '写真' },
  { key: 'flows', label: '流れ' },
  { key: 'places', label: '場所' },
  { key: 'memo', label: 'メモ' },
];

export default function NoteEditScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  // draft stateはuseNoteEditDraftが一元管理
  const {
    note,
    isLoadingNote,
    draft,
    updateField,
    isDirty,
    isSaving,
    saveError,
    resetDraft,
    saveDraft,
  } = useNoteEditDraft(noteId ?? null);

  const { photos, isLoading: photosLoading } = useNotePhotos(noteId ?? null);
  const { deleteNote, isDeleting, error: deleteError } = useDeleteNote();
  const { generate: generateDiary, isGenerating: isGeneratingDiary, error: generateDiaryError } = useGenerateDiary();
  const { convertToPersonal, isLoading: isManaging } = useManageNoteMembers();
  const { groups: placeGroups, isLoading: groupsLoading } = usePlaceGroups(noteId ?? null);

  // タブ state
  const [activeTab, setActiveTab] = useState<EditTabKey>('overview');

  // 権限チェック
  const userCanEdit = uid && note ? canEdit(note, uid) : false;
  const userCanDelete = uid && note ? canDelete(note, uid) : false;
  const userCanGenerateAiDiary = uid && note ? canGenerateAiDiary(note, uid) : false;
  const isOwner = uid && note ? canManageMembers(note, uid) : false;

  const isBusy = isSaving || isDeleting || isManaging;

  const handleSave = async () => {
    if (!userCanEdit) return;
    if (!draft?.title.trim()) {
      Alert.alert('入力エラー', 'タイトルを入力してください');
      return;
    }
    try {
      await saveDraft();
      router.back();
    } catch {
      // saveError は useNoteEditDraft の state に格納済み
    }
  };

  // UI-16B: メンバーと共有する → メンバー招待画面へ（noteType は招待成功時に CF が変更）
  const handleRequestShare = () => {
    if (!noteId) return;
    router.push(`/(app)/notes/${noteId}/members` as any);
  };

  // UI-16B: shared → personal（owner のみ）
  const handleConvertToPersonal = async () => {
    if (!noteId) return;
    try {
      await convertToPersonal(noteId);
      router.back();
    } catch {
      Alert.alert('エラー', '個人ノートへの変換に失敗しました。もう一度お試しください。');
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
            } catch {
              // error は useDeleteNote の state に格納済み
            }
          },
        },
      ]
    );
  };

  // ── ローディング・エラー状態 ───────────────────────────────────────────────

  if (isLoadingNote || !draft) {
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
          <Text style={styles.errorText}>ノートが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Phase 11: viewer は編集不可
  if (!userCanEdit) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="編集" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>🔒 編集権限がありません</Text>
          <Text style={styles.errorDetail}>
            このノートを編集するには editor 以上の権限が必要です。
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── メイン画面 ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="編集"
        onBack={() => router.back()}
        rightElement={
          <TouchableOpacity
            onPress={() => router.push(`/(app)/notes/${noteId}/preview` as any)}
            hitSlop={8}
          >
            <Text style={styles.previewButtonText}>プレビュー</Text>
          </TouchableOpacity>
        }
      />

      {/* タブバー */}
      <EditTabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* エラー表示 */}
        {(saveError || deleteError) ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {saveError ?? deleteError}
            </Text>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── パネル ── */}
          {activeTab === 'overview' && (
            <OverviewPanel
              draft={draft}
              updateField={updateField}
              note={note}
              photos={photos}
              isBusy={isBusy}
              isOwner={!!isOwner}
              onRequestShare={handleRequestShare}
              onConvertToPersonal={handleConvertToPersonal}
            />
          )}

          {activeTab === 'photos' && (
            <PhotosPanel
              noteId={noteId ?? ''}
              photos={photos}
              photosLoading={photosLoading}
              note={note}
              isBusy={isBusy}
            />
          )}

          {activeTab === 'flows' && (
            <FlowsPanel
              noteId={noteId ?? ''}
              groups={placeGroups}
              isLoadingGroups={groupsLoading}
              isBusy={isBusy}
            />
          )}

          {activeTab === 'places' && (
            <PlacesPanel
              noteId={noteId ?? ''}
              groups={placeGroups}
              isLoadingGroups={groupsLoading}
              userCanEdit={!!userCanEdit}
            />
          )}

          {activeTab === 'memo' && (
            <MemoPanel
              draft={draft}
              updateField={updateField}
              aiDiaryStatus={note.aiDiaryStatus ?? null}
              isBusy={isBusy}
              canGenerate={!!userCanGenerateAiDiary}
              onGenerateDiary={noteId ? () => generateDiary(noteId) : undefined}
              isGeneratingDiary={isGeneratingDiary}
              generateDiaryError={generateDiaryError}
            />
          )}

          {/* 削除ボタン（owner のみ・概要タブ内） */}
          {userCanDelete && activeTab === 'overview' ? (
            <View style={styles.deleteArea}>
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
            </View>
          ) : null}
        </ScrollView>

        {/* スティッキーボトムバー */}
        <StickyBottomBar>
          <TouchableOpacity
            style={[styles.cancelButton, isBusy && styles.buttonDisabled]}
            onPress={() => {
              if (isDirty) {
                Alert.alert(
                  '変更を破棄しますか？',
                  '保存されていない変更があります。',
                  [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                      text: '破棄する',
                      style: 'destructive',
                      onPress: () => { resetDraft(); router.back(); },
                    },
                  ]
                );
              } else {
                router.back();
              }
            }}
            disabled={isBusy}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !isDirty && styles.saveButtonInactive,
              isBusy && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={isBusy || !isDirty}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={[styles.saveButtonText, !isDirty && styles.saveButtonTextInactive]}>
                保存する
              </Text>
            )}
          </TouchableOpacity>
        </StickyBottomBar>
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
  previewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  scroll: {
    paddingBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: colors.error,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  // Delete
  deleteArea: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: borderRadius.md,
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // StickyBottomBar buttons
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonInactive: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
  saveButtonTextInactive: {
    color: colors.textTertiary,
  },
});
