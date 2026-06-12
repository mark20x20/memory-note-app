import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/core/auth/AuthContext';
import { authRepository } from '@/core/repositories/authRepository';
import { ScreenHeader } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';

export default function SettingsScreen() {
  const authState = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = authState.status === 'signedIn' ? authState.user.displayName : '';
  const email = authState.status === 'signedIn' ? authState.user.email : '';
  const plan = authState.status === 'signedIn' ? authState.user.plan : 'free';

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
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

  const initials = displayName ? displayName.slice(0, 1).toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="設定"
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName || '未設定'}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{email || '未設定'}</Text>
            </View>
            <View style={[styles.planBadge, plan === 'pro' && styles.planBadgePro]}>
              <Text style={[styles.planBadgeText, plan === 'pro' && styles.planBadgeTextPro]}>
                {plan === 'pro' ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={styles.card}>
            <SettingsRow label="表示名" value={displayName || '未設定'} />
            <RowDivider />
            <SettingsRow label="メールアドレス" value={email || '未設定'} truncate />
            <RowDivider />
            <SettingsRow label="プラン" value={plan === 'pro' ? 'Pro' : '無料'} />
          </View>
        </View>

        {/* Privacy & permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プライバシー・権限</Text>
          <View style={styles.card}>
            <SettingsLinkRow label="写真・位置情報の権限" />
            <RowDivider />
            <SettingsLinkRow label="データとプライバシー" />
            <RowDivider />
            <SettingsLinkRow label="AIの利用について" />
          </View>
        </View>

        {/* Support & legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サポート・情報</Text>
          <View style={styles.card}>
            <SettingsLinkRow label="利用規約" />
            <RowDivider />
            <SettingsLinkRow label="プライバシーポリシー" />
            <RowDivider />
            <SettingsLinkRow label="お問い合わせ" />
          </View>
        </View>

        {/* Dev tools — __DEV__ only */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>開発用ツール</Text>
            <View style={styles.card}>
              <SettingsLinkRow
                label="開発用: Place Callable Test"
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
          >
            {isLoggingOut ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={styles.logoutText}>ログアウト</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.versionNote}>Memory Note v1.0 (Phase 4)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={truncate ? 1 : undefined}>
        {value}
      </Text>
    </View>
  );
}

function SettingsLinkRow({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowArrow}>›</Text>
    </TouchableOpacity>
  );
}

function RowDivider() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 40,
  },
  // Profile
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  planBadge: {
    backgroundColor: colors.surfaceIvory,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: 15,
    color: colors.textSecondary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  rowArrow: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
  // Logout
  logoutButton: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  versionNote: {
    marginTop: 24,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
