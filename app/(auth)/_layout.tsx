import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/src/features/auth/AuthProvider';

export default function AuthLayout() {
  const { loading, session } = useAuth();

  if (loading) return null;

  if (session) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Stack />;
}
