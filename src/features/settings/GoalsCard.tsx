import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchMyProfile, updateMyGoals } from '@/src/features/profile/profile.repo';

export function GoalsCard() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [proteinGoal, setProteinGoal] = useState('');
  const [stepsGoal, setStepsGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const p = await fetchMyProfile();
      setProteinGoal(String(p.protein_goal_g));
      setStepsGoal(String(p.steps_goal));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onSave = async () => {
    if (saving) return;

    const pg = Number(proteinGoal);
    const sg = Number(stepsGoal);

    if (!Number.isFinite(pg) || pg <= 0) {
      Alert.alert('Invalid protein goal', 'Enter grams/day (e.g., 120)');
      return;
    }
    if (!Number.isFinite(sg) || sg <= 0) {
      Alert.alert('Invalid steps goal', 'Enter steps/day (e.g., 8000)');
      return;
    }

    setSaving(true);
    try {
      await updateMyGoals({ protein_goal_g: Math.round(pg), steps_goal: Math.round(sg) });
      Alert.alert('Saved', 'Goals updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save goals');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.block}>
      <Text style={[styles.title, isDark && styles.textLight]}>Goals</Text>
      {loading ? (
        <Text style={[styles.muted, isDark && styles.mutedDark]}>Loading…</Text>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={[styles.label, isDark && styles.mutedDark]}>Protein (g/day)</Text>
              <TextInput
                value={proteinGoal}
                onChangeText={setProteinGoal}
                keyboardType="numeric"
                placeholder="120"
                placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                style={[styles.input, isDark && styles.inputDark]}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, isDark && styles.mutedDark]}>Steps/day</Text>
              <TextInput
                value={stepsGoal}
                onChangeText={setStepsGoal}
                keyboardType="numeric"
                placeholder="8000"
                placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                style={[styles.input, isDark && styles.inputDark]}
              />
            </View>
          </View>

          <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={onSave} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save goals'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {},
  title: { fontWeight: '700', marginBottom: 8, color: '#0f172a' },
  textLight: { color: '#e5e7eb' },
  muted: { color: '#334155' },
  mutedDark: { color: '#94a3b8' },
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
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: 'white', fontWeight: '900' },
});
