import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/src/hooks/useSubscription';

export function TrialBanner() {
  const router = useRouter();
  const { isTrialing, trialDaysLeft, isPremium } = useSubscription();

  // Don't show if premium or not trialing
  if (isPremium || !isTrialing || trialDaysLeft === null) {
    return null;
  }

  const daysText = trialDaysLeft === 1 ? '1 day' : `${trialDaysLeft} days`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/(app)/paywall')}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>⏰</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Trial Active</Text>
          <Text style={styles.subtitle}>{daysText} remaining</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  arrow: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
});
