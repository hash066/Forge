/**
 * DevForge OS typography tokens — "Obsidian & Champagne".
 *
 * A niche, editorial pairing:
 *   - Display (Fraunces): high-contrast serif for hero copy + big stat numbers
 *   - Sans (Hanken Grotesk): warm, legible grotesque for body, UI, navigation
 *   - Mono (JetBrains Mono): pod names, k8s identifiers, code chips
 *
 * Sizes follow a fluid scale that scales between small viewports and 2xl screens.
 * Use the named tokens (e.g. `text-display-2xl`) rather than raw values.
 */
export const typography = {
  fontFamilies: {
    display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'].join(', '),
    sans: ['var(--font-sans)', 'Hanken Grotesk', 'Inter', 'system-ui', 'sans-serif'].join(', '),
    mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'].join(', '),
  },

  /**
   * Fluid scale — clamp(min, preferred, max). Hero copy goes up to ~144px on
   * large viewports for the SocraticDev-style "wall of text" energy.
   */
  fontSizes: {
    'display-3xl': ['clamp(3.5rem, 8vw + 1rem, 9rem)', { lineHeight: '0.92', letterSpacing: '-0.04em' }],
    'display-2xl': ['clamp(2.75rem, 6vw + 1rem, 6.5rem)', { lineHeight: '0.95', letterSpacing: '-0.035em' }],
    'display-xl': ['clamp(2.25rem, 4.5vw + 1rem, 4.5rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
    'display-lg': ['clamp(1.875rem, 3vw + 1rem, 3rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
    'heading-xl': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
    'heading-lg': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
    'heading-md': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
    'heading-sm': ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.005em' }],
    'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],
    'body-md': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
    'body-sm': ['0.875rem', { lineHeight: '1.55', letterSpacing: '0' }],
    'caption': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
    'micro': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.08em', textTransform: 'uppercase' as const }],
    'code-md': ['0.875rem', { lineHeight: '1.6', letterSpacing: '0' }],
    'code-sm': ['0.8125rem', { lineHeight: '1.55', letterSpacing: '0' }],
  },

  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
} as const;

export type FontSize = keyof typeof typography.fontSizes;
export type FontWeight = keyof typeof typography.fontWeights;
