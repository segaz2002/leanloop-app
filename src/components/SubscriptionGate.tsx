import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

interface SubscriptionGateProps {
  visible: boolean;
  onDismiss: () => void;
  feature?: string;
}

export function SubscriptionGate({
  visible,
  onDismiss,
  feature = 'this feature',
}: SubscriptionGateProps) {
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
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>Premium Feature</Text>
          <Text style={styles.message}>
            Subscribe to LeanLoop Premium to unlock {feature} and continue your fitness journey.
          </Text>

          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>View Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: Math.min(width - 40, 400),
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
