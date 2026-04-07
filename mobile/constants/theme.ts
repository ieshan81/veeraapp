/** VEERA — Botanical premium design tokens */
export const theme = {
  // ── Dark botanical palette (main app screens) ──
  bg: '#132A1F',
  bgElevated: '#1A3829',
  bgCard: '#1F4032',

  // ── Accent ──
  accent: '#3E8466',
  accentMuted: '#55A382',
  accentLight: '#72BF9B',
  accentSoft: '#E5F0EA',

  // ── Light surfaces (auth / modals) ──
  surface: '#F0F4F1',
  surfaceElevated: '#FFFFFF',

  // ── Text ──
  text: '#1A2E25',
  textLight: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  textSecondary: '#607D71',

  // ── Borders ──
  border: '#D1E0D8',
  borderDark: 'rgba(255,255,255,0.10)',

  // ── Semantic ──
  danger: '#C85050',

  // ── Radius ──
  radiusXl: 24,
  radiusLg: 20,
  radiusMd: 14,
  radiusSm: 10,
  radiusFull: 999,

  // ── Glass on dark backgrounds ──
  glassWhite: 'rgba(255,255,255,0.12)',
  glassWhiteBorder: 'rgba(255,255,255,0.18)',

  // ── Glass on light backgrounds (auth / modals) ──
  glassLight: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(255,255,255,0.45)',
  glassDark: 'rgba(26,46,40,0.50)',

  // ── Shadows ──
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
      elevation: 6,
    } as const,
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 10,
      elevation: 3,
    } as const,
  },
};

/** Loaded in root _layout via @expo-google-fonts/dm-sans */
export const fontFamily = {
  displayBold: 'DMSans_700Bold',
  semi: 'DMSans_600SemiBold',
  body: 'DMSans_400Regular',
};

export const tintColorLight = theme.accent;
export const tintColorDark = '#7ecfb8';
