import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useThemePreference } from '@/src/features/settings/ThemePreferenceProvider';
import { GoalsCard } from '@/src/features/settings/GoalsCard';
import { useUnits } from '@/src/features/settings/UnitsProvider';
import { useAccent } from '@/src/features/settings/AccentProvider';
import { Screen } from '@/src/ui/Screen';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import { useAppTheme } from '@/src/theme/useAppTheme';

function ThemeModeRow() {
  const { mode, setMode } = useThemePreference();

  return (
    <View style={styles.row}>
      <Pressable style={[styles.pill, mode === 'system' && styles.pillActive]} onPress={() => setMode('system')}>
        <Text style={[styles.pillText, mode === 'system' && styles.pillTextActive]}>System</Text>
      </Pressable>
      <Pressable style={[styles.pill, mode === 'light' && styles.pillActive]} onPress={() => setMode('light')}>
        <Text style={[styles.pillText, mode === 'light' && styles.pillTextActive]}>Light</Text>
      </Pressable>
      <Pressable style={[styles.pill, mode === 'dark' && styles.pillActive]} onPress={() => setMode('dark')}>
        <Text style={[styles.pillText, mode === 'dark' && styles.pillTextActive]}>Dark</Text>
      </Pressable>
    </View>
  );
}

export default function SettingsScreen() {
  const t = useAppTheme();
  const { user, signOut } = useAuth();
  const { units, setUnits } = useUnits();
  const { accent, setAccent, accentColor, accentTextOn } = useAccent();

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: t.colors.text }]}>Settings</Text>

      <Card>
        <Text style={[styles.cardTitle, { color: t.colors.text }]}>Account</Text>
        <Text style={{ color: t.colors.textSecondary }}>{user?.email ?? '—'}</Text>
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
          <Pressable style={[styles.pill, units === 'kg' && styles.pillActive]} onPress={() => setUnits('kg')}>
            <Text style={[styles.pillText, units === 'kg' && styles.pillTextActive]}>kg</Text>
          </Pressable>
          <Pressable style={[styles.pill, units === 'lb' && styles.pillActive]} onPress={() => setUnits('lb')}>
            <Text style={[styles.pillText, units === 'lb' && styles.pillTextActive]}>lb</Text>
          </Pressable>
        </View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={[styles.cardTitle, { color: t.colors.text }]}>Accent</Text>
        <View style={styles.row}>
          <Pressable
            style={[
              styles.pill,
              accent === 'teal' && styles.pillActive,
              accent === 'teal' && { backgroundColor: '#0f766e', borderColor: '#0f766e' },
            ]}
            onPress={() => setAccent('teal')}
          >
            <Text style={[styles.pillText, accent === 'teal' && styles.pillTextActive]}>Teal</Text>
          </Pressable>
          <Pressable
            style={[
              styles.pill,
              accent === 'yellow' && styles.pillActive,
              accent === 'yellow' && { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
            ]}
            onPress={() => setAccent('yellow')}
          >
            <Text style={[styles.pillText, accent === 'yellow' && { color: '#111827' }]}>Yellow</Text>
          </Pressable>
          <Pressable
            style={[
              styles.pill,
              accent === 'pink' && styles.pillActive,
              accent === 'pink' && { backgroundColor: '#ec4899', borderColor: '#ec4899' },
            ]}
            onPress={() => setAccent('pink')}
          >
            <Text style={[styles.pillText, accent === 'pink' && styles.pillTextActive]}>Pink</Text>
          </Pressable>
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
  pill: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  pillText: { fontWeight: '800' },
  pillTextActive: { color: 'white' },
});
