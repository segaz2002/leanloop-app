import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { startWorkout } from '@/src/features/workout/workout.repo';

export default function WorkoutsScreen() {
  const router = useRouter();
  const [starting, setStarting] = useState<null | 'A' | 'B' | 'C'>(null);

  const start = async (day: 'A' | 'B' | 'C') => {
    setStarting(day);
    try {
      const w = await startWorkout(day);
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
