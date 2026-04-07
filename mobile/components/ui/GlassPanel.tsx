import { theme } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  dark?: boolean;
};

export function GlassPanel({ children, style, intensity = 48, dark }: Props) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={dark ? Math.min(intensity, 32) : intensity}
        tint={dark ? 'dark' : 'light'}
        style={[styles.base, dark ? styles.darkBorder : styles.lightBorder, style]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.base,
        dark ? styles.androidDark : styles.androidLight,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderRadius: theme.radiusLg,
  },
  lightBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.glassBorder,
  },
  darkBorder: {
    borderWidth: 1,
    borderColor: theme.glassWhiteBorder,
  },
  androidLight: {
    backgroundColor: theme.glassLight,
    borderWidth: 1,
    borderColor: theme.border,
  },
  androidDark: {
    backgroundColor: theme.glassWhite,
    borderWidth: 1,
    borderColor: theme.glassWhiteBorder,
  },
});
