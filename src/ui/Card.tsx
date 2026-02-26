import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { View } from '@/components/Themed';
import { useAppTheme } from '@/src/theme/useAppTheme';

export function Card({
  children,
  style,
  elevated = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}) {
  const t = useAppTheme();

  return (
    <View
      style={[
        {
          padding: t.spacing.md,
          borderRadius: t.radius.xl,
          backgroundColor: elevated ? t.colors.surfaceElevated : t.colors.surfaceCard,
          borderWidth: 1,
          borderColor: t.colors.border,
        },
        t.mode === 'light' ? (elevated ? t.shadow.md : t.shadow.sm) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
