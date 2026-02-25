import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/src/features/auth/AuthProvider';

export default function AppLayout() {
  const { loading, session } = useAuth();

  if (loading) return null;

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="workout/[id]" options={{ headerShown: true, title: 'Workout' }} />
    </Stack>
  );
}
