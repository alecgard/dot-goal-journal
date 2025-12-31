export const COLORS = {
  // Background
  background: '#1A1A1A',
  surface: '#2A2A2A',

  // Dot states
  dotFuture: '#2A2A2A',
  dotMissed: '#666666',
  dotToday: '#FF6600', // Orange ring

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#666666',

  // Neon palette for goals (6-8 colors)
  neon: {
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    lime: '#39FF14',
    orange: '#FF6600',
    pink: '#FF1493',
    spring: '#00FF7F',
    gold: '#FFD700',
    slate: '#7B68EE',
  },
} as const;

export const NEON_COLORS = Object.values(COLORS.neon);

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const DOT = {
  size: 24,
  spacing: 8,
  borderWidth: 2,
} as const;

export const ANIMATION = {
  celebration: 800, // 700-1000ms per spec
  ripple: 400,
  modal: 300,
} as const;
