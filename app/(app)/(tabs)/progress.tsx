import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchWeeklyStats, todayISO } from '@/src/features/progress/progress.repo';
import type { WeeklyStats } from '@/src/features/progress/progress.logic';
import { upsertHabitsForDate } from '@/src/features/habits/habits.repo';

function gradeLabel(g: WeeklyStats['grade']) {
  if (g === 'gold') return 'Gold';
  if (g === 'silver') return 'Silver';
  if (g === 'bronze') return 'Bronze';
  return 'Starter';
}

export default function ProgressScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<WeeklyStats[]>([]);
  const [goals, setGoals] = useState<{ protein_goal_g: number; steps_goal: number } | null>(null);

  const [protein, setProtein] = useState('');
  const [steps, setSteps] = useState('');

  const thisWeek = useMemo(() => weeks[weeks.length - 1] ?? null, [weeks]);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetchWeeklyStats(4);
      setGoals(res.profile);
      setWeeks(res.weeks);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

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
      await upsertHabitsForDate({ date: todayISO(), protein_g: p, steps: s });
      setProtein('');
      setSteps('');
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save habits');
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.textLight]}>Progress</Text>
      <Text style={[styles.subtitle, isDark && styles.mutedDark]}>Consistency scoreboard (last 4 weeks)</Text>

      {loading ? (
        <Text style={[styles.muted, isDark && styles.mutedDark]}>Loading…</Text>
      ) : (
        <>
          {thisWeek ? (
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.cardTitle, isDark && styles.textLight]}>This week</Text>
              <Text style={[styles.muted, isDark && styles.mutedDark]}>
                Grade: {gradeLabel(thisWeek.grade)}
              </Text>
              <Text style={[styles.line, isDark && styles.textLight]}>
                Workouts: {thisWeek.workoutsCompleted} / 3
              </Text>
              <Text style={[styles.line, isDark && styles.textLight]}>
                Protein days: {thisWeek.proteinDaysHit} / 4 {goals ? `(goal ${goals.protein_goal_g}g)` : ''}
              </Text>
              <Text style={[styles.line, isDark && styles.textLight]}>
                Steps days: {thisWeek.stepsDaysHit} / 4 {goals ? `(goal ${goals.steps_goal})` : ''}
              </Text>
            </View>
          ) : null}

          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.textLight]}>Log today</Text>
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
            <Text style={[styles.cardTitle, isDark && styles.textLight]}>Last 4 weeks</Text>
            {weeks.map((w) => (
              <View key={w.weekStart} style={styles.weekRow}>
                <Text style={[styles.weekLabel, isDark && styles.textLight]}>{w.weekStart}</Text>
                <Text style={[styles.weekValue, isDark && styles.mutedDark]}>{gradeLabel(w.grade)}</Text>
                <Text style={[styles.weekValue, isDark && styles.mutedDark]}>{w.workoutsCompleted}w</Text>
                <Text style={[styles.weekValue, isDark && styles.mutedDark]}>{w.proteinDaysHit}p</Text>
                <Text style={[styles.weekValue, isDark && styles.mutedDark]}>{w.stepsDaysHit}s</Text>
              </View>
            ))}
            <Text style={[styles.help, isDark && styles.mutedDark]}>
              Legend: w=workouts, p=protein days hit, s=steps days hit
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff' },
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
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weekLabel: { fontWeight: '800', color: '#0f172a' },
  weekValue: { color: '#475569' },
  help: { marginTop: 10, fontSize: 12 },
});
