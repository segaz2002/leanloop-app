import React from 'react';

import { Text, type TextProps } from '@/components/Themed';
import { useAppTheme } from '@/src/theme/useAppTheme';

function BaseText({ style, ...props }: TextProps) {
  const t = useAppTheme();
  return <Text style={[{ color: t.colors.text }, style]} {...props} />;
}

export function H1(props: TextProps) {
  const t = useAppTheme();
  return <BaseText {...props} style={[t.typography.h2, { fontWeight: '900' }, props.style]} />;
}

export function H2(props: TextProps) {
  const t = useAppTheme();
  return <BaseText {...props} style={[t.typography.h4, { fontWeight: '900' }, props.style]} />;
}

export function Body(props: TextProps & { muted?: boolean; secondary?: boolean }) {
  const t = useAppTheme();
  const color = props.muted ? t.colors.muted : props.secondary ? t.colors.textSecondary : t.colors.text;
  const { muted, secondary, style, ...rest } = props;
  return <Text {...rest} style={[t.typography.bodyMd, { color }, style]} />;
}

export function Label(props: TextProps) {
  const t = useAppTheme();
  return <Text {...props} style={[t.typography.label, { color: t.colors.muted, fontWeight: '700' }, props.style]} />;
}
