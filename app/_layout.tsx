import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from '@/src/features/auth/AuthProvider';
import { ThemePreferenceProvider, useThemePreference } from '@/src/features/settings/ThemePreferenceProvider';
import { UnitsProvider } from '@/src/features/settings/UnitsProvider';
import { AccentProvider } from '@/src/features/settings/AccentProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(app)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  // Fallback for any UI that still uses the template hook.
  useColorScheme();

  return (
    <AuthProvider>
      <UnitsProvider>
        <AccentProvider>
          <ThemePreferenceProvider>
            <ThemeNav />
          </ThemePreferenceProvider>
        </AccentProvider>
      </UnitsProvider>
    </AuthProvider>
  );
}

function ThemeNav() {
  const { resolved } = useThemePreference();

  return (
    <ThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
