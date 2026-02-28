import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Input } from '@/src/ui/Input';
import { Button } from '@/src/ui/Button';
import { H2, Body, Label } from '@/src/ui/Typography';
import { fetchHabitsForDate, upsertHabitsForDate } from '@/src/features/habits/habits.repo';
import { fetchMyProfile } from '@/src/features/profile/profile.repo';
import { todayISO } from '@/src/features/progress/progress.repo';
import { supabase } from '@/src/lib/supabase';

export function HomeHabitsCard() {
  const [loading, setLoading] = useState(true);
  const [proteinGoal, setProteinGoal] = useState<number | null>(null);
  const [stepsGoal, setStepsGoal] = useState<number | null>(null);

  const [protein, setProtein] = useState('');
  const [steps, setSteps] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(0);

  const [workoutsThisWeek, setWorkoutsThisWeek] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const date = todayISO();

      const [profile, habits] = await Promise.all([fetchMyProfile(), fetchHabitsForDate(date)]);
      setProteinGoal(profile.protein_goal_g);
      setStepsGoal(profile.steps_goal);
      setProtein(habits?.protein_g != null ? String(habits.protein_g) : '');
      setSteps(habits?.steps != null ? String(habits.steps) : '');

      const now = new Date();
      const d = new Date(now);
      const day = (d.getDay() + 6) % 7; // Monday=0
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      const weekStartISO = d.toISOString().slice(0, 10);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndISO = weekEnd.toISOString().slice(0, 10);

      const wRes = await supabase
        .from('workouts')
        .select('id, completed_at')
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .gte('completed_at', `${weekStartISO}T00:00:00.000Z`)
        .lte('completed_at', `${weekEndISO}T23:59:59.999Z`);

      if (wRes.error) throw wRes.error;
      setWorkoutsThisWeek((wRes.data ?? []).length);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onSave = async () => {
    if (saving) return;

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

    setSaving(true);
    try {
      const saved = await upsertHabitsForDate({ date: todayISO(), protein_g: p, steps: s });
      setProtein(saved.protein_g != null ? String(saved.protein_g) : '');
      setSteps(saved.steps != null ? String(saved.steps) : '');
      setSavedTick((x) => x + 1);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const workoutQuest = useMemo(() => {
    const w = workoutsThisWeek ?? 0;
    const done = Math.min(w, 3);
    const extra = Math.max(w - 3, 0);
    return { w, done, extra };
  }, [workoutsThisWeek]);

  const proteinNum = protein.trim() === '' ? null : Number(protein);
  const stepsNum = steps.trim() === '' ? null : Number(steps);

  const showNudge =
    !loading &&
    (proteinGoal ?? 0) > 0 &&
    (stepsGoal ?? 0) > 0 &&
    (proteinNum == null || proteinNum === 0) &&
    (stepsNum == null || stepsNum === 0);

  return (
    <View>
      <H2>Today's habits</H2>

      {loading ? (
        <Body muted>Loading…</Body>
      ) : (
        <>
          <Body muted>
            Protein goal: {proteinGoal ?? '—'}g · Steps goal: {stepsGoal ?? '—'}
          </Body>

          <Body muted style={styles.mini}>
            🎯 3-Workout Quest: {workoutQuest.done}/3{workoutQuest.w >= 3 ? ' • cleared' : ''}
            {workoutQuest.extra > 0 ? ` • +${workoutQuest.extra} extra` : ''}
          </Body>

          <Body muted style={styles.mini}>
            Today: Protein {proteinNum ?? 0}
            {proteinGoal ? ` / ${proteinGoal}g` : 'g'} · Steps {stepsNum ?? 0}
            {stepsGoal ? ` / ${stepsGoal}` : ''}
            {savedTick > 0 ? ' • Saved' : ''}
          </Body>

          {showNudge ? (
            <Body muted style={styles.mini}>
              Small wins count. Rough estimates are totally fine.
            </Body>
          ) : null}

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

          <Button title={saving ? 'Saving…' : 'Save'} onPress={onSave} disabled={saving} style={{ marginTop: 12 }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mini: { marginTop: 6, fontSize: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 10 },
  field: { flex: 1 },
});
