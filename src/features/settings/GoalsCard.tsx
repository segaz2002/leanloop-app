import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { View } from '@/components/Themed';
import { fetchMyProfile, updateMyGoals } from '@/src/features/profile/profile.repo';
import { Button } from '@/src/ui/Button';
import { Input } from '@/src/ui/Input';
import { Body, Label } from '@/src/ui/Typography';

export function GoalsCard() {

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
      {loading ? (
        <Body muted>Loading…</Body>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.field}>
              <Label>Protein (g/day)</Label>
              <Input value={proteinGoal} onChangeText={setProteinGoal} keyboardType="numeric" placeholder="120" />
            </View>
            <View style={styles.field}>
              <Label>Steps/day</Label>
              <Input value={stepsGoal} onChangeText={setStepsGoal} keyboardType="numeric" placeholder="8000" />
            </View>
          </View>

          <Button title={saving ? 'Saving…' : 'Save goals'} onPress={onSave} disabled={saving} style={{ marginTop: 12 }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {},
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
});
