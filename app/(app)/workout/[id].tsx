import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '@/src/ui/Screen';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { Input } from '@/src/ui/Input';
import { H1, H2, Body, Label } from '@/src/ui/Typography';
import { useAppTheme } from '@/src/theme/useAppTheme';

import { getExerciseBySlug, getExerciseSlugFromName } from '@/src/features/exercise/catalog';
import type { WorkoutExercise, WorkoutSet } from '@/src/features/workout/workout.repo';
import { useUnits } from '@/src/features/settings/UnitsProvider';
import { addSet, completeWorkout, deleteSet, fetchLastPerformance, fetchWorkout, updateSet } from '@/src/features/workout/workout.repo';

const REST_SECONDS_DEFAULT = 90;

type SetDraft = { reps: string; weightKg: string };

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = String(id);
  const router = useRouter();

  const t = useAppTheme();
  const { units, toDisplayWeight, toKg } = useUnits();

  const [loading, setLoading] = useState(true);
  const [dayCode, setDayCode] = useState<string>('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});
  const [lastPerf, setLastPerf] = useState<Record<string, string>>({});

  const [restSeconds, setRestSeconds] = useState<number>(0);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const restStorageKey = useMemo(() => `restEndsAt:${workoutId}`, [workoutId]);
  const subsStorageKey = useMemo(() => `leanloop.substitutions:${workoutId}`, [workoutId]);
  const [banner, setBanner] = useState<string | null>(null);
  const [undo, setUndo] = useState<WorkoutSet | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<{ weight: string; reps: string } | null>(null);
  const [finishing, setFinishing] = useState(false);
  // selectedOptions[exerciseId] = index into catalog.options[] (0 = first, default)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});

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

  useFocusEffect(
    React.useCallback(() => {
      refresh();
      return undefined;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workoutId]),
  );

  // If the user changes unit preference (kg/lb), refresh to reformat last/perf strings.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  // Load persisted rest timer (if any) when workout changes.
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(restStorageKey);
        if (!v) {
          setRestEndsAt(null);
          setRestSeconds(0);
          return;
        }
        const n = Number(v);
        if (!Number.isFinite(n)) {
          await AsyncStorage.removeItem(restStorageKey);
          setRestEndsAt(null);
          setRestSeconds(0);
          return;
        }
        if (n <= Date.now()) {
          await AsyncStorage.removeItem(restStorageKey);
          setRestEndsAt(null);
          setRestSeconds(0);
          return;
        }
        setRestEndsAt(n);
      } catch {
        // ignore
      }
    })();
  }, [restStorageKey]);

  // Persist rest timer changes.
  useEffect(() => {
    (async () => {
      try {
        if (restEndsAt) await AsyncStorage.setItem(restStorageKey, String(restEndsAt));
        else await AsyncStorage.removeItem(restStorageKey);
      } catch {
        // ignore
      }
    })();
  }, [restEndsAt, restStorageKey]);

  // Load persisted substitution selections when workout changes.
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(subsStorageKey);
        if (v) setSelectedOptions(JSON.parse(v));
      } catch {
        // ignore
      }
    })();
  }, [subsStorageKey]);

  // Persist substitution selections whenever they change.
  useEffect(() => {
    (async () => {
      try {
        if (Object.keys(selectedOptions).length > 0) {
          await AsyncStorage.setItem(subsStorageKey, JSON.stringify(selectedOptions));
        }
      } catch {
        // ignore
      }
    })();
  }, [selectedOptions, subsStorageKey]);

  // Rest timer: derive seconds left from an absolute end timestamp.
  useEffect(() => {
    if (!restEndsAt) {
      setRestSeconds(0);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRestSeconds(left);
      if (left <= 0) setRestEndsAt(null);
    };

    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [restEndsAt]);

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
        [ex.id]: { weightKg: draft.weightKg, reps: draft.reps },
      }));

      // Auto-start rest timer (persisted + robust across background/resume).
      setRestEndsAt(Date.now() + REST_SECONDS_DEFAULT * 1000);
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to add set';
      setBanner(msg);
      if (Platform.OS !== 'web') Alert.alert('Error', msg);
    }
  };

  const clearUndoLater = () => {
    setTimeout(() => setUndo(null), 6000);
  };

  const onDeleteLoggedSet = async (s: WorkoutSet) => {
    try {
      setBanner(null);
      await deleteSet(s.id);
      setSets((prev) => prev.filter((x) => x.id !== s.id));
      setUndo(s);
      setBanner('Set deleted.');
      clearUndoLater();
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to delete set';
      setBanner(msg);
      if (Platform.OS !== 'web') Alert.alert('Error', msg);
    }
  };

  const onUndo = async () => {
    if (!undo) return;
    try {
      setBanner(null);
      const inserted = await addSet({
        workoutExerciseId: undo.workout_exercise_id,
        setIndex: undo.set_index,
        reps: undo.reps,
        weightKg: undo.weight_kg,
      });
      setSets((prev) => [...prev, inserted]);
      setUndo(null);
      setBanner('Undo complete.');
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to undo';
      setBanner(msg);
      if (Platform.OS !== 'web') Alert.alert('Error', msg);
    }
  };

  const onStartEdit = (s: WorkoutSet) => {
    setEditingSetId(s.id);
    setEditingDraft({
      weight: s.weight_kg == null ? '' : toDisplayWeight(Number(s.weight_kg)).toFixed(1).replace(/\.0$/, ''),
      reps: String(s.reps),
    });
  };

  const onSaveEdit = async (s: WorkoutSet) => {
    if (!editingDraft) return;

    const reps = Number(editingDraft.reps);
    const weightInput = editingDraft.weight.trim() === '' ? null : Number(editingDraft.weight);

    if (!Number.isFinite(reps) || reps <= 0) {
      setBanner('Enter reps (e.g., 8)');
      return;
    }
    if (weightInput !== null && (!Number.isFinite(weightInput) || weightInput < 0)) {
      setBanner(`Enter weight in ${units} (e.g., 20)`);
      return;
    }

    try {
      setBanner(null);
      const weightKg = weightInput === null ? null : Number(toKg(weightInput).toFixed(3));
      const updated = await updateSet({ id: s.id, reps, weightKg });
      setSets((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
      setEditingSetId(null);
      setEditingDraft(null);
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to update set';
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

  const miniButtonStyle = { paddingVertical: 8, paddingHorizontal: 10, borderRadius: t.radius.md };
  const headerPillStyle = {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surfaceElevated,
  };

  if (loading) {
    return (
      <Screen scroll={false}>
        <H1>Workout</H1>
        <Body muted>Loading…</Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: `Workout ${dayCode}`,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <Body style={{ fontWeight: '800' }}>Back</Body>
            </Pressable>
          ),
          headerRight: () =>
            restSeconds > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 10 }}>
                <Body style={{ fontWeight: '900' }}>
                  Rest {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
                </Body>
                <Pressable onPress={() => setRestEndsAt((x) => (x ? x + 15_000 : Date.now() + 15_000))} style={headerPillStyle}>
                  <Body style={{ fontWeight: '800' }}>+15</Body>
                </Pressable>
                <Pressable onPress={() => setRestEndsAt(null)} style={headerPillStyle}>
                  <Body style={{ fontWeight: '800' }}>Skip</Body>
                </Pressable>
              </View>
            ) : null,
        }}
      />

      <H1>Workout {dayCode}</H1>

      {banner ? (
        <Card style={{ marginBottom: 12 }}>
          <Body style={{ fontWeight: '800' }}>{banner}</Body>
          {undo ? (
            <Pressable onPress={onUndo} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
              <Body style={{ fontWeight: '900', color: t.colors.accent }}>Undo</Body>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {exercises.map((ex) => {
        const logged = setsByExercise[ex.id] ?? [];
        const last = logged.length ? logged[logged.length - 1] : null;

        const derivedDraft: SetDraft =
          drafts[ex.id] ??
          ({
            weightKg:
              last?.weight_kg == null ? '' : toDisplayWeight(Number(last.weight_kg)).toFixed(1).replace(/\.0$/, ''),
            reps: last?.reps == null ? '' : String(last.reps),
          } satisfies SetDraft);

        const nextSet = (logged.length ?? 0) + 1;

        const catalogEntry = getExerciseBySlug(getExerciseSlugFromName(ex.exercise_name));
        const options = catalogEntry?.options ?? [];
        const selectedIdx = selectedOptions[ex.id] ?? 0;
        const displayName = options.length > 0 ? options[selectedIdx] : ex.exercise_name;

        return (
          <Card key={ex.id} style={{ marginBottom: 12 }}>
            <Pressable onPress={() => router.push(`/exercise/${getExerciseSlugFromName(ex.exercise_name)}`)}>
              <H2 style={{ marginBottom: 2 }}>
                {ex.position}. {displayName}
              </H2>
            </Pressable>

            {options.length > 1 ? (
              <View style={styles.optionRow}>
                {options.map((opt, idx) => (
                  <Pressable
                    key={opt}
                    onPress={() => setSelectedOptions((prev) => ({ ...prev, [ex.id]: idx }))}
                    style={[
                      styles.optionPill,
                      {
                        backgroundColor: idx === selectedIdx ? t.colors.accent : t.colors.surfaceElevated,
                        borderColor: idx === selectedIdx ? t.colors.accent : t.colors.border,
                      },
                    ]}
                  >
                    <Body
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: idx === selectedIdx ? t.colors.accentTextOn : t.colors.textSecondary,
                      }}
                    >
                      {opt}
                    </Body>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Body muted>
              {ex.sets_planned} × {ex.rep_min}–{ex.rep_max}
            </Body>
            <Body muted>
              Set {nextSet} of {ex.sets_planned}
            </Body>
            {lastPerf[ex.id] ? <Body muted>{lastPerf[ex.id]}</Body> : null}

            {logged.length ? (
              <View style={styles.loggedSets}>
                {logged.map((s) => {
                  const isEditing = editingSetId === s.id;
                  return (
                    <View key={s.id} style={styles.loggedSetRow}>
                      {isEditing ? (
                        <>
                          <Body secondary style={{ fontWeight: '800' }}>
                            Set {s.set_index}:
                          </Body>
                          <Input
                            style={styles.inlineInput}
                            keyboardType="numeric"
                            value={editingDraft?.weight ?? ''}
                            onChangeText={(txt) => setEditingDraft((d) => ({ ...(d ?? { weight: '', reps: '' }), weight: txt }))}
                            placeholder="20"
                          />
                          <Body secondary>{units} ×</Body>
                          <Input
                            style={styles.inlineInput}
                            keyboardType="numeric"
                            value={editingDraft?.reps ?? ''}
                            onChangeText={(txt) => setEditingDraft((d) => ({ ...(d ?? { weight: '', reps: '' }), reps: txt }))}
                            placeholder="8"
                          />
                          <Body secondary>reps</Body>

                          <Button title="Save" variant="secondary" onPress={() => onSaveEdit(s)} style={miniButtonStyle} />
                          <Button
                            title="Cancel"
                            variant="ghost"
                            onPress={() => {
                              setEditingSetId(null);
                              setEditingDraft(null);
                            }}
                            style={miniButtonStyle}
                          />
                        </>
                      ) : (
                        <>
                          <Body secondary style={{ fontWeight: '700' }}>
                            Set {s.set_index}: {s.weight_kg == null ? '—' : toDisplayWeight(Number(s.weight_kg)).toFixed(1).replace(/\.0$/, '')} {units} × {s.reps}
                          </Body>
                          <Button title="Edit" variant="secondary" onPress={() => onStartEdit(s)} style={miniButtonStyle} />
                          <Button title="Delete" variant="secondary" onPress={() => onDeleteLoggedSet(s)} style={miniButtonStyle} />
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.row}>
              <View style={styles.field}>
                <Label>Weight ({units})</Label>
                <Input
                  value={derivedDraft.weightKg}
                  onChangeText={(txt) => setDrafts((p) => ({ ...p, [ex.id]: { ...derivedDraft, weightKg: txt } }))}
                  keyboardType="numeric"
                  placeholder="20"
                />
              </View>
              <View style={styles.field}>
                <Label>Reps</Label>
                <Input
                  value={derivedDraft.reps}
                  onChangeText={(txt) => setDrafts((p) => ({ ...p, [ex.id]: { ...derivedDraft, reps: txt } }))}
                  keyboardType="numeric"
                  placeholder="8"
                />
              </View>
            </View>

            <Button title="Complete set" onPress={() => onAddSet(ex, derivedDraft)} style={{ marginTop: 10 }} />
          </Card>
        );
      })}

      <Button
        title={finishing ? 'Finishing…' : 'Finish workout'}
        onPress={onFinish}
        disabled={finishing}
        style={{ marginTop: 8, marginBottom: 24 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loggedSets: { marginTop: 10, marginBottom: 10 },
  loggedSetRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  inlineInput: { minWidth: 80, paddingVertical: 8, paddingHorizontal: 10 },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 10 },
  field: { flex: 1 },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 4 },
  optionPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
});
