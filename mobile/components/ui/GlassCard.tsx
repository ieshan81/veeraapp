import { theme } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
};

export function GlassCard({ children, style, dark }: Props) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={dark ? 24 : 36}
        tint={dark ? 'dark' : 'light'}
        style={[
          styles.card,
          dark ? styles.darkCard : null,
          theme.shadow.card,
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.card,
        dark ? styles.androidDark : styles.androidLight,
        theme.shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radiusLg,
    padding: 18,
    overflow: 'hidden',
  },
  darkCard: {
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
