import { useMemo } from 'react';

import { useThemePreference } from '@/src/features/settings/ThemePreferenceProvider';
import { useAccent } from '@/src/features/settings/AccentProvider';
import { radius, shadow, spacing, typography } from '@/src/theme/tokens';

export type AppMode = 'light' | 'dark';

export function useAppTheme() {
  const { resolved } = useThemePreference();
  const mode: AppMode = resolved === 'dark' ? 'dark' : 'light';
  const { accent, accentColor, accentSoft, accentTextOn } = useAccent();

  const colors = useMemo(() => {
    if (mode === 'dark') {
      return {
        mode,
        bgPrimary: '#121212',
        bgSecondary: '#1E1E1E',
        surfaceCard: '#1E1E1E',
        surfaceElevated: '#2A2A2A',
        border: 'rgba(255,255,255,0.10)',
        text: '#EAEAEA',
        textSecondary: '#B8B8B8',
        muted: '#8A8A8A',
        accent: accentColor,
        accentSoft,
        accentTextOn,
      } as const;
    }

    return {
      mode,
      bgPrimary: '#F6F7F9',
      bgSecondary: '#FFFFFF',
      surfaceCard: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: 'rgba(15,23,42,0.08)',
      text: '#0f172a',
      textSecondary: '#334155',
      muted: '#64748b',
      accent: accentColor,
      accentSoft,
      accentTextOn,
    } as const;
  }, [mode, accentColor, accentSoft, accentTextOn]);

  return {
    mode,
    accent,
    colors,
    spacing,
    radius,
    typography,
    shadow,
  };
}
