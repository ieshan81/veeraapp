import { theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surfaceElevated,
    borderRadius: theme.radiusLg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadow.card,
  },
});
