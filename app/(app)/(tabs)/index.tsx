import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { startWorkout } from '@/src/features/workout/workout.repo';

export default function HomeScreen() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const onStartA = async () => {
    setStarting(true);
    try {
      const w = await startWorkout('A');
      router.push(`/(app)/workout/${w.id}`);
    } catch (e: any) {
      Alert.alert('Could not start workout', e?.message ?? 'Unknown error');
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LeanLoop</Text>
      <Text style={styles.subtitle}>Your weekly plan that adapts.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next up</Text>
        <Text>Workout A</Text>
        <Pressable style={[styles.primaryButton, starting && styles.buttonDisabled]} onPress={onStartA} disabled={starting}>
          <Text style={styles.primaryButtonText}>{starting ? 'Starting…' : 'Start Workout A'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today’s habits</Text>
        <Text>Protein: 0 / goal</Text>
        <Text>Steps: 0 / goal</Text>
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
});
