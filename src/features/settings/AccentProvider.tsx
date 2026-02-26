import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Accent = 'teal' | 'yellow' | 'pink';

const STORAGE_KEY = 'leanloop.accent';

const ACCENT_COLORS: Record<Accent, { solid: string; soft: string; textOn: string }> = {
  teal: { solid: '#0f766e', soft: 'rgba(15, 118, 110, 0.14)', textOn: '#ffffff' },
  yellow: { solid: '#fbbf24', soft: 'rgba(251, 191, 36, 0.18)', textOn: '#111827' },
  pink: { solid: '#ec4899', soft: 'rgba(236, 72, 153, 0.16)', textOn: '#ffffff' },
};

type AccentContextValue = {
  accent: Accent;
  setAccent: (a: Accent) => Promise<void>;
  accentColor: string;
  accentSoft: string;
  accentTextOn: string;
};

const AccentContext = createContext<AccentContextValue | null>(null);

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<Accent>('yellow');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'teal' || saved === 'yellow' || saved === 'pink') setAccentState(saved);
    })();
  }, []);

  const value = useMemo<AccentContextValue>(() => {
    const entry = ACCENT_COLORS[accent];
    return {
      accent,
      setAccent: async (a) => {
        setAccentState(a);
        await AsyncStorage.setItem(STORAGE_KEY, a);
      },
      accentColor: entry.solid,
      accentSoft: entry.soft,
      accentTextOn: entry.textOn,
    };
  }, [accent]);

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

export function useAccent() {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error('useAccent must be used within AccentProvider');
  return ctx;
}
