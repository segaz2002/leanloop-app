import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '@/src/ui/Screen';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { Input } from '@/src/ui/Input';
import { Sparkline } from '@/src/ui/Sparkline';
import { H1, H2, Body, Label } from '@/src/ui/Typography';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { fetchWeeklyStats, todayISO } from '@/src/features/progress/progress.repo';
import type { WeeklyStats } from '@/src/features/progress/progress.logic';
import { fetchHabitsForDate, upsertHabitsForDate, type HabitsDaily } from '@/src/features/habits/habits.repo';
import { fetchWeightForDate, fetchWeightRange, upsertWeightForDate, type WeightEntry } from '@/src/features/weight/weight.repo';
import { useUnits } from '@/src/features/settings/UnitsProvider';
import { fetchWeeklyCheckin, upsertWeeklyCheckin, type WeeklyCheckin } from '@/src/features/checkin/checkin.repo';
import { updateMyGoals } from '@/src/features/profile/profile.repo';
import { useAccent } from '@/src/features/settings/AccentProvider';
import { useGoal } from '@/src/features/settings/GoalProvider';
import { computeAdjustments } from '@/src/features/checkin/adjustment.logic';

function gradeLabel(g: WeeklyStats['grade']) {
  if (g === 'gold') return 'Gold';
  if (g === 'silver') return 'Silver';
  if (g === 'bronze') return 'Bronze';
  return 'Starter';
}

