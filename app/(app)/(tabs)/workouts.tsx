import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { abandonWorkout, fetchActiveWorkout, startWorkout, type Workout } from '@/src/features/workout/workout.repo';

export default function WorkoutsScreen() {
  const router = useRouter();
  const [starting, setStarting] = useState<null | 'A' | 'B' | 'C'>(null);
  const [active, setActive] = useState<Workout | null>(null);

  const refresh = async () => {
    try {
      const a = await fetchActiveWorkout();
      setActive(a);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const start = async (day: 'A' | 'B' | 'C') => {
    if (active) {
      Alert.alert(
        'Workout in progress',
        'You already have an unfinished workout. Resume it, or abandon it and start a new one.',
        [
          { text: 'Resume', onPress: () => router.push(`/(app)/workout/${active.id}`) },
          {
            text: 'Abandon & start new',
            style: 'destructive',
            onPress: async () => {
              try {
                await abandonWorkout(active.id);
                setActive(null);
                await doStart(day);
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'Could not start new workout');
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    await doStart(day);
  };

  const doStart = async (day: 'A' | 'B' | 'C') => {
    setStarting(day);
    try {
      const w = await startWorkout(day);
      setActive(w);
      router.push(`/(app)/workout/${w.id}`);
    } catch (e: any) {
      Alert.alert('Could not start workout', e?.message ?? 'Unknown error');
    } finally {
      setStarting(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workouts</Text>
      <Text style={styles.subtitle}>Start a session.</Text>

      {active ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>In progress</Text>
          <Text>Workout {active.day_code} is unfinished.</Text>
          <Pressable style={styles.button} onPress={() => router.push(`/(app)/workout/${active.id}`)}>
            <Text style={styles.buttonText}>Resume workout</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This week</Text>
        <Pressable style={[styles.button, starting === 'A' && styles.buttonDisabled]} onPress={() => start('A')} disabled={starting !== null}>
          <Text style={styles.buttonText}>Start Workout A</Text>
        </Pressable>
        <Pressable style={[styles.button, starting === 'B' && styles.buttonDisabled]} onPress={() => start('B')} disabled={starting !== null}>
          <Text style={styles.buttonText}>Start Workout B</Text>
        </Pressable>
        <Pressable style={[styles.button, starting === 'C' && styles.buttonDisabled]} onPress={() => start('C')} disabled={starting !== null}>
          <Text style={styles.buttonText}>Start Workout C</Text>
        </Pressable>
      </View>

      <Text style={styles.muted}>History & scheduling come next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { opacity: 0.8, marginBottom: 16 },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  cardTitle: { fontWeight: '800', marginBottom: 10 },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: '800' },
  muted: { opacity: 0.7 },
});
