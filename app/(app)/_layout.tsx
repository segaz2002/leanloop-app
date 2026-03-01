import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/src/features/auth/AuthProvider';
import { RevenueCatProvider } from '@/src/providers/RevenueCatProvider';

export default function AppLayout() {
  const { loading, session, user } = useAuth();

  if (loading) return null;

  if (!session || !user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <RevenueCatProvider userId={user.id}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[id]" options={{ headerShown: true, title: 'Workout' }} />
        <Stack.Screen name="paywall" options={{ headerShown: true, title: 'Subscribe', presentation: 'modal' }} />
      </Stack>
    </RevenueCatProvider>
  );
}
