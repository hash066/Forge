import type { Config } from 'tailwindcss';
import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius, shadows } from './spacing';
import { keyframes, animations } from './motion';

/**
 * Tailwind preset that exposes every DevForge design token.
 *
 * Apps import this preset rather than duplicating config:
 *
 * ```ts
 * // apps/marketing/tailwind.config.ts
 * import preset from '@devforge/tokens/tailwind-preset';
 * export default { presets: [preset], content: [...] };
 * ```
 *
 * Color tokens are wired to CSS variables (see css/globals.css) so theme
 * switching at the <html> level requires no Tailwind rebuild.
 */
const preset = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        /* Semantic surface tokens (theme-aware via CSS vars) */
        background: 'hsl(var(--bg-base) / <alpha-value>)',
        elevated: 'hsl(var(--bg-elevated) / <alpha-value>)',
        overlay: 'hsl(var(--bg-overlay) / <alpha-value>)',
        glass: 'hsl(var(--surface-glass) / <alpha-value>)',
        foreground: {
          DEFAULT: 'hsl(var(--fg-primary) / <alpha-value>)',
          secondary: 'hsl(var(--fg-secondary) / <alpha-value>)',
          tertiary: 'hsl(var(--fg-tertiary) / <alpha-value>)',
          disabled: 'hsl(var(--fg-disabled) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--border-default) / <alpha-value>)',
          subtle: 'hsl(var(--border-subtle) / <alpha-value>)',
          strong: 'hsl(var(--border-strong) / <alpha-value>)',
        },
        /* Brand — coral spectrum */
        brand: {
          50: 'hsl(var(--brand-50) / <alpha-value>)',
          100: 'hsl(var(--brand-100) / <alpha-value>)',
          200: 'hsl(var(--brand-200) / <alpha-value>)',
          300: 'hsl(var(--brand-300) / <alpha-value>)',
          400: 'hsl(var(--brand-400) / <alpha-value>)',
          500: 'hsl(var(--brand-500) / <alpha-value>)',
          600: 'hsl(var(--brand-600) / <alpha-value>)',
          700: 'hsl(var(--brand-700) / <alpha-value>)',
          800: 'hsl(var(--brand-800) / <alpha-value>)',
          900: 'hsl(var(--brand-900) / <alpha-value>)',
          DEFAULT: 'hsl(var(--brand-500) / <alpha-value>)',
        },
        magenta: {
          500: 'hsl(var(--magenta-500) / <alpha-value>)',
          600: 'hsl(var(--magenta-600) / <alpha-value>)',
          DEFAULT: 'hsl(var(--magenta-500) / <alpha-value>)',
        },
        verified: {
          300: 'hsl(var(--verified-300) / <alpha-value>)',
          500: 'hsl(var(--verified-500) / <alpha-value>)',
          600: 'hsl(var(--verified-600) / <alpha-value>)',
          900: 'hsl(var(--verified-900) / <alpha-value>)',
          DEFAULT: 'hsl(var(--verified-500) / <alpha-value>)',
        },
        ai: {
          300: 'hsl(var(--ai-300) / <alpha-value>)',
          500: 'hsl(var(--ai-500) / <alpha-value>)',
          600: 'hsl(var(--ai-600) / <alpha-value>)',
          900: 'hsl(var(--ai-900) / <alpha-value>)',
          DEFAULT: 'hsl(var(--ai-500) / <alpha-value>)',
        },
        warning: {
          300: 'hsl(var(--warning-300) / <alpha-value>)',
          500: 'hsl(var(--warning-500) / <alpha-value>)',
          900: 'hsl(var(--warning-900) / <alpha-value>)',
          DEFAULT: 'hsl(var(--warning-500) / <alpha-value>)',
        },
        critical: {
          300: 'hsl(var(--critical-300) / <alpha-value>)',
          500: 'hsl(var(--critical-500) / <alpha-value>)',
          700: 'hsl(var(--critical-700) / <alpha-value>)',
          900: 'hsl(var(--critical-900) / <alpha-value>)',
          DEFAULT: 'hsl(var(--critical-500) / <alpha-value>)',
        },
        info: {
          500: 'hsl(var(--info-500) / <alpha-value>)',
          900: 'hsl(var(--info-900) / <alpha-value>)',
          DEFAULT: 'hsl(var(--info-500) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: typography.fontFamilies.display,
        sans: typography.fontFamilies.sans,
        mono: typography.fontFamilies.mono,
      },
      // Tailwind types want mutable tuples + string values, but our source
      // tokens are `as const`. Cast at the boundary to keep token literals
      // strongly typed while satisfying Tailwind's config shape.
      fontSize: typography.fontSizes as unknown as Config['theme'] extends infer T
        ? T extends { extend: { fontSize: infer F } }
          ? F
          : never
        : never,
      fontWeight: Object.fromEntries(
        Object.entries(typography.fontWeights).map(([k, v]) => [k, String(v)]),
      ),
      spacing,
      borderRadius: radius,
      boxShadow: shadows,
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, hsl(var(--brand-500)) 0%, hsl(var(--magenta-500)) 100%)',
        'brand-gradient-soft':
          'linear-gradient(135deg, hsl(var(--brand-500) / 0.18) 0%, hsl(var(--magenta-500) / 0.10) 100%)',
        'glow-radial':
          'radial-gradient(60% 50% at 50% 0%, hsl(var(--brand-500) / 0.18) 0%, transparent 70%)',
        'mesh-hero': [
          'radial-gradient(at 20% 10%, hsl(var(--brand-500) / 0.12), transparent 40%)',
          'radial-gradient(at 80% 0%, hsl(var(--magenta-500) / 0.10), transparent 45%)',
          'radial-gradient(at 50% 100%, hsl(var(--ai-500) / 0.08), transparent 50%)',
        ].join(', '),
        'grid-pattern': `linear-gradient(hsl(var(--surface-grid) / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--surface-grid) / 0.04) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid-pattern': '40px 40px',
      },
      keyframes,
      animation: animations,
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
        'back-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [
    /* tailwindcss-animate added by consumer */
  ],
} satisfies Partial<Config>;

// Suppress noisy unused-import warning for the runtime — `colors` is part of API surface.
void colors;

export default preset;
