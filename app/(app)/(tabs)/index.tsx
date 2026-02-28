import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { HomeHabitsCard } from '@/src/features/home/HomeHabitsCard';
import { useAccent } from '@/src/features/settings/AccentProvider';
import { Screen } from '@/src/ui/Screen';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { H1, Body } from '@/src/ui/Typography';
import {
  abandonWorkout,
  fetchActiveWorkout,
  fetchLastCompletedWorkout,
  startWorkout,
  type Workout,
} from '@/src/features/workout/workout.repo';

type DayCode = 'A' | 'B' | 'C';

function nextDayFromLast(last: Workout | null): DayCode {
  if (!last) return 'A';
  if (last.day_code === 'A') return 'B';
  if (last.day_code === 'B') return 'C';
  return 'A';
}

export default function HomeScreen() {
  const router = useRouter();
  useAccent();

  const [starting, setStarting] = useState(false);
  const [active, setActive] = useState<Workout | null>(null);
  const [lastCompleted, setLastCompleted] = useState<Workout | null>(null);

  const nextUp = useMemo(() => nextDayFromLast(lastCompleted), [lastCompleted]);

  const refresh = async () => {
    try {
      const [a, last] = await Promise.all([fetchActiveWorkout(), fetchLastCompletedWorkout()]);
      setActive(a);
      setLastCompleted(last);
    } catch {
      // ignore for v1
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onPrimary = async () => {
    if (active) {
      router.push(`/workout/${active.id}`);
      return;
    }

    setStarting(true);
    try {
      const w = await startWorkout(nextUp);
      setActive(w);
      router.push(`/workout/${w.id}`);
    } catch (e: any) {
      Alert.alert('Could not start workout', e?.message ?? 'Unknown error');
    } finally {
      setStarting(false);
    }
  };

  const onStartNew = async () => {
    if (!active) return;

    Alert.alert(
      'Unfinished workout',
      'You have an unfinished workout. Do you want to resume it, or abandon it and start a new one?',
      [
        { text: 'Resume', style: 'default', onPress: () => router.push(`/workout/${active.id}`) },
        {
          text: 'Abandon & start new',
          style: 'destructive',
          onPress: async () => {
            try {
              await abandonWorkout(active.id);
              setActive(null);
              const w = await startWorkout(nextUp);
              setActive(w);
              router.push(`/workout/${w.id}`);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not start new workout');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <Screen>
      <H1>LeanLoop</H1>
      <Body muted style={{ marginBottom: 16 }}>Your weekly plan that adapts.</Body>

      <Card>
        <Body style={{ fontWeight: '900', marginBottom: 8 }}>Today</Body>
        <Body secondary>
          {active ? `Workout in progress: ${active.day_code}` : `Next up: Workout ${nextUp}`}
        </Body>

        <Button
          title={starting ? 'Starting\u2026' : active ? 'Resume workout' : "Start today's workout"}
          onPress={onPrimary}
          disabled={starting}
        />

        {active ? (
          <Pressable style={styles.secondaryButton} onPress={onStartNew}>
            <Body style={{ fontWeight: '800', textAlign: 'center' }}>Start new workout</Body>
          </Pressable>
        ) : null}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <HomeHabitsCard />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
});
