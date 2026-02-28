import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GoalMode = 'fat_loss' | 'maintenance' | 'lean_gain';

const STORAGE_KEY = 'leanloop.goal';

type GoalContextValue = {
  goal: GoalMode;
  setGoal: (g: GoalMode) => Promise<void>;
};

const GoalContext = createContext<GoalContextValue | null>(null);

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const [goal, setGoalState] = useState<GoalMode>('maintenance');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'fat_loss' || saved === 'maintenance' || saved === 'lean_gain') {
        setGoalState(saved);
      }
    })();
  }, []);

  const value = useMemo<GoalContextValue>(
    () => ({
      goal,
      setGoal: async (g) => {
        setGoalState(g);
        await AsyncStorage.setItem(STORAGE_KEY, g);
      },
    }),
    [goal],
  );

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoal() {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error('useGoal must be used within GoalProvider');
  return ctx;
}
