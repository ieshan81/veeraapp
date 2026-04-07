import { fontFamily, theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  light?: boolean;
};

export function EmptyState({ title, subtitle, light }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, light && styles.titleLight]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sub, light && styles.subLight]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    fontFamily: fontFamily.displayBold,
    letterSpacing: 0.2,
  },
  titleLight: {
    color: theme.textLight,
  },
  sub: {
    marginTop: 10,
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: fontFamily.body,
  },
  subLight: {
    color: theme.textMuted,
  },
});
