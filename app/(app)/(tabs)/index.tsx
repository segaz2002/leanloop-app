import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { HomeHabitsCard } from '@/src/features/home/HomeHabitsCard';
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
    // refresh on focus (cheap approach: on mount only for now)
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
    <View style={styles.container}>
      <Text style={styles.title}>LeanLoop</Text>
      <Text style={styles.subtitle}>Your weekly plan that adapts.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <Text>{active ? `Workout in progress: ${active.day_code}` : `Next up: Workout ${nextUp}`}</Text>
        <Pressable style={[styles.primaryButton, starting && styles.buttonDisabled]} onPress={onPrimary} disabled={starting}>
          <Text style={styles.primaryButtonText}>
            {starting ? 'Starting…' : active ? 'Resume workout' : "Start today’s workout"}
          </Text>
        </Pressable>

        {active ? (
          <Pressable style={styles.secondaryButton} onPress={onStartNew}>
            <Text style={styles.secondaryButtonText}>Start new workout</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <HomeHabitsCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: 'white', fontWeight: '800' },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  secondaryButtonText: { fontWeight: '800' },
});
