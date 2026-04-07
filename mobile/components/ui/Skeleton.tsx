import { theme } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, type DimensionValue, StyleSheet, type ViewStyle } from 'react-native';

type Props = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  dark?: boolean;
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height,
  radius = theme.radiusMd,
  dark,
  style,
}: Props) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.8, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        dark ? styles.dark : styles.light,
        { width, height, borderRadius: radius, opacity: pulse },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  light: {
    backgroundColor: theme.border,
  },
  dark: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
});
