import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/src/features/auth/AuthProvider';

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const { signUp, resendSignupEmail } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const res = await signUp(values.email.trim(), values.password);
      if (!res.ok) {
        Alert.alert('Could not sign up', res.error);
        return;
      }

      if (res.needsEmailConfirmation) {
        Alert.alert(
          'Check your email',
          'We sent you a confirmation email. Confirm your account, then come back and sign in.',
          [
            {
              text: 'Resend email',
              onPress: async () => {
                const email = getValues('email').trim();
                if (!email) return;
                const rr = await resendSignupEmail(email);
                if (!rr.ok) Alert.alert('Could not resend', rr.error);
                else Alert.alert('Sent', 'Check your inbox for the confirmation email.');
              },
            },
            { text: 'OK' },
          ],
        );
      } else {
        Alert.alert('Welcome', 'Account created.');
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LeanLoop</Text>
      <Text style={styles.subtitle}>Create account</Text>

      <Text style={styles.label}>Email</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            placeholder="you@example.com"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.email ? <Text style={styles.error}>{errors.email.message}</Text> : null}

      <Text style={styles.label}>Password</Text>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            secureTextEntry
            style={styles.input}
            placeholder="••••••••"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.password ? <Text style={styles.error}>{errors.password.message}</Text> : null}

      <Text style={styles.label}>Confirm password</Text>
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            secureTextEntry
            style={styles.input}
            placeholder="••••••••"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.confirmPassword ? <Text style={styles.error}>{errors.confirmPassword.message}</Text> : null}

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Creating…' : 'Sign up'}</Text>
      </Pressable>

      <Text style={styles.footer}>
        Already have an account? <Link href="/(auth)/sign-in">Sign in</Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 18, marginBottom: 16, opacity: 0.8 },
  label: { fontSize: 14, marginTop: 12, marginBottom: 6, opacity: 0.8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    marginTop: 18,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: '700' },
  error: { marginTop: 6, color: '#b91c1c' },
  footer: { marginTop: 16, opacity: 0.8 },
});
