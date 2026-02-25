import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';

import type { WorkoutExercise, WorkoutSet } from '@/src/features/workout/workout.repo';
import { useUnits } from '@/src/features/settings/UnitsProvider';
import { addSet, completeWorkout, fetchLastPerformance, fetchWorkout } from '@/src/features/workout/workout.repo';

type SetDraft = { reps: string; weightKg: string };

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = String(id);
  const router = useRouter();

  const { units, toDisplayWeight, toKg } = useUnits();
  const scheme = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [dayCode, setDayCode] = useState<string>('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});
  const [lastPerf, setLastPerf] = useState<Record<string, string>>({});

  const setsByExercise = useMemo(() => {
    const map: Record<string, WorkoutSet[]> = {};
    for (const s of sets) {
      (map[s.workout_exercise_id] ||= []).push(s);
    }
    return map;
  }, [sets]);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkout(workoutId);
      setDayCode(data.workout.day_code);
      setExercises(data.exercises);
      setSets(data.sets);

      // load last performance (best-effort)
      const perf: Record<string, string> = {};
      await Promise.all(
        data.exercises.map(async (ex) => {
          const lp = await fetchLastPerformance(ex.exercise_name);
          if (lp?.weight_kg != null && lp?.reps != null) {
            const w = toDisplayWeight(Number(lp.weight_kg));
            const wTxt = Number.isFinite(w) ? w.toFixed(1).replace(/\.0$/, '') : String(lp.weight_kg);
            perf[ex.id] = `Last: ${wTxt} ${units} × ${lp.reps}`;
          }
        }),
      );
      setLastPerf(perf);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  const onAddSet = async (ex: WorkoutExercise) => {
    const d = drafts[ex.id] ?? { reps: '', weightKg: '' };
    const reps = Number(d.reps);
    const weightInput = d.weightKg.trim() === '' ? null : Number(d.weightKg);

    if (!Number.isFinite(reps) || reps <= 0) {
      Alert.alert('Invalid reps', 'Enter reps (e.g., 8)');
      return;
    }
    if (weightInput !== null && (!Number.isFinite(weightInput) || weightInput < 0)) {
      Alert.alert('Invalid weight', `Enter weight in ${units} (e.g., 20)`);
      return;
    }

    const existing = setsByExercise[ex.id]?.length ?? 0;

    try {
      const weightKg = weightInput === null ? null : Number(toKg(weightInput).toFixed(3));
      const inserted = await addSet({
        workoutExerciseId: ex.id,
        setIndex: existing + 1,
        reps,
        weightKg,
      });
      setSets((prev) => [...prev, inserted]);
      setDrafts((prev) => ({ ...prev, [ex.id]: { reps: '', weightKg: '' } }));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to add set');
    }
  };

  const onFinish = async () => {
    if (sets.length === 0) {
      Alert.alert('Nothing logged yet', 'Log at least one set before finishing.');
      return;
    }

    try {
      await completeWorkout(workoutId);
      Alert.alert('Workout complete', 'Nice work.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to complete workout');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Workout</Text>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: `Workout ${dayCode}`,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ fontWeight: '800' }}>Back</Text>
            </Pressable>
          ),
        }}
      />
      <Text style={styles.title}>Workout {dayCode}</Text>

      {exercises.map((ex) => {
        const logged = setsByExercise[ex.id] ?? [];
        const draft = drafts[ex.id] ?? { reps: '', weightKg: '' };

        return (
          <View key={ex.id} style={styles.card}>
            <Text style={styles.exerciseTitle}>{ex.position}. {ex.exercise_name}</Text>
            <Text style={styles.muted}>
              {ex.sets_planned} × {ex.rep_min}–{ex.rep_max}
            </Text>
            {lastPerf[ex.id] ? <Text style={styles.muted}>{lastPerf[ex.id]}</Text> : null}

            {logged.length ? (
              <View style={styles.loggedSets}>
                {logged.map((s) => (
                  <Text key={s.id} style={styles.loggedSetText}>
                    Set {s.set_index}: {s.weight_kg == null ? '—' : toDisplayWeight(Number(s.weight_kg)).toFixed(1).replace(/\.0$/, '')} {units} × {s.reps}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{units}</Text>
                <TextInput
                  style={[styles.input, scheme === 'dark' && styles.inputDark]}
                  placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
                  keyboardType="numeric"
                  value={draft.weightKg}
                  onChangeText={(t) => setDrafts((p) => ({ ...p, [ex.id]: { ...draft, weightKg: t } }))}
                  placeholder="20"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>reps</Text>
                <TextInput
                  style={[styles.input, scheme === 'dark' && styles.inputDark]}
                  placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
                  keyboardType="numeric"
                  value={draft.reps}
                  onChangeText={(t) => setDrafts((p) => ({ ...p, [ex.id]: { ...draft, reps: t } }))}
                  placeholder="8"
                />
              </View>
              <Pressable style={styles.addButton} onPress={() => onAddSet(ex)}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <Pressable style={styles.finishButton} onPress={onFinish}>
        <Text style={styles.finishButtonText}>Finish workout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  exerciseTitle: { fontWeight: '800', marginBottom: 6 },
  muted: { opacity: 0.75 },
  loggedSets: { marginTop: 10, marginBottom: 10 },
  loggedSetText: { opacity: 0.85, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 10 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 12, opacity: 0.7, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.18)',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  inputDark: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: { color: 'white', fontWeight: '800' },
  finishButton: {
    marginTop: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  finishButtonText: { color: 'white', fontWeight: '900' },
});
