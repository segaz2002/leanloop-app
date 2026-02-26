import React from 'react';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAppTheme } from '@/src/theme/useAppTheme';

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const t = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: t.radius.pill,
          backgroundColor: active ? t.colors.accentSoft : 'transparent',
          borderWidth: 1,
          borderColor: active ? t.colors.accent : t.colors.border,
        }}
      >
        <Text style={{ fontWeight: '800', color: active ? t.colors.accent : t.colors.text }}>{label}</Text>
      </View>
    </Pressable>
  );
}
