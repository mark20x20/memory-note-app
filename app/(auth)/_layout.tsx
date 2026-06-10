import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/core/auth/AuthContext';

export default function AuthLayout() {
  const authState = useAuth();

  if (authState.status === 'signedIn') {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
