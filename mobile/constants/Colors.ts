import { tintColorDark, tintColorLight, theme } from '@/constants/theme';

export default {
  light: {
    text: theme.text,
    background: theme.surface,
    tint: tintColorLight,
    tabIconDefault: '#94ADA3',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: theme.textLight,
    background: theme.bg,
    tint: tintColorDark,
    tabIconDefault: 'rgba(255,255,255,0.35)',
    tabIconSelected: tintColorDark,
  },
};
