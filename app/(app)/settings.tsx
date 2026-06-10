import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { authRepository } from '@/core/repositories/authRepository';

export default function SettingsScreen() {
  const authState = useAuthSession();
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>設定</Text>
        <View style={styles.placeholder} />
      </View>

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
            <Text style={styles.rowValue}>{email || '未設定'}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>プラン</Text>
            <Text style={styles.rowValue}>{plan === 'pro' ? 'Pro' : '無料'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>その他</Text>
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

      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.disabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#EF4444" />
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backText: {
    fontSize: 16,
    color: '#4A90D9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
  },
  rowValue: {
    fontSize: 15,
    color: '#6B7280',
    maxWidth: '60%',
    textAlign: 'right',
  },
  rowArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 16,
  },
  logoutSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
