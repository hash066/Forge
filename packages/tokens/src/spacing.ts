/**
 * DevForge spacing + radius + shadow tokens.
 *
 * Spacing follows a 4px base grid with named tokens for semantic use.
 * Shadows are layered (ambient + direct) to give floating cards real depth
 * without looking blurry — important for the glass-card aesthetic.
 */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

export const radius = {
  none: '0',
  xs: '0.25rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

/**
 * Layered shadows for depth on dark surfaces. Each token combines an ambient
 * layer (soft, wide) with a direct layer (tight, sharp) — this is what gives
 * the glass cards their lift without blur.
 */
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 hsl(230 10% 0% / 0.25)',
  sm: '0 1px 3px 0 hsl(230 10% 0% / 0.30), 0 1px 2px -1px hsl(230 10% 0% / 0.20)',
  md: '0 4px 8px -2px hsl(230 10% 0% / 0.35), 0 2px 4px -2px hsl(230 10% 0% / 0.25)',
  lg: '0 12px 24px -4px hsl(230 10% 0% / 0.40), 0 4px 8px -4px hsl(230 10% 0% / 0.25)',
  xl: '0 24px 48px -8px hsl(230 10% 0% / 0.45), 0 8px 16px -8px hsl(230 10% 0% / 0.30)',
  '2xl': '0 48px 96px -16px hsl(230 10% 0% / 0.55), 0 16px 32px -16px hsl(230 10% 0% / 0.35)',
  /** Inner glow used on focused inputs and active CTAs. */
  'glow-brand': '0 0 0 1px hsl(10 100% 60% / 0.4), 0 0 32px -8px hsl(10 100% 60% / 0.55)',
  'glow-verified': '0 0 0 1px hsl(152 80% 56% / 0.4), 0 0 24px -8px hsl(152 80% 56% / 0.5)',
  'glow-ai': '0 0 0 1px hsl(256 88% 72% / 0.4), 0 0 24px -8px hsl(256 88% 72% / 0.5)',
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
export type ShadowKey = keyof typeof shadows;
