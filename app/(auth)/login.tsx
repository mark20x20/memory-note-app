import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { authRepository } from '@/core/repositories/authRepository';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await authRepository.signIn(email.trim(), password);
      // Navigation handled by useAuthSession in index.tsx
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApple = () => {
    Alert.alert('Apple Sign-In', 'Apple Sign-In は近日対応予定です。');
  };

  const handleGoogle = () => {
    Alert.alert('Google Sign-In', 'Google Sign-In は近日対応予定です。');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.appName}>Memory Note</Text>
            <Text style={styles.tagline}>
              写真を選ぶだけで{'\n'}思い出ノートを作ろう
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="パスワード"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleEmailLogin}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isLoading && styles.disabled]}
              onPress={handleEmailLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>ログイン</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signUpLink}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Text style={styles.signUpLinkText}>
                アカウントをお持ちでない方は <Text style={styles.signUpLinkHighlight}>新規登録</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.button, styles.appleButton]}
              onPress={handleApple}
            >
              <Text style={styles.appleButtonText}> Apple で続ける</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogle}
            >
              <Text style={styles.googleButtonText}> Google で続ける</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            続けることで、
            <Text style={styles.termsLink}>利用規約</Text>
            {' および '}
            <Text style={styles.termsLink}>プライバシーポリシー</Text>
            {'\nに同意したことになります'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
  },
  form: {
    width: width - 64,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4A90D9',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  signUpLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  signUpLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpLinkHighlight: {
    color: '#4A90D9',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width - 64,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#9CA3AF',
  },
  socialButtons: {
    width: width - 64,
    gap: 12,
    marginBottom: 32,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#4A90D9',
    textDecorationLine: 'underline',
  },
});
