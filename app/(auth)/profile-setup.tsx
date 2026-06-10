import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { auth } from '@/core/firebase/client';
import { userRepository } from '@/core/repositories/userRepository';

const { width } = Dimensions.get('window');

export default function ProfileSetupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uid = auth?.currentUser?.uid ?? null;
  const email = auth?.currentUser?.email ?? null;

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('表示名を入力してください。');
      return;
    }
    if (!uid) {
      setError('認証情報が取得できません。再度ログインしてください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await userRepository.createUser(uid, email, displayName.trim());
      router.replace('/(app)/home');
    } catch {
      setError('プロフィールの保存に失敗しました。もう一度お試しください。');
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
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.emoji}>👤</Text>
            <Text style={styles.title}>プロフィールを設定</Text>
            <Text style={styles.subtitle}>
              アプリ内で表示される名前を入力してください
            </Text>
            {email && <Text style={styles.emailLabel}>{email}</Text>}
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="表示名（例：田中 花子）"
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              maxLength={50}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, (!displayName.trim() || isLoading) && styles.disabled]}
              onPress={handleSave}
              disabled={!displayName.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>保存して始める</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  emailLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  form: {
    width: width - 64,
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
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});
