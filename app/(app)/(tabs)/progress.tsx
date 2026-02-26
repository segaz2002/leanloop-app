import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { Screen } from '@/src/ui/Screen';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { fetchWeeklyStats, todayISO } from '@/src/features/progress/progress.repo';
import type { WeeklyStats } from '@/src/features/progress/progress.logic';
import { fetchHabitsForDate, upsertHabitsForDate, type HabitsDaily } from '@/src/features/habits/habits.repo';
import { fetchWeightForDate, fetchWeightRange, upsertWeightForDate, type WeightEntry } from '@/src/features/weight/weight.repo';
import { useUnits } from '@/src/features/settings/UnitsProvider';
import { fetchWeeklyCheckin, upsertWeeklyCheckin, type WeeklyCheckin } from '@/src/features/checkin/checkin.repo';
import { updateMyGoals } from '@/src/features/profile/profile.repo';
import { useAccent } from '@/src/features/settings/AccentProvider';

function gradeLabel(g: WeeklyStats['grade']) {
  if (g === 'gold') return 'Gold';
  if (g === 'silver') return 'Silver';
  if (g === 'bronze') return 'Bronze';
  return 'Starter';
}

export default function ProgressScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const t = useAppTheme();
  const { units, toDisplayWeight, toKg } = useUnits();
  const { accentColor } = useAccent();

  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<WeeklyStats[]>([]);
  const [goals, setGoals] = useState<{ protein_goal_g: number; steps_goal: number } | null>(null);

  const [protein, setProtein] = useState('');
  const [steps, setSteps] = useState('');
  const [todayHabits, setTodayHabits] = useState<Pick<HabitsDaily, 'protein_g' | 'steps'> | null>(null);
  const [savedTick, setSavedTick] = useState(0);

  const [weight, setWeight] = useState('');
  const [todayWeight, setTodayWeight] = useState<Pick<WeightEntry, 'weight_kg'> | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  const [checkinWeight, setCheckinWeight] = useState('');
  const [checkinNote, setCheckinNote] = useState('');
  const [weeklyCheckin, setWeeklyCheckin] = useState<WeeklyCheckin | null>(null);
  const [prevWeeklyCheckin, setPrevWeeklyCheckin] = useState<WeeklyCheckin | null>(null);
  const [checkinSavedTick, setCheckinSavedTick] = useState(0);
  const [goalsAppliedTick, setGoalsAppliedTick] = useState(0);

  const thisWeek = useMemo(() => weeks[weeks.length - 1] ?? null, [weeks]);

  const refresh = async () => {
    setLoading(true);
    try {
      const date = todayISO();

      // last 28 days for simple history list
      const from = new Date();
      from.setDate(from.getDate() - 28);
      const fromISO = from.toISOString().slice(0, 10);

      const [res, today] = await Promise.all([fetchWeeklyStats(4), fetchHabitsForDate(date)]);

      setGoals(res.profile);
      setWeeks(res.weeks);
      setTodayHabits(today ? { protein_g: today.protein_g, steps: today.steps } : null);

      // Prefill inputs from today's saved values (helps confirm the save worked)
      setProtein(today?.protein_g != null ? String(today.protein_g) : '');
      setSteps(today?.steps != null ? String(today.steps) : '');

      // Weight tracking is optional until the DB migration is applied.
      try {
        const [wToday, wRange] = await Promise.all([
          fetchWeightForDate(date),
          fetchWeightRange({ from: fromISO, to: date }),
        ]);
        setTodayWeight(wToday ? { weight_kg: wToday.weight_kg } : null);
        setWeightHistory(wRange);
        setWeight(
          wToday?.weight_kg != null
            ? String(toDisplayWeight(Number(wToday.weight_kg)).toFixed(1).replace(/\.0$/, ''))
            : '',
        );
      } catch {
        // If the table doesn't exist yet (migration not applied), keep weight UI empty.
        setTodayWeight(null);
        setWeightHistory([]);
        setWeight('');
      }

      // Weekly check-in is optional until the DB migration is applied.
      try {
        const ws = res.weeks[res.weeks.length - 1]?.weekStart;
        if (ws) {
          const c = await fetchWeeklyCheckin(ws);
          setWeeklyCheckin(c);
          setCheckinNote(c?.note ?? '');
          setCheckinWeight(
            c?.weight_kg != null
              ? String(toDisplayWeight(Number(c.weight_kg)).toFixed(1).replace(/\.0$/, ''))
              : '',
          );

          // previous week check-in (optional)
          const prev = new Date(`${ws}T00:00:00.000Z`);
          prev.setDate(prev.getDate() - 7);
          const prevWs = prev.toISOString().slice(0, 10);
          const pc = await fetchWeeklyCheckin(prevWs);
          setPrevWeeklyCheckin(pc);
        }
      } catch {
        setWeeklyCheckin(null);
        setPrevWeeklyCheckin(null);
        setCheckinNote('');
        setCheckinWeight('');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      refresh();
      // no cleanup
      return undefined;
    }, []),
  );

  const onLogToday = async () => {
    const p = protein.trim() === '' ? null : Number(protein);
    const s = steps.trim() === '' ? null : Number(steps);

    if (p !== null && (!Number.isFinite(p) || p < 0)) {
      Alert.alert('Invalid protein', 'Enter grams (e.g., 120)');
      return;
    }
    if (s !== null && (!Number.isFinite(s) || s < 0)) {
      Alert.alert('Invalid steps', 'Enter steps (e.g., 8000)');
      return;
    }

    try {
      const saved = await upsertHabitsForDate({ date: todayISO(), protein_g: p, steps: s });
      setTodayHabits({ protein_g: saved.protein_g, steps: saved.steps });
      setProtein(saved.protein_g != null ? String(saved.protein_g) : '');
      setSteps(saved.steps != null ? String(saved.steps) : '');
      setSavedTick((x) => x + 1);
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save habits');
    }
  };

  const onSaveWeight = async () => {
    const w = weight.trim() === '' ? null : Number(weight);

    const maxDisplay = units === 'lb' ? 700 : 350;
    if (w !== null && (!Number.isFinite(w) || w <= 0 || w > maxDisplay)) {
      Alert.alert('Invalid weight', `Enter your body weight in ${units} (e.g., ${units === 'lb' ? '180' : '80'})`);
      return;
    }

    try {
      const weightKg = w === null ? null : Number(toKg(w).toFixed(3));
      const saved = await upsertWeightForDate({ date: todayISO(), weight_kg: weightKg });
      setTodayWeight({ weight_kg: saved.weight_kg });
      // Keep the input in display units
      setWeight(saved.weight_kg != null ? String(toDisplayWeight(Number(saved.weight_kg)).toFixed(1).replace(/\.0$/, '')) : '');
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save weight');
    }
  };

  const recommendations = useMemo(() => {
    if (!thisWeek || !goals) return null;

    const currentSteps = goals.steps_goal;
    const currentProtein = goals.protein_goal_g;

    // Weight delta (if both weeks exist)
    const currKg = weeklyCheckin?.weight_kg ?? null;
    const prevKg = prevWeeklyCheckin?.weight_kg ?? null;
    const deltaKg = currKg != null && prevKg != null ? currKg - prevKg : null;

    let nextSteps = currentSteps;
    let nextProtein = currentProtein;
    const reasons: string[] = [];

    // Steps rule: if you're consistently hitting steps but weight isn't trending down, nudge steps up.
    if (thisWeek.stepsDaysHit >= 3 && deltaKg != null && deltaKg > -0.2) {
      nextSteps = Math.min(20000, currentSteps + 1000);
      reasons.push('You hit your steps goal most days and weight is flat/up → +1000 steps/day.');
    } else if (thisWeek.stepsDaysHit <= 1 && currentSteps > 3000) {
      nextSteps = Math.max(3000, currentSteps - 500);
      reasons.push('Steps goal was hard to hit → make it more doable (-500 steps/day).');
    } else {
      reasons.push('Keep steps goal the same.');
    }

    // Protein rule: if protein goal is rarely hit, reduce slightly to build consistency first.
    if (thisWeek.proteinDaysHit <= 1 && currentProtein > 80) {
      nextProtein = Math.max(80, currentProtein - 10);
      reasons.push('Protein goal felt tough → -10g to build consistency.');
    } else {
      reasons.push('Keep protein goal the same.');
    }

    return {
      nextSteps,
      nextProtein,
      deltaKg,
      reasons,
    };
  }, [thisWeek, goals, weeklyCheckin?.weight_kg, prevWeeklyCheckin?.weight_kg]);

  return (
    <Screen>
      <Text style={[styles.title, isDark && styles.textLight]}>Progress</Text>
      <Text style={[styles.subtitle, isDark && styles.mutedDark]}>Consistency scoreboard (last 4 weeks)</Text>

      {loading ? (
        <Text style={[styles.muted, isDark && styles.mutedDark]}>Loading…</Text>
      ) : (
        <>
          {thisWeek ? (
            <>
              <Card>
                <Text style={[styles.cardTitle, { color: t.colors.text }]}>This week</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, styles[`badge_${thisWeek.grade}` as const]]}>
                  <Text style={styles.badgeText}>{gradeLabel(thisWeek.grade)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.muted, isDark && styles.mutedDark]}>Consistency grade for the week</Text>
                  <Text style={[styles.helpSmall, isDark && styles.mutedDark]}>
                    Consistency-first: effort counts. No streak shame.
                  </Text>
                </View>
              </View>

              <View style={styles.quest}>
                <Text style={[styles.questTitle, isDark && styles.textLight]}>3-Workout Quest</Text>
                <Text style={[styles.muted, isDark && styles.mutedDark]}>
                  {Math.min(thisWeek.workoutsCompleted, 3)} / 3 complete
                  {thisWeek.workoutsCompleted >= 3 ? ' — Quest cleared' : ''}
                </Text>
                <View style={styles.barOuter}>
                  <View
                    style={[
                      styles.barInner,
                      {
                        backgroundColor: accentColor,
                        width: `${Math.min(thisWeek.workoutsCompleted / 3, 1) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.metricBlock}>
                <Text style={[styles.line, isDark && styles.textLight]}>
                  Workouts: {thisWeek.workoutsCompleted} (goal 3)
                  {thisWeek.workoutsCompleted > 3 ? ` • +${thisWeek.workoutsCompleted - 3} extra credit` : ''}
                </Text>
                <View style={styles.barOuter}>
                  <View
                    style={[
                      styles.barInner,
                      {
                        backgroundColor: accentColor,
                        width: `${Math.min(thisWeek.workoutsCompleted / 3, 1) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.metricBlock}>
                <Text style={[styles.line, isDark && styles.textLight]}>
                  Protein goal days (≥ goal): {thisWeek.proteinDaysHit} / 4 {goals ? `(goal ${goals.protein_goal_g}g)` : ''}
                </Text>
                <Text style={[styles.mini, isDark && styles.mutedDark]}>Protein logged days: {thisWeek.proteinDaysLogged} / 7</Text>
                <View style={styles.barOuter}>
                  <View style={[styles.barInner, { backgroundColor: accentColor, width: `${Math.min(thisWeek.proteinDaysHit / 4, 1) * 100}%` }]} />
                </View>
              </View>

              <View style={styles.metricBlock}>
                <Text style={[styles.line, isDark && styles.textLight]}>
                  Steps goal days (≥ goal): {thisWeek.stepsDaysHit} / 4 {goals ? `(goal ${goals.steps_goal})` : ''}
                </Text>
                <Text style={[styles.mini, isDark && styles.mutedDark]}>Steps logged days: {thisWeek.stepsDaysLogged} / 7</Text>
                <View style={styles.barOuter}>
                  <View style={[styles.barInner, { backgroundColor: accentColor, width: `${Math.min(thisWeek.stepsDaysHit / 4, 1) * 100}%` }]} />
                </View>
              </View>
            </Card>

            <Card style={{ marginTop: 12 }}>
              <Text style={[styles.cardTitle, { color: t.colors.text }]}>Weekly check-in</Text>
              <Text style={[styles.muted, isDark && styles.mutedDark]}>
                Week starting {thisWeek.weekStart} • snapshot for your next-week plan
              </Text>

              <View style={styles.row}>
                <View style={styles.field}>
                  <Text style={[styles.label, isDark && styles.mutedDark]}>End-of-week weight ({units})</Text>
                  <TextInput
                    value={checkinWeight}
                    onChangeText={setCheckinWeight}
                    keyboardType="numeric"
                    placeholder={units === 'lb' ? '180' : '80'}
                    placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                    style={[styles.input, isDark && styles.inputDark]}
                  />
                </View>
              </View>

              <Text style={[styles.mini, isDark && styles.mutedDark]}>
                Logged this week: Workouts {thisWeek.workoutsCompleted} • Protein ≥ goal {thisWeek.proteinDaysHit} • Steps ≥ goal {thisWeek.stepsDaysHit}
              </Text>

              <View style={styles.field}>
                <Text style={[styles.label, isDark && styles.mutedDark]}>Note (optional)</Text>
                <TextInput
                  value={checkinNote}
                  onChangeText={setCheckinNote}
                  placeholder="How did it go this week?"
                  placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                  style={[styles.input, isDark && styles.inputDark]}
                />
              </View>

              <Pressable
                style={styles.button}
                onPress={async () => {
                  const w = checkinWeight.trim() === '' ? null : Number(checkinWeight);
                  const maxDisplay = units === 'lb' ? 700 : 350;
                  if (w !== null && (!Number.isFinite(w) || w <= 0 || w > maxDisplay)) {
                    Alert.alert('Invalid weight', `Enter weight in ${units}`);
                    return;
                  }
                  try {
                    const weightKg = w === null ? null : Number(toKg(w).toFixed(3));
                    const saved = await upsertWeeklyCheckin({
                      week_start: thisWeek.weekStart,
                      weight_kg: weightKg,
                      workouts_completed: thisWeek.workoutsCompleted,
                      protein_goal_days: thisWeek.proteinDaysHit,
                      steps_goal_days: thisWeek.stepsDaysHit,
                      note: checkinNote.trim() === '' ? null : checkinNote.trim(),
                    });
                    setWeeklyCheckin(saved);
                    setCheckinWeight(
                      saved.weight_kg != null
                        ? String(toDisplayWeight(Number(saved.weight_kg)).toFixed(1).replace(/\.0$/, ''))
                        : '',
                    );
                    setCheckinSavedTick((x) => x + 1);
                    Alert.alert('Saved', 'Weekly check-in saved.');
                  } catch (e: any) {
                    Alert.alert('Error', e?.message ?? 'Failed to save check-in');
                  }
                }}
              >
                <Text style={[styles.buttonText, { color: t.colors.accentTextOn }]}>
                  {weeklyCheckin || checkinSavedTick > 0 ? 'Update check-in' : 'Save check-in'}
                </Text>
              </Pressable>

              {weeklyCheckin ? (
                <Text style={[styles.help, isDark && styles.mutedDark]}>
                  Saved: {weeklyCheckin.weight_kg != null ? `${toDisplayWeight(Number(weeklyCheckin.weight_kg)).toFixed(1).replace(/\.0$/, '')} ${units}` : '—'}
                  {weeklyCheckin.note ? ` • “${weeklyCheckin.note}”` : ''}
                </Text>
              ) : null}

              {recommendations ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.cardTitle, isDark && styles.textLight]}>Next week suggestion</Text>
                  <Text style={[styles.muted, isDark && styles.mutedDark]}>
                    Protein: {recommendations.nextProtein}g/day · Steps: {recommendations.nextSteps}/day
                  </Text>
                  <Text style={[styles.help, isDark && styles.mutedDark]}>{recommendations.reasons.join(' ')}</Text>

                  <Button
                    title="Apply to my goals"
                    onPress={async () => {
                      try {
                        await updateMyGoals({ protein_goal_g: recommendations.nextProtein, steps_goal: recommendations.nextSteps });
                        setGoalsAppliedTick((x) => x + 1);
                        Alert.alert('Updated', 'Goals updated for next week.');
                        await refresh();
                      } catch (e: any) {
                        Alert.alert('Error', e?.message ?? 'Failed to update goals');
                      }
                    }}
                    style={{ marginTop: 12 }}
                  />

                  {goalsAppliedTick > 0 ? (
                    <Text style={[styles.helpSmall, isDark && styles.mutedDark]}>Applied. Check Home/Settings to confirm.</Text>
                  ) : null}
                </View>
              ) : null}
            </Card>
          </>
          ) : null}

          <Card style={{ marginTop: 12 }}>
            <Text style={[styles.cardTitle, { color: t.colors.text }]}>Log today</Text>
            <Text style={[styles.muted, isDark && styles.mutedDark]}>
              Today: Protein {todayHabits?.protein_g ?? 0}
              {goals?.protein_goal_g ? ` / ${goals.protein_goal_g}g` : 'g'} · Steps {todayHabits?.steps ?? 0}
              {goals?.steps_goal ? ` / ${goals.steps_goal}` : ''}
              {savedTick > 0 ? ' • Saved' : ''}
            </Text>
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={[styles.label, isDark && styles.mutedDark]}>Protein (g)</Text>
                <TextInput
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                  placeholder="120"
                  placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                  style={[styles.input, isDark && styles.inputDark]}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, isDark && styles.mutedDark]}>Steps</Text>
                <TextInput
                  value={steps}
                  onChangeText={setSteps}
                  keyboardType="numeric"
                  placeholder="8000"
                  placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                  style={[styles.input, isDark && styles.inputDark]}
                />
              </View>
            </View>
            <Button title="Save" onPress={onLogToday} style={{ marginTop: 12 }} />
          </Card>

          <Card style={{ marginTop: 12 }}>
            <Text style={[styles.cardTitle, { color: t.colors.text }]}>Weight</Text>
            <Text style={[styles.muted, isDark && styles.mutedDark]}>
              Today: {todayWeight?.weight_kg != null ? `${toDisplayWeight(Number(todayWeight.weight_kg)).toFixed(1).replace(/\.0$/, '')} ${units}` : '—'}
            </Text>
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={[styles.label, isDark && styles.mutedDark]}>Body weight ({units})</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder={units === 'lb' ? '180' : '80'}
                  placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                  style={[styles.input, isDark && styles.inputDark]}
                />
              </View>
            </View>
            <Button title="Save weight" onPress={onSaveWeight} style={{ marginTop: 12 }} />

            {weightHistory.length ? (
              <Text style={[styles.help, isDark && styles.mutedDark]}>
                Last {Math.min(weightHistory.length, 7)} entries: {weightHistory
                  .slice(-7)
                  .map((x) => `${x.date}: ${x.weight_kg == null ? '—' : toDisplayWeight(Number(x.weight_kg)).toFixed(1).replace(/\.0$/, '')} ${units}`)
                  .join(' • ')}
              </Text>
            ) : (
              <Text style={[styles.help, isDark && styles.mutedDark]}>Log a few weigh-ins to see a trend here.</Text>
            )}
          </Card>

          <Card style={{ marginTop: 12 }}>
            <Text style={[styles.cardTitle, { color: t.colors.text }]}>Last 4 weeks</Text>

            <View style={[styles.weekRow, styles.weekHeaderRow]}>
              <Text style={[styles.weekLabel, isDark && styles.textLight]}>Week</Text>
              <Text style={[styles.weekValue, styles.weekHeaderText, isDark && styles.mutedDark]}>Grade</Text>
              <Text style={[styles.weekValue, styles.weekHeaderText, styles.weekRight, isDark && styles.mutedDark]}>W</Text>
              <Text style={[styles.weekValue, styles.weekHeaderText, styles.weekRight, isDark && styles.mutedDark]}>P≥</Text>
              <Text style={[styles.weekValue, styles.weekHeaderText, styles.weekRight, isDark && styles.mutedDark]}>S≥</Text>
            </View>

            {weeks.map((w) => (
              <View key={w.weekStart} style={styles.weekRow}>
                <Text style={[styles.weekLabel, isDark && styles.textLight]}>{w.weekStart}</Text>
                <Text style={[styles.weekValue, isDark && styles.mutedDark]}>{gradeLabel(w.grade)}</Text>
                <Text style={[styles.weekValue, styles.weekRight, isDark && styles.mutedDark]}>{w.workoutsCompleted}</Text>
                <Text style={[styles.weekValue, styles.weekRight, isDark && styles.mutedDark]}>{w.proteinDaysHit}</Text>
                <Text style={[styles.weekValue, styles.weekRight, isDark && styles.mutedDark]}>{w.stepsDaysHit}</Text>
              </View>
            ))}
            <Text style={[styles.help, isDark && styles.mutedDark]}>
              Legend: W=workouts completed • P≥=protein goal days • S≥=steps goal days
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#ffffff' },
  scrollDark: { backgroundColor: '#020617' },
  container: { padding: 20, paddingBottom: 60, backgroundColor: '#ffffff', flexGrow: 1 },
  containerDark: { backgroundColor: '#020617' },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 6, color: '#0f172a' },
  textLight: { color: '#e5e7eb' },
  subtitle: { marginBottom: 12, color: '#334155' },
  muted: { color: '#334155' },
  mutedDark: { color: '#94a3b8' },
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
  cardTitle: { fontWeight: '900', marginBottom: 8, color: '#0f172a' },
  line: { marginTop: 6, color: '#0f172a' },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
  label: { fontSize: 12, marginBottom: 6, color: '#475569' },
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
  button: {
    marginTop: 12,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '900' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: 'white', fontWeight: '900' },
  badge_starter: { backgroundColor: '#334155' },
  badge_bronze: { backgroundColor: '#b45309' },
  badge_silver: { backgroundColor: '#475569' },
  badge_gold: { backgroundColor: '#ca8a04' },

  quest: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    backgroundColor: 'rgba(15, 118, 110, 0.06)',
    marginTop: 6,
    marginBottom: 12,
  },
  questTitle: { fontWeight: '900', marginBottom: 4, color: '#0f172a' },

  metricBlock: { marginTop: 10 },
  barOuter: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
    overflow: 'hidden',
    marginTop: 6,
  },
  barInner: {
    height: '100%',
    // backgroundColor is overridden at call sites via accentColor
    backgroundColor: '#0f766e',
  },

  weekRow: { flexDirection: 'row', marginTop: 10 },
  weekHeaderRow: { marginTop: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(15, 23, 42, 0.08)' },
  weekHeaderText: { letterSpacing: 0.3 },
  weekLabel: { flex: 2.2, fontWeight: '800', color: '#0f172a' },
  weekValue: { flex: 1.1, color: '#475569' },
  weekRight: { textAlign: 'right' },
  help: { marginTop: 10, fontSize: 12 },
  helpSmall: { marginTop: 2, fontSize: 12 },
  mini: { marginTop: 2, fontSize: 12 },
});
