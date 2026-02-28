import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';

import { View } from 'react-native';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { getExerciseBySlug } from '@/src/features/exercise/catalog';
import * as WebBrowser from 'expo-web-browser';

export default function ExerciseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const ex = getExerciseBySlug(String(slug));

  return (
    <ScrollView contentContainerStyle={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen
        options={{
          title: ex ? ex.title : 'Exercise',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ fontWeight: '800', color: isDark ? '#e5e7eb' : '#0f172a' }}>Back</Text>
            </Pressable>
          ),
        }}
      />

      {!ex ? (
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.title, isDark && styles.textLight]}>Exercise not found</Text>
          <Text style={[styles.muted, isDark && styles.mutedDark]}>We don’t have details for this one yet.</Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.title, isDark && styles.textLight]}>{ex.title}</Text>
            <Image source={ex.image} style={styles.image} resizeMode="contain" />

            {ex.options?.length ? (
              <>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Options</Text>
                {ex.options.map((o) => (
                  <Text key={o} style={[styles.bullet, isDark && styles.textLight]}>• {o}</Text>
                ))}
              </>
            ) : null}

            {ex.alsoCalled?.length ? (
              <>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Also called</Text>
                <Text style={[styles.muted, isDark && styles.mutedDark]}>{ex.alsoCalled.join(' · ')}</Text>
              </>
            ) : null}

            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Quick cues</Text>
            {ex.cues.map((c) => (
              <Text key={c} style={[styles.bullet, isDark && styles.textLight]}>• {c}</Text>
            ))}

            {ex.demoUrl ? (
              <Pressable
                style={[styles.button, isDark && styles.buttonDark]}
                onPress={() => WebBrowser.openBrowserAsync(ex.demoUrl!)}
              >
                <Text style={styles.buttonText}>Watch demo</Text>
              </Pressable>
            ) : null}

            <Text style={[styles.note, isDark && styles.mutedDark]}>
              MVP note: visuals are placeholders for now; we’ll swap in a licensed/consistent exercise image set.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#ffffff' },
  containerDark: { backgroundColor: '#020617' },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    backgroundColor: '#ffffff',
  },
  cardDark: {
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  image: { width: '100%', height: 220, marginVertical: 12 },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  textLight: { color: '#e5e7eb' },
  sectionTitle: { marginTop: 12, fontWeight: '900', color: '#0f172a' },
  muted: { marginTop: 6, color: '#334155' },
  mutedDark: { color: '#94a3b8' },
  bullet: { marginTop: 6, color: '#0f172a' },
  button: {
    marginTop: 14,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDark: { backgroundColor: '#111827' },
  buttonText: { color: 'white', fontWeight: '900' },
  note: { marginTop: 12 },
});
