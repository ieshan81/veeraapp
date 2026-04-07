import { theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  /** Dark botanical (main app) or light (auth / paper). */
  variant?: 'dark' | 'light';
};

/** Layered gradients and soft shapes — stays behind content, low visual noise. */
export function BotanicalBackground({ children, variant = 'dark' }: Props) {
  const isDark = variant === 'dark';
  const base = isDark ? theme.bg : theme.surface;
  const blobA = isDark ? 'rgba(62,132,102,0.14)' : 'rgba(62,132,102,0.10)';
  const blobB = isDark ? 'rgba(114,191,155,0.08)' : 'rgba(114,191,155,0.12)';
  const blobC = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)';

  return (
    <View style={[styles.root, { backgroundColor: base }]}>
      <View style={[styles.gradientTop, { backgroundColor: blobA }]} />
      <View style={[styles.blob1, { backgroundColor: blobB }]} />
      <View style={[styles.blob2, { backgroundColor: blobC }]} />
      <View style={[styles.blob3, { backgroundColor: blobA }]} />
      <View style={styles.fg}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  fg: {
    flex: 1,
  },
  gradientTop: {
    position: 'absolute',
    left: -80,
    right: -80,
    top: -120,
    height: 320,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    opacity: 0.9,
  },
  blob1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    right: -90,
    top: '18%',
    opacity: 0.55,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    left: -70,
    bottom: '8%',
    opacity: 0.45,
  },
  blob3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: '12%',
    bottom: '22%',
    opacity: 0.35,
  },
});
