import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { connectToEmulators } from '@/core/firebase/emulator';
import { AuthProvider } from '@/core/auth/AuthContext';

export default function RootLayout() {
  useEffect(() => {
    connectToEmulators();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
