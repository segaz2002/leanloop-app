import React from 'react';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAppTheme } from '@/src/theme/useAppTheme';

export function Chip({
  label,
  active,
  onPress,
  activeBg,
  activeBorder,
  activeText,
  inactiveBg = 'transparent',
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  activeBg?: string;
  activeBorder?: string;
  activeText?: string;
  inactiveBg?: string;
}) {
  const t = useAppTheme();

  const bg = active ? (activeBg ?? t.colors.accentSoft) : inactiveBg;
  const border = active ? (activeBorder ?? t.colors.accent) : t.colors.border;
  const textColor = active ? (activeText ?? t.colors.accent) : t.colors.text;

  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: t.radius.pill,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
        }}
      >
        <Text style={{ fontWeight: '800', color: textColor }}>{label}</Text>
      </View>
    </Pressable>
  );
}
