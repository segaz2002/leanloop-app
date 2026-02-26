import React from 'react';
import { StyleProp, TextInput, TextInputProps, ViewStyle } from 'react-native';

import { useAppTheme } from '@/src/theme/useAppTheme';

export function Input({
  style,
  ...props
}: TextInputProps & { style?: StyleProp<ViewStyle> }) {
  const t = useAppTheme();

  const placeholderTextColor =
    props.placeholderTextColor ?? (t.mode === 'dark' ? '#94a3b8' : '#64748b');

  return (
    <TextInput
      {...props}
      placeholderTextColor={placeholderTextColor}
      style={[
        {
          borderWidth: 1,
          borderColor: t.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15, 23, 42, 0.18)',
          backgroundColor: t.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#ffffff',
          color: t.mode === 'dark' ? '#e5e7eb' : '#0f172a',
          borderRadius: t.radius.lg,
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        style,
      ]}
    />
  );
}
