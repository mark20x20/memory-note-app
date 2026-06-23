// Phase 11: ノートメンバー管理画面
// UI-10: Note summary card / Role guide 追加 / UIトーン warm/safe/clear に整備
//
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';
import { useAuth } from '@/core/auth/AuthContext';
import { useNoteDetail } from '@/features/memoryNotes/hooks/useNoteDetail';
import { useNoteMembers } from '@/features/memoryNotes/hooks/useNoteMembers';
import { useManageNoteMembers } from '@/features/memoryNotes/hooks/useManageNoteMembers';
import { canManageMembers } from '@/features/memoryNotes/utils/permissions';
import type { MemberRole } from '@/core/repositories/noteRepository';

// ────────────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'オーナー',
  editor: '編集者',
  viewer: '閲覧者',
};

const ROLE_BADGE_BG: Record<MemberRole, string> = {
  owner: colors.primary,
  editor: colors.mapAccent,
  viewer: colors.gray200,
};

const ROLE_BADGE_TEXT: Record<MemberRole, string> = {
  owner: colors.textInverse,
  editor: colors.textInverse,
  viewer: colors.textSecondary,
};

function formatDate(ts: { toDate: () => Date } | null | undefined): string | null {
  if (!ts || typeof ts.toDate !== 'function') return null;
  const d = ts.toDate();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ── Role Guide Row ─────────────────────────────────────────────────────────

function RoleGuideRow({
  role,
  description,
}: {
  role: MemberRole;
  description: string;
}) {
  return (
    <View style={styles.roleGuideRow}>
      <View style={[styles.roleGuideBadge, { backgroundColor: ROLE_BADGE_BG[role] }]}>
        <Text style={[styles.roleGuideBadgeText, { color: ROLE_BADGE_TEXT[role] }]}>
          {ROLE_LABELS[role]}
        </Text>
      </View>
      <Text style={styles.roleGuideDesc}>{description}</Text>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function NoteMembersScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const authState = useAuth();
  const uid = authState.status === 'signedIn' ? authState.user.uid : null;

  const { note, isLoading: noteLoading } = useNoteDetail(noteId ?? null);
  const { members, isLoading: membersLoading } = useNoteMembers(note);
  const { addMember, updateRole, removeMember, isLoading: managing, error, clearError } = useManageNoteMembers();

  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'editor' | 'viewer'>('editor');

  const isOwner = uid && note ? canManageMembers(note, uid) : false;
  const isLoading = noteLoading || membersLoading;

  // ── ハンドラ ────────────────────────────────────────────────────────────

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

  // ── ローディング / エラー ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="メンバー" onBack={() => router.back()} />
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
        <ScreenHeader title="メンバー" onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorStateEmoji}>🔍</Text>
          <Text style={styles.errorStateText}>ノートが見つかりませんでした</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateStr = formatDate(note.createdAt);

  // ── レンダー ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="メンバー" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Section 1: Note Summary Card ── */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            {/* カバー写真 */}
            {note.coverPhotoURL ? (
              <Image
                source={{ uri: note.coverPhotoURL }}
                style={styles.summaryPhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.summaryPhotoPlaceholder}>
                <Text style={styles.summaryPhotoEmoji}>📷</Text>
              </View>
            )}

            {/* ノート情報 */}
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle} numberOfLines={2}>{note.title}</Text>
              <View style={styles.summaryMetaRow}>
                {dateStr ? (
                  <Text style={styles.summaryMeta}>📅 {dateStr}</Text>
                ) : null}
              </View>
              <View style={styles.summaryBottomRow}>
                <View style={[
                  styles.summaryBadge,
                  note.noteType === 'shared' ? styles.summaryBadgeShared : styles.summaryBadgePersonal,
                ]}>
                  <Text style={styles.summaryBadgeText}>
                    {note.noteType === 'shared' ? '🤝 共有ノート' : '👤 個人ノート'}
                  </Text>
                </View>
                <Text style={styles.summaryMemberCount}>{members.length}人</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── エラーバナー ── */}
        {error ? (
          <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
            <Text style={styles.errorBannerText}>⚠️ {error}</Text>
            <Text style={styles.errorBannerDismiss}>閉じる</Text>
          </TouchableOpacity>
        ) : null}

        {/* ── Section 2: Member List ── */}
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
                <View style={[
                  styles.memberAvatar,
                  member.role === 'owner' && styles.memberAvatarOwner,
                ]}>
                  <Text style={styles.memberAvatarText}>
                    {member.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* 名前・メール */}
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.displayName}
                    </Text>
                    {member.uid === uid ? (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>あなた</Text>
                      </View>
                    ) : null}
                  </View>
                  {member.email ? (
                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {member.email}
                    </Text>
                  ) : null}
                </View>

                {/* ロールバッジ + 操作 */}
                <View style={styles.memberRight}>
                  <View style={[styles.roleBadge, { backgroundColor: ROLE_BADGE_BG[member.role] }]}>
                    <Text style={[styles.roleBadgeText, { color: ROLE_BADGE_TEXT[member.role] }]}>
                      {ROLE_LABELS[member.role]}
                    </Text>
                  </View>

                  {/* オーナーかつ対象が自分以外の場合のみ操作ボタンを表示 */}
                  {isOwner && member.uid !== uid && member.role !== 'owner' ? (
                    <View style={styles.memberActions}>
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
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Section 3: Invite Card / Viewer notice ── */}
        {isOwner ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>メンバーを招待</Text>
            <View style={styles.inviteCard}>
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
                    style={[styles.roleButton, addRole === 'editor' && styles.roleButtonActive]}
                    onPress={() => setAddRole('editor')}
                    disabled={managing}
                  >
                    <Text style={[styles.roleButtonText, addRole === 'editor' && styles.roleButtonTextActive]}>
                      編集者
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleButton, addRole === 'viewer' && styles.roleButtonActive]}
                    onPress={() => setAddRole('viewer')}
                    disabled={managing}
                  >
                    <Text style={[styles.roleButtonText, addRole === 'viewer' && styles.roleButtonTextActive]}>
                      閲覧者
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 権限説明 */}
              <View style={styles.roleDescCard}>
                <Text style={styles.roleDescText}>
                  {addRole === 'editor'
                    ? '編集者: 写真・メモの閲覧と編集ができます。メンバー管理は不可。'
                    : '閲覧者: 写真・AI日記の閲覧のみできます。編集・生成は不可。'}
                </Text>
              </View>

              {/* 招待ボタン */}
              <TouchableOpacity
                style={[styles.inviteButton, managing && styles.buttonDisabled]}
                onPress={handleAddMember}
                disabled={managing}
                activeOpacity={0.85}
              >
                {managing ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={styles.inviteButtonText}>招待する</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.viewerNotice}>
              <Text style={styles.viewerNoticeEmoji}>🔒</Text>
              <Text style={styles.viewerNoticeText}>
                メンバーの招待・変更はオーナーのみ行えます
              </Text>
            </View>
          </View>
        )}

        {/* ── Section 4: Role Guide ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>権限について</Text>
          <View style={styles.roleGuideCard}>
            <RoleGuideRow
              role="owner"
              description="メンバー管理と編集ができます"
            />
            <View style={styles.roleGuideDivider} />
            <RoleGuideRow
              role="editor"
              description="写真やメモを編集できます"
            />
            <View style={styles.roleGuideDivider} />
            <RoleGuideRow
              role="viewer"
              description="思い出を見ることができます"
            />
          </View>
        </View>

        <View style={styles.bottomPad} />
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
  errorStateEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scroll: {
    paddingBottom: 16,
  },
  bottomPad: {
    height: 32,
  },

  // Error banner
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
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

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Note summary card
  summarySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 0,
  },
  summaryPhoto: {
    width: 88,
    height: 88,
  },
  summaryPhotoPlaceholder: {
    width: 88,
    height: 88,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPhotoEmoji: {
    fontSize: 28,
    opacity: 0.4,
  },
  summaryInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    gap: 4,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryMeta: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  summaryBadgeShared: {
    backgroundColor: colors.primaryLight,
  },
  summaryBadgePersonal: {
    backgroundColor: colors.surfaceIvory,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  summaryMemberCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mapAccent,
  },

  // Member list
  memberList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 68,
    gap: 12,
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
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  memberAvatarOwner: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  youBadge: {
    backgroundColor: colors.mapAccentLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.mapAccent,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  memberRight: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  roleBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  removeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Invite card
  inviteCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
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
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.md,
    padding: 12,
  },
  roleDescText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  inviteButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },

  // Viewer notice
  viewerNotice: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewerNoticeEmoji: {
    fontSize: 20,
  },
  viewerNoticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Role guide
  roleGuideCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  roleGuideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  roleGuideDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  roleGuideBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  roleGuideBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  roleGuideDesc: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
