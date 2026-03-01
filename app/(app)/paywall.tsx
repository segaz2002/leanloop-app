import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { Screen } from '@/src/ui/Screen';
import { Button } from '@/src/ui/Button';
import { H1, H2, Body } from '@/src/ui/Typography';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { useSubscription } from '@/src/hooks/useSubscription';

export default function PaywallScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const { loading, offerings, restore } = useSubscription();
  const [restoring, setRestoring] = useState(false);

  const handlePurchaseSuccess = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Success!', 'Welcome to LeanLoop Premium', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    const result = await restore();
    setRestoring(false);

    if (result.ok) {
      Alert.alert('Success', 'Purchases restored');
      router.back();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Premium', headerBackTitle: 'Back' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.accent} />
        </View>
      </Screen>
    );
  }

  // Try to use RevenueCat's remote paywall if available
  if (offerings?.current) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Premium', headerBackTitle: 'Back' }} />
        <RevenueCatUI.Paywall
          options={{
            offering: offerings.current,
          }}
          onPurchaseCompleted={() => {
            handlePurchaseSuccess();
          }}
          onPurchaseError={(error) => {
            console.error('Purchase error:', error);
          }}
          onRestoreCompleted={() => {
            Alert.alert('Success', 'Purchases restored');
            router.back();
          }}
          onRestoreError={(error) => {
            console.error('Restore error:', error);
            Alert.alert('Error', 'Failed to restore purchases');
          }}
          onDismiss={() => {
            router.back();
          }}
        />
      </Screen>
    );
  }

  // Fallback: Custom paywall if RevenueCat UI not configured
  return (
    <Screen scroll style={{ padding: 20 }}>
      <Stack.Screen options={{ title: 'Premium', headerBackTitle: 'Back' }} />
      
      <View style={styles.header}>
        <H1 style={{ textAlign: 'center', color: t.accent }}>LeanLoop Premium</H1>
        <Body style={{ textAlign: 'center', marginTop: 12, color: t.textSecondary }}>
          Unlock your full potential
        </Body>
      </View>

      <View style={styles.features}>
        <H2 style={{ marginBottom: 16, color: t.text }}>Premium Features</H2>
        
        <FeatureItem
          title="Unlimited Workouts"
          description="Access all workout programs and track unlimited sessions"
          color={t.text}
          secondaryColor={t.textSecondary}
        />
        <FeatureItem
          title="Weekly Check-ins"
          description="Submit weekly progress updates and get personalized plan adjustments"
          color={t.text}
          secondaryColor={t.textSecondary}
        />
        <FeatureItem
          title="Goal Flexibility"
          description="Switch between fat loss, maintenance, and lean gain goals anytime"
          color={t.text}
          secondaryColor={t.textSecondary}
        />
        <FeatureItem
          title="Advanced Analytics"
          description="Track your progress with detailed charts and insights"
          color={t.text}
          secondaryColor={t.textSecondary}
        />
      </View>

      <View style={styles.pricing}>
        <Body style={{ textAlign: 'center', color: t.textSecondary, marginBottom: 8 }}>
          7-day free trial, then:
        </Body>
        <H2 style={{ textAlign: 'center', color: t.text }}>$9.99/month or $59.99/year</H2>
      </View>

      <View style={styles.actions}>
        <Button
          title="Start Free Trial"
          onPress={() => {
            Alert.alert(
              'Configure RevenueCat',
              'Please configure your RevenueCat paywall in the dashboard to enable purchases.',
            );
          }}
          style={{ marginBottom: 12 }}
        />
        <Button
          title="Restore Purchases"
          onPress={handleRestorePurchases}
          variant="secondary"
          loading={restoring}
        />
      </View>

      <Body style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: t.textSecondary }}>
        Cancel anytime. Auto-renews unless cancelled.
      </Body>
    </Screen>
  );
}

function FeatureItem({
  title,
  description,
  color,
  secondaryColor,
}: {
  title: string;
  description: string;
  color: string;
  secondaryColor: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.bullet} />
      <View style={{ flex: 1 }}>
        <Body style={{ fontWeight: '600', color }}>{title}</Body>
        <Body style={{ fontSize: 14, marginTop: 2, color: secondaryColor }}>{description}</Body>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginTop: 6,
    marginRight: 12,
  },
  pricing: {
    marginBottom: 32,
  },
  actions: {
    marginBottom: 20,
  },
});
