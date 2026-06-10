import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { authRepository } from '@/core/repositories/authRepository';

const { width } = Dimensions.get('window');

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setError('すべての項目を入力してください。');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await authRepository.signUp(email.trim(), password);
      // onAuthStateChanged fires → useAuthSession detects no profile → profile-setup
      router.replace('/(auth)/profile-setup');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録に失敗しました。');
    } finally {
      setIsLoading(false);
    }
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>新規登録</Text>
            <Text style={styles.subtitle}>アカウントを作成してください</Text>
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
              placeholder="パスワード（6文字以上）"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="パスワード（確認）"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.disabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>アカウントを作成</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            登録することで、
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
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A90D9',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
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
    backgroundColor: '#4A90D9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
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
