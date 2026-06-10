import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';

export default function Index() {
  const authState = useAuthSession();

  if (authState.status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (authState.status === 'signedIn') {
    return <Redirect href="/(app)/home" />;
  }

  if (authState.status === 'needsProfileSetup') {
    return <Redirect href="/(auth)/profile-setup" />;
  }

  return <Redirect href="/(auth)/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
