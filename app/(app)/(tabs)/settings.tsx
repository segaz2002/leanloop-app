import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useThemePreference } from '@/src/features/settings/ThemePreferenceProvider';
import { GoalsCard } from '@/src/features/settings/GoalsCard';
import { useUnits } from '@/src/features/settings/UnitsProvider';
import { useAccent } from '@/src/features/settings/AccentProvider';
import { useGoal } from '@/src/features/settings/GoalProvider';
import { Screen } from '@/src/ui/Screen';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { Chip } from '@/src/ui/Chip';
import { Body } from '@/src/ui/Typography';
import { useAppTheme } from '@/src/theme/useAppTheme';

function ThemeModeRow() {
  const { mode, setMode } = useThemePreference();
  const t = useAppTheme();

  return (
    <View style={styles.row}>
      <Chip label="System" active={mode === 'system'} onPress={() => setMode('system')} activeText={t.colors.accentTextOn} activeBg={t.colors.accent} />
      <Chip label="Light" active={mode === 'light'} onPress={() => setMode('light')} activeText={t.colors.accentTextOn} activeBg={t.colors.accent} />
      <Chip label="Dark" active={mode === 'dark'} onPress={() => setMode('dark')} activeText={t.colors.accentTextOn} activeBg={t.colors.accent} />
    </View>
  );
}

export default function SettingsScreen() {
  const t = useAppTheme();
  const { user, signOut } = useAuth();
  const { units, setUnits } = useUnits();
  const { accent, setAccent } = useAccent();
  const { goal, setGoal } = useGoal();

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: t.colors.text }]}>Settings</Text>

      <Card>
        <Text style={[styles.cardTitle, { color: t.colors.text }]}>Account</Text>
        <Text style={{ color: t.colors.textSecondary }}>{user?.email ?? '—'}</Text>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: t.colors.text }]}>Goal</Text>
        <Body muted style={{ marginBottom: 10, fontSize: 12 }}>
          Sets how weekly suggestions are calculated.
        </Body>
        <View style={styles.row}>
          <Chip label="Fat loss" active={goal === 'fat_loss'} onPress={() => setGoal('fat_loss')} activeText={t.colors.accentTextOn} activeBg={t.colors.accent} />
          <Chip label="Maintenance" active={goal === 'maintenance'} onPress={() => setGoal('maintenance')} activeText={t.colors.accentTextOn} activeBg={t.colors.accent} />
          <Chip label="Lean gain" active={goal === 'lean_gain'} onPress={() => setGoal('lean_gain')} activeText={t.colors.accentTextOn} activeBg={t.colors.accent} />
        </View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: t.colors.text }]}>Goals</Text>
        <GoalsCard />
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: t.colors.text }]}>Theme</Text>
        <ThemeModeRow />
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: t.colors.text }]}>Units</Text>
        <View style={styles.row}>
          <Chip label="kg" active={units === 'kg'} onPress={() => setUnits('kg')} activeText={t.colors.accentTextOn} activeBg={t.colors.accent} />
          <Chip label="lb" active={units === 'lb'} onPress={() => setUnits('lb')} activeText={t.colors.accentTextOn} activeBg={t.colors.accent} />
        </View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: t.colors.text }]}>Accent</Text>
        <View style={styles.row}>
          <Chip
            label="Teal"
            active={accent === 'teal'}
            onPress={() => setAccent('teal')}
            activeBg="#0f766e"
            activeBorder="#0f766e"
            activeText="#ffffff"
            inactiveBg={t.colors.surfaceCard}
          />
          <Chip
            label="Yellow"
            active={accent === 'yellow'}
            onPress={() => setAccent('yellow')}
            activeBg="#fbbf24"
            activeBorder="#fbbf24"
            activeText="#111827"
            inactiveBg={t.colors.surfaceCard}
          />
          <Chip
            label="Pink"
            active={accent === 'pink'}
            onPress={() => setAccent('pink')}
            activeBg="#ec4899"
            activeBorder="#ec4899"
            activeText="#ffffff"
            inactiveBg={t.colors.surfaceCard}
          />
        </View>
      </Card>

      <Button title="Log out" onPress={() => signOut()} style={{ marginTop: 16 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', marginBottom: 12 },
  cardTitle: { fontWeight: '900', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
