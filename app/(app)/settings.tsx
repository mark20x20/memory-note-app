import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="設定"
        onBack={() => router.back()}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>表示名</Text>
            <Text style={styles.rowValue}>{displayName || '未設定'}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>メールアドレス</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{email || '未設定'}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>プラン</Text>
            <Text style={styles.rowValue}>{plan === 'pro' ? 'Pro' : '無料'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>サポート・情報</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>利用規約</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>プライバシーポリシー</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>お問い合わせ</Text>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionNote}>
          ※ 設定詳細・権限説明・プライバシー管理は Phase 14 で実装予定
        </Text>
      </View>

      <View style={styles.logoutSection}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionNote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
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
    color: colors.gray400,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
  logoutSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
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
});
