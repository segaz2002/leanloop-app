import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useThemePreference } from '@/src/features/settings/ThemePreferenceProvider';
import { GoalsCard } from '@/src/features/settings/GoalsCard';
import { useUnits } from '@/src/features/settings/UnitsProvider';
import { useAccent } from '@/src/features/settings/AccentProvider';

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
  const { user, signOut } = useAuth();
  const { units, setUnits } = useUnits();
  const { accent, setAccent, accentColor, accentTextOn } = useAccent();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text>{user?.email ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Goals</Text>
        <GoalsCard />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Theme</Text>
        <ThemeModeRow />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Units</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.pill, units === 'kg' && styles.pillActive]}
            onPress={() => setUnits('kg')}
          >
            <Text style={[styles.pillText, units === 'kg' && styles.pillTextActive]}>kg</Text>
          </Pressable>
          <Pressable
            style={[styles.pill, units === 'lb' && styles.pillActive]}
            onPress={() => setUnits('lb')}
          >
            <Text style={[styles.pillText, units === 'lb' && styles.pillTextActive]}>lb</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accent</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.pill, accent === 'teal' && styles.pillActive, accent === 'teal' && { backgroundColor: accentColor, borderColor: accentColor }]}
            onPress={() => setAccent('teal')}
          >
            <Text style={[styles.pillText, accent === 'teal' && styles.pillTextActive, accent === 'teal' && { color: accentTextOn }]}>Teal</Text>
          </Pressable>
          <Pressable
            style={[styles.pill, accent === 'yellow' && styles.pillActive, accent === 'yellow' && { backgroundColor: '#fbbf24', borderColor: '#fbbf24' }]}
            onPress={() => setAccent('yellow')}
          >
            <Text style={[styles.pillText, accent === 'yellow' && { color: '#111827' }]}>Yellow</Text>
          </Pressable>
          <Pressable
            style={[styles.pill, accent === 'pink' && styles.pillActive, accent === 'pink' && { backgroundColor: '#ec4899', borderColor: '#ec4899' }]}
            onPress={() => setAccent('pink')}
          >
            <Text style={[styles.pillText, accent === 'pink' && styles.pillTextActive]}>Pink</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
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
  button: {
    marginTop: 8,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700' },
});
