/**
 * Neumorphism Design System Tokens
 *
 * Core Philosophy: Soft UI with dual opposing shadows creating
 * the illusion of physical depth. Elements appear molded from
 * the same continuous surface.
 */

export const COLORS = {
  // Neumorphism Base (Cool Monochromatic)
  background: '#E0E5EC',  // The base "cool clay" surface
  surface: '#E0E5EC',     // Same as background - neumorphism principle

  // Text (WCAG compliant)
  textPrimary: '#3D4852',   // 7.5:1 contrast ratio
  textSecondary: '#6B7280', // 4.6:1 contrast ratio (WCAG AA)
  textMuted: '#9CA3AF',     // For placeholders only

  // Accent Colors
  accent: '#6C63FF',        // Soft violet for CTAs and focus
  accentLight: '#8B84FF',   // For gradients and hover
  accentSecondary: '#38B2AC', // Teal for success/positive

  // Dot states
  dotFuture: '#CBD5E1',     // Subtle inset dot
  dotMissed: '#94A3B8',     // Grey for missed
  dotToday: '#F97316',      // Orange ring for today
  dotCompleted: '#10B981',  // Emerald green for completed

  // Shadow colors (RGBA for smooth blending)
  shadowLight: 'rgba(255, 255, 255, 0.5)',
  shadowLightStrong: 'rgba(255, 255, 255, 0.6)',
  shadowDark: 'rgba(163, 177, 198, 0.6)',
  shadowDarkStrong: 'rgba(163, 177, 198, 0.7)',

  // Goal color palette (soft, muted versions for neumorphism)
  neon: {
    violet: '#6C63FF',    // Primary accent
    teal: '#38B2AC',      // Secondary accent
    coral: '#F97316',     // Orange
    rose: '#EC4899',      // Pink
    emerald: '#10B981',   // Green
    amber: '#F59E0B',     // Amber
    gold: '#D4AF37',      // Rich gold for final day
    sky: '#0EA5E9',       // Blue
    purple: '#8B5CF6',    // Purple
  },
} as const;

export const NEON_COLORS = Object.values(COLORS.neon);

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 48,
} as const;

// Neumorphism-specific border radii (soft, hyper-rounded)
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,      // Base for buttons
  xl: 24,
  xxl: 32,     // Container/card radius
  full: 9999,
} as const;

export const DOT = {
  size: 28,
  spacing: 10,
  borderWidth: 3,
  borderRadius: 8, // Rounded square (use size/2 for circle)
} as const;

export const ANIMATION = {
  fast: 150,
  normal: 300,    // Standard UI transitions
  slow: 500,      // Weightier physics-based feel
  celebration: 800,
} as const;

/**
 * Neumorphic Shadow Configurations
 * Used with react-native-shadow-2
 */
export const SHADOWS = {
  // Extruded (raised) - default resting state
  extruded: {
    distance: 9,
    startColor: COLORS.shadowDark,
    endColor: 'transparent',
    offset: [9, 9] as [number, number],
  },
  extrudedLight: {
    distance: 9,
    startColor: COLORS.shadowLight,
    endColor: 'transparent',
    offset: [-9, -9] as [number, number],
  },

  // Extruded hover (lifted)
  extrudedHover: {
    distance: 12,
    startColor: COLORS.shadowDarkStrong,
    endColor: 'transparent',
    offset: [12, 12] as [number, number],
  },

  // Small extruded (for smaller elements)
  extrudedSmall: {
    distance: 5,
    startColor: COLORS.shadowDark,
    endColor: 'transparent',
    offset: [5, 5] as [number, number],
  },

  // Inset shadows (for pressed states, inputs)
  inset: {
    distance: 6,
    startColor: COLORS.shadowDark,
    endColor: 'transparent',
    offset: [6, 6] as [number, number],
    inner: true,
  },

  // Deep inset (for inputs, wells)
  insetDeep: {
    distance: 10,
    startColor: COLORS.shadowDarkStrong,
    endColor: 'transparent',
    offset: [10, 10] as [number, number],
    inner: true,
  },
} as const;

/**
 * Font family configuration
 * Loaded via expo-google-fonts
 */
export const FONTS = {
  display: {
    regular: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  body: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    bold: 'DMSans_700Bold',
  },
} as const;
