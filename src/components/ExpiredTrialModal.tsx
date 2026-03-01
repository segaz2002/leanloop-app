import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

type ExpiredTrialModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function ExpiredTrialModal({ visible, onDismiss }: ExpiredTrialModalProps) {
  const router = useRouter();

  const handleSubscribe = () => {
    onDismiss();
    router.push('/(app)/paywall');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            <Text style={styles.icon}>🔒</Text>
            <Text style={styles.title}>Trial Expired</Text>
            <Text style={styles.message}>
              Your free trial has ended. Subscribe to continue using premium features.
            </Text>

            <View style={styles.features}>
              <FeatureRow text="Unlimited workouts" />
              <FeatureRow text="Weekly check-ins" />
              <FeatureRow text="Goal flexibility" />
              <FeatureRow text="Advanced analytics" />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubscribe}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Subscribe Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDismiss}
              activeOpacity={0.6}
            >
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  features: {
    width: '100%',
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 8,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 15,
    color: '#333',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
  },
});
