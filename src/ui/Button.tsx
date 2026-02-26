import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

import { Text } from '@/components/Themed';
import { useAppTheme } from '@/src/theme/useAppTheme';

export function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: StyleProp<ViewStyle>;
}) {
  const t = useAppTheme();

  const bg =
    variant === 'primary'
      ? t.colors.accent
      : variant === 'secondary'
        ? t.colors.surfaceElevated
        : 'transparent';

  const borderColor =
    variant === 'secondary' ? t.colors.border : variant === 'ghost' ? 'transparent' : 'transparent';

  const textColor =
    variant === 'primary' ? t.colors.accentTextOn : t.colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: t.radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.6 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: textColor, fontWeight: '900' }}>{title}</Text>
    </Pressable>
  );
}
