import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  // Phase 0: 仮実装。Phase 1 で Firebase Auth を接続する
  const handleLoginWithApple = () => {
    // TODO Phase 1: Apple Sign-In
    router.replace('/(app)/home');
  };

  const handleLoginWithGoogle = () => {
    // TODO Phase 1: Google Sign-In
    router.replace('/(app)/home');
  };

  const handleLoginWithEmail = () => {
    // TODO Phase 1: Email / Password
    router.replace('/(app)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>Memory Note</Text>
          <Text style={styles.tagline}>
            写真を選ぶだけで{'\n'}思い出ノートを作ろう
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={handleLoginWithApple}
          >
            <Text style={styles.appleButtonText}> Apple で続ける</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleLoginWithGoogle}
          >
            <Text style={styles.googleButtonText}> Google で続ける</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.emailButton]}
            onPress={handleLoginWithEmail}
          >
            <Text style={styles.emailButtonText}> メールで続ける</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          続けることで、
          <Text style={styles.termsLink}>利用規約</Text>
          {' および '}
          <Text style={styles.termsLink}>プライバシーポリシー</Text>
          {'\nに同意したことになります'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 56,
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
  buttons: {
    width: width - 64,
    gap: 12,
    marginBottom: 32,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
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
  emailButton: {
    backgroundColor: '#F3F4F6',
  },
  emailButtonText: {
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
