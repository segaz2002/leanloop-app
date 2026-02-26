import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchHabitsForDate, upsertHabitsForDate } from '@/src/features/habits/habits.repo';
import { fetchMyProfile } from '@/src/features/profile/profile.repo';
import { todayISO } from '@/src/features/progress/progress.repo';

export function HomeHabitsCard() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [proteinGoal, setProteinGoal] = useState<number | null>(null);
  const [stepsGoal, setStepsGoal] = useState<number | null>(null);

  const [protein, setProtein] = useState('');
  const [steps, setSteps] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const date = todayISO();
      const [profile, habits] = await Promise.all([fetchMyProfile(), fetchHabitsForDate(date)]);
      setProteinGoal(profile.protein_goal_g);
      setStepsGoal(profile.steps_goal);
      setProtein(habits?.protein_g != null ? String(habits.protein_g) : '');
      setSteps(habits?.steps != null ? String(habits.steps) : '');
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
      await upsertHabitsForDate({ date: todayISO(), protein_g: p, steps: s });
      Alert.alert('Saved', 'Logged for today.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.block}>
      <Text style={[styles.cardTitle, isDark && styles.textLight]}>Today’s habits</Text>

      {loading ? (
        <Text style={[styles.muted, isDark && styles.mutedDark]}>Loading…</Text>
      ) : (
        <>
          <Text style={[styles.muted, isDark && styles.mutedDark]}>
            Protein goal: {proteinGoal ?? '—'}g · Steps goal: {stepsGoal ?? '—'}
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

          <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={onSave} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {},
  cardTitle: { fontWeight: '700', marginBottom: 8, color: '#0f172a' },
  textLight: { color: '#e5e7eb' },
  muted: { color: '#334155' },
  mutedDark: { color: '#94a3b8' },
  row: { flexDirection: 'row', gap: 12, marginTop: 10 },
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
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: 'white', fontWeight: '900' },
});
