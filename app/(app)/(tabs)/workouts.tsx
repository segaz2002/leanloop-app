import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { abandonWorkout, fetchActiveWorkout, startWorkout, type Workout } from '@/src/features/workout/workout.repo';
import { Screen } from '@/src/ui/Screen';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { H1, H2, Body } from '@/src/ui/Typography';

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
      <H1>Workouts</H1>
      <Body muted style={{ marginBottom: 16 }}>Start a session.</Body>

      {active ? (
        <Card>
          <H2>In progress</H2>
          <Body secondary>Workout {active.day_code} is unfinished.</Body>
          <Button title="Resume workout" onPress={() => router.push(`/workout/${active.id}`)} style={{ marginTop: 10 }} />
        </Card>
      ) : null}

      <Card style={{ marginTop: 12 }}>
        <H2>This week</H2>
        <Button title="Start Workout A" onPress={() => start('A')} disabled={starting !== null} />
        <Button title="Start Workout B" onPress={() => start('B')} disabled={starting !== null} style={{ marginTop: 10 }} />
        <Button title="Start Workout C" onPress={() => start('C')} disabled={starting !== null} style={{ marginTop: 10 }} />
      </Card>

      <Body muted style={{ marginTop: 12 }}>History & scheduling come next.</Body>
    </Screen>
  );
}
