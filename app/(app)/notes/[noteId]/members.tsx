// Phase 11: ノートメンバー管理画面
// - owner のみ: メンバー追加・ロール変更・削除
// - owner 以外: 閲覧のみ（操作 UI は非表示）
// - owner 自身は削除不可・ロール変更不可

import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useNoteMembers } from '@/features/memoryNotes/hooks/useNoteMembers';
import { useManageNoteMembers } from '@/features/memoryNotes/hooks/useManageNoteMembers';
import { canManageMembers } from '@/features/memoryNotes/utils/permissions';
import type { MemberRole } from '@/core/repositories/noteRepository';

// ────────────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  editor: '編集者',
  viewer: '閲覧者',
};

const ROLE_BADGE_STYLE: Record<MemberRole, object> = {
  owner: { backgroundColor: colors.primary },
  editor: { backgroundColor: colors.mapAccent },
  viewer: { backgroundColor: colors.gray200 },
};

const ROLE_BADGE_TEXT_STYLE: Record<MemberRole, object> = {
  owner: { color: colors.textInverse },
  editor: { color: colors.textInverse },
  viewer: { color: colors.textSecondary },
};

// ────────────────────────────────────────────────────────────────────────────

export default function NoteMembersScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note, isLoading: noteLoading } = useNoteDetail(noteId ?? null);
  const { members, isLoading: membersLoading } = useNoteMembers(note);
  const { addMember, updateRole, removeMember, isLoading: managing, error, clearError } = useManageNoteMembers();

  // 追加フォームの状態
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'editor' | 'viewer'>('editor');

  const isOwner = uid && note ? canManageMembers(note, uid) : false;
  const isLoading = noteLoading || membersLoading;

  const handleAddMember = async () => {
    if (!noteId || !addEmail.trim()) {
      Alert.alert('入力エラー', 'メールアドレスを入力してください');
      return;
    }
    clearError();
    try {
      await addMember(noteId, addEmail.trim(), addRole);
      setAddEmail('');
    } catch {
      // error は hook の state に格納済み
    }
  };

  const handleUpdateRole = (targetUid: string, newRole: 'editor' | 'viewer') => {
    if (!noteId) return;
    clearError();
    Alert.alert(
      '権限を変更',
      `${ROLE_LABELS[newRole]}に変更しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '変更する',
          onPress: async () => {
            try {
              await updateRole(noteId, targetUid, newRole);
            } catch {
              // error は hook の state に格納済み
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (targetUid: string, displayName: string) => {
    if (!noteId) return;
    clearError();
    Alert.alert(
      'メンバーを削除',
      `${displayName}をこのノートから削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(noteId, targetUid);
            } catch {
              // error は hook の state に格納済み
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="メンバー管理" onBack={() => router.back()} />
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
        <ScreenHeader title="メンバー管理" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorText}>ノートが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="メンバー管理" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ノートタイトル */}
        <Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>

        {/* エラー表示 */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* メンバー一覧 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>メンバー ({members.length}人)</Text>
          <View style={styles.memberList}>
            {members.map((member, index) => (
              <View
                key={member.uid}
                style={[
                  styles.memberRow,
                  index < members.length - 1 && styles.memberRowBorder,
                ]}
              >
                {/* アバター */}
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* 名前・メール */}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.displayName}
                    {member.uid === uid ? ' (あなた)' : ''}
                  </Text>
                  {member.email ? (
                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {member.email}
                    </Text>
                  ) : null}
                </View>

                {/* ロールバッジ */}
                <View style={[styles.roleBadge, ROLE_BADGE_STYLE[member.role]]}>
                  <Text style={[styles.roleBadgeText, ROLE_BADGE_TEXT_STYLE[member.role]]}>
                    {ROLE_LABELS[member.role]}
                  </Text>
                </View>

                {/* Owner かつ対象が自分以外の場合のみ操作ボタンを表示 */}
                {isOwner && member.uid !== uid && member.role !== 'owner' ? (
                  <View style={styles.memberActions}>
                    {/* ロール変更ボタン */}
                    <TouchableOpacity
                      style={[styles.actionButton, managing && styles.buttonDisabled]}
                      onPress={() =>
                        handleUpdateRole(
                          member.uid,
                          member.role === 'editor' ? 'viewer' : 'editor'
                        )
                      }
                      disabled={managing}
                      hitSlop={4}
                    >
                      <Text style={styles.actionButtonText}>
                        {member.role === 'editor' ? '閲覧者に' : '編集者に'}
                      </Text>
                    </TouchableOpacity>
                    {/* 削除ボタン */}
                    <TouchableOpacity
                      style={[styles.removeButton, managing && styles.buttonDisabled]}
                      onPress={() => handleRemoveMember(member.uid, member.displayName)}
                      disabled={managing}
                      hitSlop={4}
                    >
                      <Text style={styles.removeButtonText}>削除</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* 操作中インジケータ */}
                {managing ? null : null}
              </View>
            ))}
          </View>
        </View>

        {/* メンバー追加フォーム（owner のみ） */}
        {isOwner ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>メンバーを追加</Text>
            <View style={styles.addFormCard}>
              {/* メールアドレス入力 */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>メールアドレス</Text>
                <TextInput
                  style={styles.input}
                  value={addEmail}
                  onChangeText={setAddEmail}
                  placeholder="user@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!managing}
                />
              </View>

              {/* ロール選択 */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>権限</Text>
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      addRole === 'editor' && styles.roleButtonActive,
                    ]}
                    onPress={() => setAddRole('editor')}
                    disabled={managing}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        addRole === 'editor' && styles.roleButtonTextActive,
                      ]}
                    >
                      編集者
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      addRole === 'viewer' && styles.roleButtonActive,
                    ]}
                    onPress={() => setAddRole('viewer')}
                    disabled={managing}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        addRole === 'viewer' && styles.roleButtonTextActive,
                      ]}
                    >
                      閲覧者
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 権限説明 */}
              <View style={styles.roleDescCard}>
                <Text style={styles.roleDescText}>
                  {addRole === 'editor'
                    ? '編集者: ノートの閲覧・編集・AI日記生成ができます。メンバー管理・削除は不可。'
                    : '閲覧者: ノートと写真・AI日記の閲覧のみできます。編集・生成は不可。'}
                </Text>
              </View>

              {/* 追加ボタン */}
              <TouchableOpacity
                style={[styles.addButton, managing && styles.buttonDisabled]}
                onPress={handleAddMember}
                disabled={managing}
                activeOpacity={0.85}
              >
                {managing ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={styles.addButtonText}>追加する</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.viewerNotice}>
            <Text style={styles.viewerNoticeText}>
              メンバーの追加・変更は owner のみ行えます。
            </Text>
          </View>
        )}
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
    gap: 8,
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
    paddingBottom: 48,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    letterSpacing: -0.3,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  // Member list
  memberList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    flexShrink: 0,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  roleBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mapAccent,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  removeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.error,
  },
  // Add member form
  addFormCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  roleButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  roleDescCard: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 10,
    padding: 12,
  },
  roleDescText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  addButton: {
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
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  viewerNotice: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.surfaceIvory,
    borderRadius: 12,
    padding: 14,
  },
  viewerNoticeText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
