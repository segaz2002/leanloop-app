import React from 'react';
import { ScrollView, StyleProp, ViewStyle } from 'react-native';

import { View } from '@/components/Themed';
import { useAppTheme } from '@/src/theme/useAppTheme';

export function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const t = useAppTheme();

  if (!scroll) {
    return (
      <View
        style={[
          { flex: 1, backgroundColor: t.colors.bgPrimary, padding: t.spacing.lg },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: t.colors.bgPrimary }, style]}
      contentContainerStyle={[{ padding: t.spacing.lg, paddingBottom: 60 }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  );
}
