import { fontFamily, theme } from '@/constants/theme';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  textStyle,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.accent} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'primary' && styles.textPrimary,
            variant === 'secondary' && styles.textSecondary,
            variant === 'ghost' && styles.textGhost,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: theme.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: theme.accent,
    ...theme.shadow.soft,
  },
  secondary: {
    backgroundColor: theme.accentSoft,
    borderWidth: 1,
    borderColor: theme.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamily.semi,
    letterSpacing: 0.3,
  },
  textPrimary: {
    color: '#fff',
  },
  textSecondary: {
    color: theme.accent,
  },
  textGhost: {
    color: theme.accent,
  },
});
