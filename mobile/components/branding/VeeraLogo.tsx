import React from 'react';
import { Image, StyleSheet, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

const LOGO_ON_LIGHT: ImageSourcePropType = require('@/assets/images/3.png');
const LOGO_ON_DARK: ImageSourcePropType = require('@/assets/images/4.png');

const widths: Record<Size, number> = { sm: 112, md: 148, lg: 188 };

type Props = {
  size?: Size;
  /** Use `onLight` on pale surfaces (green logo on light). `onDark` on deep green/hero (light logo). */
  variant: 'onLight' | 'onDark';
  style?: StyleProp<ImageStyle>;
};

export function VeeraLogo({ size = 'md', variant, style }: Props) {
  const source = variant === 'onLight' ? LOGO_ON_LIGHT : LOGO_ON_DARK;
  const w = widths[size];
  return (
    <Image
      accessibilityIgnoresInvertColors
      source={source}
      resizeMode="contain"
      style={[styles.img, { width: w, height: w * 0.36 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  img: {
    alignSelf: 'center',
  },
});