export default function ProgressScreen() {
  const t = useAppTheme();
  const { units, toDisplayWeight, toKg } = useUnits();
  const { accentColor } = useAccent();
  const { goal } = useGoal();

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
      setWeight(
        saved.weight_kg != null
          ? String(toDisplayWeight(Number(saved.weight_kg)).toFixed(1).replace(/\.0$/, ''))
          : '',
      );
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save weight');
    }
  };

  const recommendations = useMemo(() => {
    if (!thisWeek || !goals) return null;
    return computeAdjustments({
      thisWeek,
      goals,
      currKg: weeklyCheckin?.weight_kg != null ? Number(weeklyCheckin.weight_kg) : null,
      prevKg: prevWeeklyCheckin?.weight_kg != null ? Number(prevWeeklyCheckin.weight_kg) : null,
      goal,
    });
  }, [thisWeek, goals, weeklyCheckin?.weight_kg, prevWeeklyCheckin?.weight_kg, goal]);

  const barTrackColor = t.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(15, 23, 42, 0.10)';

  return (
    <Screen>
      <H1>Progress</H1>
      <Body muted>Consistency scoreboard (last 4 weeks)</Body>

      {loading ? (
        <Body muted>Loading…</Body>
      ) : (
        <>
          {thisWeek ? (
            <>
              <Card>
                <H2>This week</H2>

                <View style={styles.badgeRow}>
                  <View style={[styles.badge, styles[`badge_${thisWeek.grade}` as const]]}>
                    <Body style={styles.badgeText}>{gradeLabel(thisWeek.grade)}</Body>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body muted>Consistency grade for the week</Body>
                    <Body muted style={{ fontSize: 12, marginTop: 2 }}>
                      Consistency-first: effort counts. No streak shame.
                    </Body>
                  </View>
                </View>

                <View
                  style={[
                    styles.questBox,
                    { backgroundColor: t.colors.accentSoft, borderColor: t.colors.border },
                  ]}
                >
                  <H2>3-Workout Quest</H2>
                  <Body muted>
                    {Math.min(thisWeek.workoutsCompleted, 3)} / 3 complete
                    {thisWeek.workoutsCompleted >= 3 ? ' — Quest cleared' : ''}
                  </Body>
                  <View style={[styles.barOuter, { backgroundColor: barTrackColor }]}>
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
                  <Body secondary>
                    Workouts: {thisWeek.workoutsCompleted} (goal 3)
                    {thisWeek.workoutsCompleted > 3 ? ` • +${thisWeek.workoutsCompleted - 3} extra credit` : ''}
                  </Body>
                  <View style={[styles.barOuter, { backgroundColor: barTrackColor }]}>
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
                  <Body secondary>
                    Protein goal days (≥ goal): {thisWeek.proteinDaysHit} / 4 {goals ? `(goal ${goals.protein_goal_g}g)` : ''}
                  </Body>
                  <Body muted style={{ fontSize: 12, marginTop: 2 }}>
                    Protein logged days: {thisWeek.proteinDaysLogged} / 7
                  </Body>
                  <View style={[styles.barOuter, { backgroundColor: barTrackColor }]}>
                    <View
                      style={[
                        styles.barInner,
                        {
                          backgroundColor: accentColor,
                          width: `${Math.min(thisWeek.proteinDaysHit / 4, 1) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.metricBlock}>
                  <Body secondary>
                    Steps goal days (≥ goal): {thisWeek.stepsDaysHit} / 4 {goals ? `(goal ${goals.steps_goal})` : ''}
                  </Body>
                  <Body muted style={{ fontSize: 12, marginTop: 2 }}>
                    Steps logged days: {thisWeek.stepsDaysLogged} / 7
                  </Body>
                  <View style={[styles.barOuter, { backgroundColor: barTrackColor }]}>
                    <View
                      style={[
                        styles.barInner,
                        {
                          backgroundColor: accentColor,
                          width: `${Math.min(thisWeek.stepsDaysHit / 4, 1) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </Card>

              <Card style={{ marginTop: 12 }}>
                <H2>Weekly check-in</H2>
                <Body muted>Week starting {thisWeek.weekStart} • snapshot for your next-week plan</Body>

                <View style={styles.row}>
                  <View style={styles.field}>
                    <Label>End-of-week weight ({units})</Label>
                    <Input
                      value={checkinWeight}
                      onChangeText={setCheckinWeight}
                      keyboardType="numeric"
                      placeholder={units === 'lb' ? '180' : '80'}
                    />
                  </View>
                </View>

                <Body muted style={{ fontSize: 12, marginTop: 8 }}>
                  Logged this week: Workouts {thisWeek.workoutsCompleted} • Protein ≥ goal {thisWeek.proteinDaysHit} • Steps ≥ goal {thisWeek.stepsDaysHit}
                </Body>

                <View style={styles.field}>
                  <Label>Note (optional)</Label>
                  <Input value={checkinNote} onChangeText={setCheckinNote} placeholder="How did it go this week?" />
                </View>

                <Button
                  title={weeklyCheckin || checkinSavedTick > 0 ? 'Update check-in' : 'Save check-in'}
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
                  style={{ marginTop: 12 }}
                />

                {weeklyCheckin ? (
                  <Body muted style={{ marginTop: 10, fontSize: 12 }}>
                    Saved: {weeklyCheckin.weight_kg != null ? `${toDisplayWeight(Number(weeklyCheckin.weight_kg)).toFixed(1).replace(/\.0$/, '')} ${units}` : '—'}
                    {weeklyCheckin.note ? ` • “${weeklyCheckin.note}”` : ''}
                  </Body>
                ) : null}

                {recommendations ? (
                  <View style={{ marginTop: 12 }}>
                    <H2>Next week suggestion</H2>
                    <Body muted style={{ fontSize: 12, marginBottom: 2 }}>
                      Goal: {goal === 'fat_loss' ? 'Fat loss' : goal === 'lean_gain' ? 'Lean gain' : 'Maintenance'}
                    </Body>
                    <Body muted>
                      Protein: {recommendations.nextProtein}g/day · Steps: {recommendations.nextSteps}/day
                    </Body>
                    <Body muted style={{ marginTop: 6, fontSize: 12 }}>{recommendations.reasons.join(' ')}</Body>

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
                      <Body muted style={{ marginTop: 6, fontSize: 12 }}>Applied. Check Home/Settings to confirm.</Body>
                    ) : null}
                  </View>
                ) : null}
              </Card>
            </>
          ) : null}

          <Card style={{ marginTop: 12 }}>
            <H2>Log today</H2>
            <Body muted>
              Today: Protein {todayHabits?.protein_g ?? 0}
              {goals?.protein_goal_g ? ` / ${goals.protein_goal_g}g` : 'g'} · Steps {todayHabits?.steps ?? 0}
              {goals?.steps_goal ? ` / ${goals.steps_goal}` : ''}
              {savedTick > 0 ? ' • Saved' : ''}
            </Body>

            <View style={styles.row}>
              <View style={styles.field}>
                <Label>Protein (g)</Label>
                <Input value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="120" />
              </View>
              <View style={styles.field}>
                <Label>Steps</Label>
                <Input value={steps} onChangeText={setSteps} keyboardType="numeric" placeholder="8000" />
              </View>
            </View>
            <Button title="Save" onPress={onLogToday} style={{ marginTop: 12 }} />
          </Card>

          <Card style={{ marginTop: 12 }}>
            <H2>Weight</H2>
            <Body muted>
              Today: {todayWeight?.weight_kg != null ? `${toDisplayWeight(Number(todayWeight.weight_kg)).toFixed(1).replace(/\.0$/, '')} ${units}` : '—'}
            </Body>

            <View style={styles.row}>
              <View style={styles.field}>
                <Label>Body weight ({units})</Label>
                <Input value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder={units === 'lb' ? '180' : '80'} />
              </View>
            </View>
            <Button title="Save weight" onPress={onSaveWeight} style={{ marginTop: 12 }} />

            {weightHistory.length ? (
              (() => {
                const last = weightHistory.filter((x) => x.weight_kg != null);
                const last7 = last.slice(-7);
                const prev7 = last.slice(-14, -7);
                const avg = (xs: typeof last7) => {
                  if (!xs.length) return null;
                  const sum = xs.reduce((a, x) => a + Number(x.weight_kg ?? 0), 0);
                  return sum / xs.length;
                };
                const avg7 = avg(last7);
                const avgPrev = avg(prev7);
                const delta = avg7 != null && avgPrev != null ? avg7 - avgPrev : null;

                const last14 = last.slice(-14).map((x) => (x.weight_kg == null ? null : Number(x.weight_kg)));

                return (
                  <>
                    <Body muted>
                      Trend: {avg7 != null ? `${toDisplayWeight(avg7).toFixed(1).replace(/\.0$/, '')} ${units} (7-day avg)` : '—'}
                      {delta != null
                        ? ` • ${delta < 0 ? '↓' : '↑'} ${Math.abs(toDisplayWeight(delta)).toFixed(1).replace(/\.0$/, '')} ${units} vs prior week`
                        : ''}
                    </Body>

                    <Sparkline values={last14} width={220} height={46} style={{ marginTop: 10, opacity: 0.95 }} />

                    <Body muted style={{ marginTop: 8 }}>
                      Last {Math.min(weightHistory.length, 7)} entries:{' '}
                      {weightHistory
                        .slice(-7)
                        .map((x) => `${x.date}: ${x.weight_kg == null ? '—' : toDisplayWeight(Number(x.weight_kg)).toFixed(1).replace(/\.0$/, '')} ${units}`)
                        .join(' • ')}
                    </Body>
                  </>
                );
              })()
            ) : (
              <Body muted>Log a few weigh-ins to see a trend here.</Body>
            )}
          </Card>

          <Card style={{ marginTop: 12 }}>
            <H2>Last 4 weeks</H2>

            <View style={[styles.weekRow, styles.weekHeaderRow, { borderBottomColor: t.colors.border }]}>
              <Body muted style={[styles.weekLabel, styles.weekHeaderText]}>Week</Body>
              <Body muted style={[styles.weekValue, styles.weekHeaderText]}>Grade</Body>
              <Body muted style={[styles.weekValue, styles.weekHeaderText, styles.weekRight]}>W</Body>
              <Body muted style={[styles.weekValue, styles.weekHeaderText, styles.weekRight]}>P≥</Body>
              <Body muted style={[styles.weekValue, styles.weekHeaderText, styles.weekRight]}>S≥</Body>
            </View>

            {weeks.map((w) => (
              <View key={w.weekStart} style={styles.weekRow}>
                <Body style={[styles.weekLabel, { fontWeight: '800' }]}>{w.weekStart}</Body>
                <Body muted style={styles.weekValue}>{gradeLabel(w.grade)}</Body>
                <Body muted style={[styles.weekValue, styles.weekRight]}>{w.workoutsCompleted}</Body>
                <Body muted style={[styles.weekValue, styles.weekRight]}>{w.proteinDaysHit}</Body>
                <Body muted style={[styles.weekValue, styles.weekRight]}>{w.stepsDaysHit}</Body>
              </View>
            ))}

            <Body muted style={{ marginTop: 10, fontSize: 12 }}>
              Legend: W=workouts completed • P≥=protein goal days • S≥=steps goal days
            </Body>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: 'white', fontWeight: '900' },
  badge_starter: { backgroundColor: '#334155' },
  badge_bronze: { backgroundColor: '#b45309' },
  badge_silver: { backgroundColor: '#475569' },
  badge_gold: { backgroundColor: '#ca8a04' },

  questBox: { padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 6, marginBottom: 12 },

  metricBlock: { marginTop: 10 },
  barOuter: { height: 10, borderRadius: 999, overflow: 'hidden', marginTop: 6 },
  barInner: { height: '100%' },

  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  field: { flex: 1 },

  weekRow: { flexDirection: 'row', marginTop: 10 },
  weekHeaderRow: { marginTop: 6, paddingBottom: 6, borderBottomWidth: 1 },
  weekHeaderText: { letterSpacing: 0.3 },
  weekLabel: { flex: 2.2 },
  weekValue: { flex: 1.1 },
  weekRight: { textAlign: 'right' },
});
