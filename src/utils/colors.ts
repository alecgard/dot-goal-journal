import { NEON_COLORS } from '../constants/theme';
import { NeonColor } from '../types';

/**
 * Get a random neon color from the palette
 */
export function getRandomNeonColor(): NeonColor {
  const index = Math.floor(Math.random() * NEON_COLORS.length);
  return NEON_COLORS[index] as NeonColor;
}

/**
 * Get the next color in the palette (for cycling)
 */
export function getNextNeonColor(currentColor: NeonColor): NeonColor {
  const index = NEON_COLORS.indexOf(currentColor);
  const nextIndex = (index + 1) % NEON_COLORS.length;
  return NEON_COLORS[nextIndex] as NeonColor;
}
