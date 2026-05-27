/**
 * DevForge color tokens.
 *
 * Two themes: dark (default, primary product surface) and light.
 * Colors are expressed as HSL CSS-variable-ready strings ("H S% L%") so they
 * can be composed with `hsl(var(--token) / <alpha>)` in Tailwind.
 *
 * Brand language:
 *   - Near-black base with cool undertone (not pure black — more cinematic)
 *   - Electric coral primary (gradient #FF6B4A → #FF4F8B for emphasis)
 *   - Phosphor green for "verified" / success / passed-gate states
 *   - Violet for AI / mentor / synthetic-content framing
 *   - Amber for warnings, scarlet for critical
 */
export const colors = {
  dark: {
    /* Surfaces */
    'bg-base': '230 10% 4%', //   #0A0A0B — near-black, slight cool tint
    'bg-elevated': '232 10% 7%', // #131316 — cards
    'bg-overlay': '232 12% 10%', // #181820 — modals, popovers
    'surface-glass': '232 15% 12%', // composed with opacity for glass
    'surface-grid': '0 0% 100%', //  white with low alpha → grid lines

    /* Foreground */
    'fg-primary': '210 20% 98%', // crisp off-white
    'fg-secondary': '215 12% 75%', // muted body
    'fg-tertiary': '215 10% 55%', // captions, hints
    'fg-disabled': '215 8% 38%',

    /* Borders */
    'border-subtle': '230 10% 16%', // hairline dividers
    'border-default': '230 10% 22%',
    'border-strong': '230 12% 32%',

    /* Brand — electric coral */
    'brand-50': '15 100% 96%',
    'brand-100': '15 100% 90%',
    'brand-200': '14 100% 80%',
    'brand-300': '13 100% 72%',
    'brand-400': '12 100% 65%',
    'brand-500': '10 100% 60%', // #FF6B4A — primary coral
    'brand-600': '6 100% 56%',
    'brand-700': '3 95% 50%',
    'brand-800': '0 90% 42%',
    'brand-900': '0 80% 32%',

    /* Brand secondary — magenta (gradient endpoint) */
    'magenta-500': '335 100% 65%', // #FF4F8B
    'magenta-600': '335 95% 58%',

    /* Verified / success — phosphor green */
    'verified-300': '152 80% 70%',
    'verified-500': '152 80% 56%', // #3FE0A0
    'verified-600': '152 75% 46%',
    'verified-900': '152 60% 18%',

    /* AI / mentor — violet */
    'ai-300': '256 95% 80%',
    'ai-500': '256 88% 72%', // #A78BFA
    'ai-600': '256 80% 64%',
    'ai-900': '256 50% 22%',

    /* Warning — amber */
    'warning-300': '38 95% 75%',
    'warning-500': '38 92% 58%',
    'warning-900': '32 75% 22%',

    /* Critical — scarlet */
    'critical-300': '0 90% 78%',
    'critical-500': '0 84% 60%',
    'critical-700': '0 80% 48%',
    'critical-900': '0 65% 22%',

    /* Info — sky */
    'info-500': '199 89% 60%',
    'info-900': '210 70% 22%',
  },
  light: {
    'bg-base': '0 0% 100%',
    'bg-elevated': '210 20% 98%',
    'bg-overlay': '210 20% 95%',
    'surface-glass': '0 0% 100%',
    'surface-grid': '232 10% 0%',

    'fg-primary': '232 18% 8%',
    'fg-secondary': '230 12% 28%',
    'fg-tertiary': '228 10% 45%',
    'fg-disabled': '228 8% 65%',

    'border-subtle': '220 14% 92%',
    'border-default': '220 14% 86%',
    'border-strong': '220 12% 70%',

    'brand-50': '15 100% 96%',
    'brand-100': '15 100% 90%',
    'brand-200': '14 100% 80%',
    'brand-300': '13 100% 72%',
    'brand-400': '12 100% 65%',
    'brand-500': '10 100% 56%',
    'brand-600': '6 100% 50%',
    'brand-700': '3 95% 44%',
    'brand-800': '0 90% 38%',
    'brand-900': '0 80% 28%',

    'magenta-500': '335 95% 58%',
    'magenta-600': '335 90% 50%',

    'verified-300': '152 60% 56%',
    'verified-500': '152 75% 36%',
    'verified-600': '152 80% 28%',
    'verified-900': '152 60% 14%',

    'ai-300': '256 70% 60%',
    'ai-500': '256 75% 50%',
    'ai-600': '256 70% 42%',
    'ai-900': '256 50% 22%',

    'warning-300': '38 92% 60%',
    'warning-500': '32 95% 44%',
    'warning-900': '32 75% 22%',

    'critical-300': '0 80% 60%',
    'critical-500': '0 84% 48%',
    'critical-700': '0 80% 38%',
    'critical-900': '0 65% 22%',

    'info-500': '199 89% 44%',
    'info-900': '210 70% 22%',
  },
} as const;

/**
 * Gradient presets — composed in CSS but expressed here for portability.
 */
export const gradients = {
  /** The signature brand gradient — used on hero emphasis text and primary CTAs. */
  brand:
    'linear-gradient(90deg, hsl(10 100% 60%) 0%, hsl(335 100% 65%) 100%)',
  /** Ambient glow under floating cards. */
  glow:
    'radial-gradient(60% 50% at 50% 0%, hsl(10 100% 60% / 0.18) 0%, transparent 70%)',
  /** Mesh gradient for full-bleed hero backgrounds. */
  mesh: [
    'radial-gradient(at 20% 10%, hsl(10 100% 60% / 0.12), transparent 40%)',
    'radial-gradient(at 80% 0%, hsl(335 100% 65% / 0.10), transparent 45%)',
    'radial-gradient(at 50% 100%, hsl(256 88% 72% / 0.08), transparent 50%)',
  ].join(', '),
  /** Verified pill — green to teal */
  verified:
    'linear-gradient(135deg, hsl(152 80% 56%) 0%, hsl(180 75% 50%) 100%)',
  /** AI / mentor framing */
  ai: 'linear-gradient(135deg, hsl(256 88% 72%) 0%, hsl(280 90% 70%) 100%)',
} as const;

export type ColorTheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.dark;
