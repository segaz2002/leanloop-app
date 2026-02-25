import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { useUnits } from '@/src/features/settings/UnitsProvider';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { units, setUnits } = useUnits();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text>{user?.email ?? '—'}</Text>
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
