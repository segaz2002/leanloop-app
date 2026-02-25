import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 'leanloop.themeMode';

type ThemePreferenceValue = {
  mode: ThemeMode;
  resolved: ResolvedScheme;
  setMode: (m: ThemeMode) => Promise<void>;
};

const ThemePreferenceContext = createContext<ThemePreferenceValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const system = useRNColorScheme();
  const systemResolved: ResolvedScheme = system === 'dark' ? 'dark' : 'light';

  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        setModeState(saved);
      }
    })();
  }, []);

  const resolved: ResolvedScheme = mode === 'system' ? systemResolved : mode;

  const value = useMemo<ThemePreferenceValue>(() => {
    return {
      mode,
      resolved,
      setMode: async (m) => {
        setModeState(m);
        await AsyncStorage.setItem(STORAGE_KEY, m);
      },
    };
  }, [mode, resolved]);

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  return ctx;
}

export function useThemePreferenceOptional() {
  return useContext(ThemePreferenceContext);
}
