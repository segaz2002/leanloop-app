import { useColorScheme as useRNColorScheme } from 'react-native';

import { useThemePreferenceOptional } from '@/src/features/settings/ThemePreferenceProvider';

export function useColorScheme() {
  const pref = useThemePreferenceOptional();
  if (pref) return pref.resolved;
  return useRNColorScheme();
}
