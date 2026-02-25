import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

export type Units = 'kg' | 'lb';

const STORAGE_KEY = 'leanloop.units';

function defaultUnitsFromLocale(): Units {
  // CPO default: locale-based default (US -> lb, most others -> kg)
  const region = (Localization.getLocales()?.[0]?.regionCode ?? '').toUpperCase();
  if (region === 'US') return 'lb';
  return 'kg';
}

type UnitsContextValue = {
  units: Units;
  setUnits: (u: Units) => Promise<void>;
  toDisplayWeight: (kg: number) => number;
  toKg: (value: number) => number;
};

const UnitsContext = createContext<UnitsContextValue | null>(null);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnitsState] = useState<Units>(defaultUnitsFromLocale());

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'kg' || saved === 'lb') {
        setUnitsState(saved);
      }
    })();
  }, []);

  const value = useMemo<UnitsContextValue>(() => {
    return {
      units,
      setUnits: async (u) => {
        setUnitsState(u);
        await AsyncStorage.setItem(STORAGE_KEY, u);
      },
      toDisplayWeight: (kg) => {
        if (units === 'lb') return kg * 2.2046226218;
        return kg;
      },
      toKg: (value) => {
        if (units === 'lb') return value / 2.2046226218;
        return value;
      },
    };
  }, [units]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error('useUnits must be used within UnitsProvider');
  return ctx;
}
