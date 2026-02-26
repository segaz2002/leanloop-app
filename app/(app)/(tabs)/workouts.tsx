import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { abandonWorkout, fetchActiveWorkout, startWorkout, type Workout } from '@/src/features/workout/workout.repo';
import { Screen } from '@/src/ui/Screen';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { useAppTheme } from '@/src/theme/useAppTheme';

export default function WorkoutsScreen() {
  const router = useRouter();
  const t = useAppTheme();
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
          { text: 'Resume', onPress: () => router.push(`/workout/${active.id}`) },
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
      router.push(`/workout/${w.id}`);
    } catch (e: any) {
      Alert.alert('Could not start workout', e?.message ?? 'Unknown error');
    } finally {
      setStarting(null);
    }
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: t.colors.text }]}>Workouts</Text>
      <Text style={[styles.subtitle, { color: t.colors.muted }]}>Start a session.</Text>

      {active ? (
        <Card>
          <Text style={[styles.cardTitle, { color: t.colors.text }]}>In progress</Text>
          <Text style={{ color: t.colors.textSecondary }}>Workout {active.day_code} is unfinished.</Text>
          <Button title="Resume workout" onPress={() => router.push(`/workout/${active.id}`)} />
        </Card>
      ) : null}

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: t.colors.text }]}>This week</Text>
        <Button title="Start Workout A" onPress={() => start('A')} disabled={starting !== null} />
        <Button title="Start Workout B" onPress={() => start('B')} disabled={starting !== null} style={{ marginTop: 10 }} />
        <Button title="Start Workout C" onPress={() => start('C')} disabled={starting !== null} style={{ marginTop: 10 }} />
      </Card>

      <Text style={[styles.muted, { color: t.colors.muted }]}>History & scheduling come next.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', marginBottom: 6 },
  subtitle: { marginBottom: 16 },
  cardTitle: { fontWeight: '900', marginBottom: 10 },
  muted: { marginTop: 12 },
});
