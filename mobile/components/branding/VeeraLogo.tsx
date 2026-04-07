import Ionicons from '@expo/vector-icons/Ionicons';
import { fontFamily, theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

const iconSizes: Record<Size, number> = { sm: 18, md: 24, lg: 32 };
const fontSizes: Record<Size, number> = { sm: 17, md: 22, lg: 28 };

type Props = {
  size?: Size;
  showWordmark?: boolean;
  light?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function VeeraLogo({ size = 'md', showWordmark = true, light, style }: Props) {
  const iconColor = light ? theme.accentLight : theme.accent;
  const textColor = light ? theme.textLight : theme.text;

  return (
    <View style={[styles.row, style]}>
      <Ionicons name="leaf" size={iconSizes[size]} color={iconColor} />
      {showWordmark ? (
        <Text style={[styles.wordmark, { fontSize: fontSizes[size], color: textColor }]}>
          VEERA
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontWeight: '700',
    letterSpacing: 3.5,
    fontFamily: fontFamily.displayBold,
  },
});
