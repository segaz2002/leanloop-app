import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';

import { getExerciseSlugFromName } from '@/src/features/exercise/catalog';
import type { WorkoutExercise, WorkoutSet } from '@/src/features/workout/workout.repo';
import { useUnits } from '@/src/features/settings/UnitsProvider';
import { addSet, completeWorkout, fetchLastPerformance, fetchWorkout } from '@/src/features/workout/workout.repo';

const REST_SECONDS_DEFAULT = 90;

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

  const [restSeconds, setRestSeconds] = useState<number>(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

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
      setBanner(null);
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
      const msg = e?.message ?? 'Failed to load workout';
      setBanner(msg);
      if (Platform.OS !== 'web') Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  useEffect(() => {
    if (restSeconds <= 0) return;
    const t = setInterval(() => {
      setRestSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [restSeconds]);

  const onAddSet = async (ex: WorkoutExercise, draft: SetDraft) => {
    const reps = Number(draft.reps);
    const weightInput = draft.weightKg.trim() === '' ? null : Number(draft.weightKg);

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
      setBanner(null);
      const weightKg = weightInput === null ? null : Number(toKg(weightInput).toFixed(3));
      const inserted = await addSet({
        workoutExerciseId: ex.id,
        setIndex: existing + 1,
        reps,
        weightKg,
      });
      setSets((prev) => [...prev, inserted]);

      // Prefill next set with last values (beginner-friendly).
      setDrafts((prev) => ({
        ...prev,
        [ex.id]: {
          weightKg: draft.weightKg,
          reps: draft.reps,
        },
      }));

      // Auto-start rest timer.
      setRestSeconds(REST_SECONDS_DEFAULT);
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to add set';
      setBanner(msg);
      if (Platform.OS !== 'web') Alert.alert('Error', msg);
    }
  };

  const onFinish = async () => {
    if (finishing) return;

    if (sets.length === 0) {
      const msg = 'Log at least one set before finishing.';
      setBanner(msg);
      if (Platform.OS !== 'web') Alert.alert('Nothing logged yet', msg);
      return;
    }

    setFinishing(true);
    try {
      setBanner(null);
      await completeWorkout(workoutId);
      setBanner('Workout complete.');

      if (Platform.OS !== 'web') {
        Alert.alert('Workout complete', 'Nice work.', [{ text: 'OK', onPress: () => router.replace('/') }]);
      } else {
        router.replace('/');
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to complete workout';
      setBanner(msg);
      if (Platform.OS !== 'web') Alert.alert('Error', msg);
    } finally {
      setFinishing(false);
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

  const isDark = scheme === 'dark';

  return (
    <ScrollView contentContainerStyle={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen
        options={{
          title: `Workout ${dayCode}`,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ fontWeight: '800', color: isDark ? '#e5e7eb' : '#0f172a' }}>Back</Text>
            </Pressable>
          ),
          headerRight: () =>
            restSeconds > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 10 }}>
                <Text style={{ fontWeight: '900', color: isDark ? '#e5e7eb' : '#0f172a' }}>
                  Rest {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
                </Text>
                <Pressable
                  onPress={() => setRestSeconds((s) => s + 15)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                >
                  <Text style={{ fontWeight: '800', color: isDark ? '#e5e7eb' : '#0f172a' }}>+15</Text>
                </Pressable>
                <Pressable
                  onPress={() => setRestSeconds(0)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                >
                  <Text style={{ fontWeight: '800', color: isDark ? '#e5e7eb' : '#0f172a' }}>Skip</Text>
                </Pressable>
              </View>
            ) : null,
        }}
      />
      <Text style={[styles.title, isDark && styles.titleDark]}>Workout {dayCode}</Text>

      {banner ? (
        <View style={[styles.banner, isDark && styles.bannerDark]}>
          <Text style={[styles.bannerText, isDark && styles.textLight]}>{banner}</Text>
        </View>
      ) : null}

      {exercises.map((ex) => {
        const logged = setsByExercise[ex.id] ?? [];
        const last = logged.length ? logged[logged.length - 1] : null;

        const derivedDraft: SetDraft =
          drafts[ex.id] ??
          ({
            weightKg:
              last?.weight_kg == null
                ? ''
                : toDisplayWeight(Number(last.weight_kg)).toFixed(1).replace(/\.0$/, ''),
            reps: last?.reps == null ? '' : String(last.reps),
          } satisfies SetDraft);

        const nextSet = (logged.length ?? 0) + 1;

        return (
          <View key={ex.id} style={[styles.card, isDark && styles.cardDark]}>
            <Pressable onPress={() => router.push(`/exercise/${getExerciseSlugFromName(ex.exercise_name)}`)}>
              <Text style={[styles.exerciseTitle, isDark && styles.textLight]}>
                {ex.position}. {ex.exercise_name}
              </Text>
            </Pressable>
            <Text style={[styles.muted, isDark && styles.mutedDark]}>
              {ex.sets_planned} × {ex.rep_min}–{ex.rep_max}
            </Text>
            <Text style={[styles.muted, isDark && styles.mutedDark]}>Set {nextSet} of {ex.sets_planned}</Text>
            {lastPerf[ex.id] ? <Text style={[styles.muted, isDark && styles.mutedDark]}>{lastPerf[ex.id]}</Text> : null}

            {logged.length ? (
              <View style={styles.loggedSets}>
                {logged.map((s) => (
                  <Text key={s.id} style={[styles.loggedSetText, isDark && styles.textLight]}>
                    Set {s.set_index}: {s.weight_kg == null ? '—' : toDisplayWeight(Number(s.weight_kg)).toFixed(1).replace(/\.0$/, '')} {units} × {s.reps}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Weight ({units})</Text>
                <TextInput
                  style={[styles.input, scheme === 'dark' && styles.inputDark]}
                  placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
                  keyboardType="numeric"
                  value={derivedDraft.weightKg}
                  onChangeText={(t) => setDrafts((p) => ({ ...p, [ex.id]: { ...derivedDraft, weightKg: t } }))}
                  placeholder="20"
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>Reps</Text>
                <TextInput
                  style={[styles.input, scheme === 'dark' && styles.inputDark]}
                  placeholderTextColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
                  keyboardType="numeric"
                  value={derivedDraft.reps}
                  onChangeText={(t) => setDrafts((p) => ({ ...p, [ex.id]: { ...derivedDraft, reps: t } }))}
                  placeholder="8"
                />
              </View>
            </View>

            <Pressable style={styles.completeButton} onPress={() => onAddSet(ex, derivedDraft)}>
              <Text style={styles.completeButtonText}>Complete set</Text>
            </Pressable>
          </View>
        );
      })}

      <Pressable style={[styles.finishButton, finishing && styles.buttonDisabled]} onPress={onFinish} disabled={finishing}>
        <Text style={styles.finishButtonText}>{finishing ? 'Finishing…' : 'Finish workout'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#ffffff' },
  containerDark: { backgroundColor: '#020617' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12, color: '#0f172a' },
  titleDark: { color: '#e5e7eb' },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  cardDark: {
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  exerciseTitle: { fontWeight: '800', marginBottom: 6, color: '#0f172a' },
  textLight: { color: '#e5e7eb' },
  muted: { color: '#334155' },
  mutedDark: { color: '#94a3b8' },
  loggedSets: { marginTop: 10, marginBottom: 10 },
  loggedSetText: { marginBottom: 2, color: '#0f172a' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 10 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 12, marginBottom: 4, color: '#475569' },
  fieldLabelDark: { color: '#94a3b8' },
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
  completeButton: {
    marginTop: 10,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: { color: 'white', fontWeight: '900' },
  finishButton: {
    marginTop: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  finishButtonText: { color: 'white', fontWeight: '900' },
  buttonDisabled: { opacity: 0.65 },
  banner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.12)',
    backgroundColor: 'rgba(15,23,42,0.03)',
    marginBottom: 12,
  },
  bannerDark: {
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bannerText: { color: '#0f172a', fontWeight: '700' },
});
