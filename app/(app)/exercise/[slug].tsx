import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';

import { getExerciseBySlug } from '@/src/features/exercise/catalog';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { H1, H2, Body } from '@/src/ui/Typography';
import * as WebBrowser from 'expo-web-browser';

export default function ExerciseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const t = useAppTheme();

  const ex = getExerciseBySlug(String(slug));

  const cardStyle = {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surfaceCard,
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.colors.bgPrimary }]}>
      <Stack.Screen
        options={{
          title: ex ? ex.title : 'Exercise',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <Body style={{ fontWeight: '800' }}>Back</Body>
            </Pressable>
          ),
        }}
      />

      {!ex ? (
        <Pressable style={cardStyle}>
          <H1>Exercise not found</H1>
          <Body muted>We don't have details for this one yet.</Body>
        </Pressable>
      ) : (
        <Pressable style={cardStyle}>
          <H1>{ex.title}</H1>
          <Image source={ex.image} style={styles.image} resizeMode="contain" />

          {ex.options?.length ? (
            <>
              <H2 style={{ marginTop: 12 }}>Options</H2>
              {ex.options.map((o) => (
                <Body key={o} style={{ marginTop: 4 }}>• {o}</Body>
              ))}
            </>
          ) : null}

          {ex.alsoCalled?.length ? (
            <>
              <H2 style={{ marginTop: 12 }}>Also called</H2>
              <Body muted>{ex.alsoCalled.join(' · ')}</Body>
            </>
          ) : null}

          <H2 style={{ marginTop: 12 }}>Quick cues</H2>
          {ex.cues.map((c) => (
            <Body key={c} style={{ marginTop: 4 }}>• {c}</Body>
          ))}

          {ex.demoUrl ? (
            <Pressable
              style={[styles.demoButton, { backgroundColor: t.colors.accent }]}
              onPress={() => WebBrowser.openBrowserAsync(ex.demoUrl!)}
            >
              <Body style={{ color: t.colors.accentTextOn, fontWeight: '900' }}>Watch demo</Body>
            </Pressable>
          ) : null}

          <Body muted style={{ marginTop: 12, fontSize: 12 }}>
            MVP note: visuals are placeholders for now; we'll swap in a licensed/consistent exercise image set.
          </Body>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  image: { width: '100%', height: 220, marginVertical: 12 },
  demoButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
