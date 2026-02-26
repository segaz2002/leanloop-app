import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchWeeklyStats, todayISO } from '@/src/features/progress/progress.repo';
import type { WeeklyStats } from '@/src/features/progress/progress.logic';
import { fetchHabitsForDate, upsertHabitsForDate, type HabitsDaily } from '@/src/features/habits/habits.repo';
import { fetchWeightForDate, fetchWeightRange, upsertWeightForDate, type WeightEntry } from '@/src/features/weight/weight.repo';
import { useUnits } from '@/src/features/settings/UnitsProvider';

function gradeLabel(g: WeeklyStats['grade']) {
  if (g === 'gold') return 'Gold';
  if (g === 'silver') return 'Silver';
  if (g === 'bronze') return 'Bronze';
  return 'Starter';
}

export default function ProgressScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { units, toDisplayWeight, toKg } = useUnits();

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

  const thisWeek = useMemo(() => weeks[weeks.length - 1] ?? null, [weeks]);

  const refresh = async () => {
    setLoading(true);
    try {
      const date = todayISO();

      // last 28 days for simple history list
      const from = new Date();
      from.setDate(from.getDate() - 28);
      const fromISO = from.toISOString().slice(0, 10);

      const [res, today, wToday, wRange] = await Promise.all([
        fetchWeeklyStats(4),
        fetchHabitsForDate(date),
        fetchWeightForDate(date),
        fetchWeightRange({ from: fromISO, to: date }),
      ]);

      setGoals(res.profile);
      setWeeks(res.weeks);
      setTodayHabits(today ? { protein_g: today.protein_g, steps: today.steps } : null);

      // Prefill inputs from today's saved values (helps confirm the save worked)
      setProtein(today?.protein_g != null ? String(today.protein_g) : '');
      setSteps(today?.steps != null ? String(today.steps) : '');

      setTodayWeight(wToday ? { weight_kg: wToday.weight_kg } : null);
      setWeightHistory(wRange);
      setWeight(wToday?.weight_kg != null ? String(toDisplayWeight(Number(wToday.weight_kg)).toFixed(1).replace(/\.0$/, '')) : '');
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

    if (w !== null && (!Number.isFinite(w) || w <= 0 || w > 2000)) {
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

  return (
    <ScrollView
      style={[styles.scroll, isDark && styles.scrollDark]}
      contentContainerStyle={[styles.container, isDark && styles.containerDark]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={[styles.title, isDark && styles.textLight]}>Progress</Text>
      <Text style={[styles.subtitle, isDark && styles.mutedDark]}>Consistency scoreboard (last 4 weeks)</Text>

      {loading ? (
        <Text style={[styles.muted, isDark && styles.mutedDark]}>Loading…</Text>
      ) : (
        <>
          {thisWeek ? (
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.cardTitle, isDark && styles.textLight]}>This week</Text>
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
                  <View style={[styles.barInner, { width: `${Math.min(thisWeek.workoutsCompleted / 3, 1) * 100}%` }]} />
                </View>
              </View>

              <View style={styles.metricBlock}>
                <Text style={[styles.line, isDark && styles.textLight]}>
                  Workouts: {thisWeek.workoutsCompleted} (goal 3)
                  {thisWeek.workoutsCompleted > 3 ? ` • +${thisWeek.workoutsCompleted - 3} extra credit` : ''}
                </Text>
                <View style={styles.barOuter}>
                  <View style={[styles.barInner, { width: `${Math.min(thisWeek.workoutsCompleted / 3, 1) * 100}%` }]} />
                </View>
              </View>

              <View style={styles.metricBlock}>
                <Text style={[styles.line, isDark && styles.textLight]}>
                  Protein goal days (≥ goal): {thisWeek.proteinDaysHit} / 4 {goals ? `(goal ${goals.protein_goal_g}g)` : ''}
                </Text>
                <Text style={[styles.mini, isDark && styles.mutedDark]}>Protein logged days: {thisWeek.proteinDaysLogged} / 7</Text>
                <View style={styles.barOuter}>
                  <View style={[styles.barInner, { width: `${Math.min(thisWeek.proteinDaysHit / 4, 1) * 100}%` }]} />
                </View>
              </View>

              <View style={styles.metricBlock}>
                <Text style={[styles.line, isDark && styles.textLight]}>
                  Steps goal days (≥ goal): {thisWeek.stepsDaysHit} / 4 {goals ? `(goal ${goals.steps_goal})` : ''}
                </Text>
                <Text style={[styles.mini, isDark && styles.mutedDark]}>Steps logged days: {thisWeek.stepsDaysLogged} / 7</Text>
                <View style={styles.barOuter}>
                  <View style={[styles.barInner, { width: `${Math.min(thisWeek.stepsDaysHit / 4, 1) * 100}%` }]} />
                </View>
              </View>
            </View>
          ) : null}

          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.textLight]}>Log today</Text>
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
            <Pressable style={styles.button} onPress={onLogToday}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </View>

          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.textLight]}>Weight</Text>
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
            <Pressable style={styles.button} onPress={onSaveWeight}>
              <Text style={styles.buttonText}>Save weight</Text>
            </Pressable>

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
          </View>

          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.textLight]}>Last 4 weeks</Text>

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
          </View>
        </>
      )}
    </ScrollView>
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
