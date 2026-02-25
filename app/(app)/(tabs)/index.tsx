import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LeanLoop</Text>
      <Text style={styles.subtitle}>Your weekly plan that adapts.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next up</Text>
        <Text>Workout A (coming next)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today’s habits</Text>
        <Text>Protein: 0 / goal</Text>
        <Text>Steps: 0 / goal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
});
