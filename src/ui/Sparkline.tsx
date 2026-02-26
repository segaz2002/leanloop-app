import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAppTheme } from '@/src/theme/useAppTheme';

export function Sparkline({
  values,
  width = 160,
  height = 44,
  style,
}: {
  values: Array<number | null | undefined>;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useAppTheme();

  const path = useMemo(() => {
    const xs = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (xs.length < 2) return null;

    const min = Math.min(...xs);
    const max = Math.max(...xs);
    const span = Math.max(1e-6, max - min);

    const pts: Array<{ x: number; y: number }> = [];
    const n = values.length;
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      const x = (i / (n - 1)) * width;
      const y = height - ((v - min) / span) * height;
      pts.push({ x, y });
    }
    if (pts.length < 2) return null;

    return pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
  }, [values, width, height]);

  if (!path) return null;

  return (
    <Svg width={width} height={height} style={style as any}>
      <Path d={path} stroke={t.colors.accent} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
