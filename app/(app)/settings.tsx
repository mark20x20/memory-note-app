// UI-23: Settings Screen Polish
// warm / calm なデザインに統一。ScreenHeader → カスタムヘッダー。
// Profile Card に photoURL 対応 + fallback 改善。
// Alert テキスト・バージョン表記を整理。既存ロジックは一切変更なし。

import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/core/auth/AuthContext';
import { authRepository } from '@/core/repositories/authRepository';
import { colors } from '@/shared/theme/colors';
import { borderRadius } from '@/shared/theme/spacing';

export default function SettingsScreen() {
  const authState = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = authState.status === 'signedIn' ? authState.user.displayName : '';
  const email = authState.status === 'signedIn' ? authState.user.email : '';
  const plan = authState.status === 'signedIn' ? authState.user.plan : 'free';
  const photoURL = authState.status === 'signedIn' ? authState.user.photoURL : null;

  const handleLogout = () => {
    Alert.alert(
      'ログアウトしますか？',
      'この端末からアカウントをログアウトします。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await authRepository.logout();
              router.replace('/(auth)/onboarding');
            } catch {
              Alert.alert('エラー', 'ログアウトに失敗しました。');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const displayNameLabel = displayName || '思い出ノートユーザー';
  const emailLabel = email || 'メールアドレス未設定';
  const initials = displayName ? displayName.slice(0, 1).toUpperCase() : '📔';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* カスタムヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>設定</Text>
          <Text style={styles.headerSubtitle}>アカウントとアプリの設定</Text>
        </View>
        {/* 右スペーサー（戻るボタンと対称にするためのダミー） */}
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{displayNameLabel}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{emailLabel}</Text>
            </View>
            <View style={[styles.planBadge, plan === 'pro' && styles.planBadgePro]}>
              <Text style={[styles.planBadgeText, plan === 'pro' && styles.planBadgeTextPro]}>
                {plan === 'pro' ? 'Pro' : '無料'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={styles.card}>
            <SettingsRow label="表示名" value={displayNameLabel} />
            <RowDivider />
            <SettingsRow label="メールアドレス" value={emailLabel} truncate />
            <RowDivider />
            <SettingsRow label="プラン" value={plan === 'pro' ? 'Pro' : '無料プラン'} />
          </View>
        </View>

        {/* App section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリ</Text>
          <View style={styles.card}>
            <SettingsLinkRow label="利用規約" comingSoon />
            <RowDivider />
            <SettingsLinkRow label="プライバシーポリシー" comingSoon />
            <RowDivider />
            <SettingsLinkRow label="お問い合わせ" comingSoon />
          </View>
        </View>

        {/* Dev tools — __DEV__ only */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>開発者メニュー</Text>
            <View style={styles.card}>
              <SettingsLinkRow
                label="Place Callable テスト"
                onPress={() => router.push('/(app)/dev/place-callable-test' as any)}
              />
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, isLoggingOut && styles.disabled]}
            onPress={handleLogout}
            disabled={isLoggingOut}
            activeOpacity={0.8}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <Text style={styles.logoutText}>ログアウト</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.versionNote}>Memory Note v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SettingsRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={truncate ? 1 : undefined}>
        {value}
      </Text>
    </View>
  );
}

function SettingsLinkRow({
  label,
  onPress,
  comingSoon,
}: {
  label: string;
  onPress?: () => void;
  comingSoon?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={comingSoon || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.rowLabel, comingSoon && styles.rowLabelMuted]}>{label}</Text>
      {comingSoon ? (
        <Text style={styles.comingSoonBadge}>準備中</Text>
      ) : (
        <Text style={styles.rowArrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

function RowDivider() {
  return <View style={styles.separator} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Custom header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceIvory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 26,
    lineHeight: 30,
    color: colors.textPrimary,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  scroll: {
    paddingBottom: 48,
  },

  // Profile card
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  planBadge: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planBadgePro: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  planBadgeTextPro: {
    color: colors.primary,
  },

  // Sections
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  rowLabelMuted: {
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  rowArrow: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  comingSoonBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    backgroundColor: colors.surfaceIvory,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },

  // Logout
  logoutButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EF9999',
  },
  logoutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },

  versionNote: {
    marginTop: 28,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
