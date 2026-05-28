/**
 * DevForge OS color tokens — "Obsidian & Champagne".
 *
 * A disciplined luxury palette. One hero accent (champagne gold) on a warm
 * obsidian canvas with ivory type. Status hues (jade / oxblood / amber) are
 * deliberately desaturated so an incident dashboard can stay legible without
 * ever looking like a rainbow.
 *
 * Colors are HSL CSS-variable-ready strings ("H S% L%") so they compose with
 * `hsl(var(--token) / <alpha>)` in Tailwind. Token NAMES are stable across
 * themes — swapping values here re-skins the entire product.
 *
 * Language:
 *   - Warm near-black obsidian base (#0B0A09) — cinematic, candle-lit
 *   - Warm ivory foreground (#ECE7DC) — never pure white
 *   - Champagne gold accent (#C8A96A) — the single luxury color
 *   - Muted jade = healthy / resolved · oxblood = critical · amber = warning
 */
export const colors = {
  dark: {
    /* Surfaces — warm obsidian */
    'bg-base': '40 9% 4%', //      #0B0A09 — warm near-black
    'bg-elevated': '40 8% 7%', //  #131210 — cards
    'bg-overlay': '40 9% 10%', //  #1B1815 — modals, popovers
    'surface-glass': '40 10% 13%', // composed with opacity for glass
    'surface-grid': '40 38% 88%', // warm white → grid lines at low alpha

    /* Foreground — warm ivory */
    'fg-primary': '40 33% 90%', //  #ECE7DC — warm ivory
    'fg-secondary': '40 12% 72%', // muted body
    'fg-tertiary': '40 8% 54%', //  captions, hints
    'fg-disabled': '40 6% 40%',

    /* Borders — warm hairlines */
    'border-subtle': '40 8% 15%',
    'border-default': '40 8% 22%',
    'border-strong': '40 9% 32%',

    /* Brand — champagne gold (the one accent) */
    'brand-50': '40 50% 95%',
    'brand-100': '40 48% 88%',
    'brand-200': '39 46% 80%',
    'brand-300': '38 46% 72%',
    'brand-400': '38 47% 66%',
    'brand-500': '38 47% 60%', // #C8A96A — champagne gold
    'brand-600': '36 42% 52%',
    'brand-700': '34 40% 44%', // bronze
    'brand-800': '32 38% 36%',
    'brand-900': '30 35% 26%',

    /* Brand secondary — deeper bronze (gradient endpoint = subtle gold sheen) */
    'magenta-500': '33 45% 50%', // bronze-gold
    'magenta-600': '31 42% 44%',

    /* Verified / success — muted jade */
    'verified-300': '150 25% 62%',
    'verified-500': '150 26% 46%', // refined jade
    'verified-600': '150 28% 38%',
    'verified-900': '150 25% 15%',

    /* AI / remediation activity — champagne (kept in the gold family, no violet) */
    'ai-300': '40 46% 72%',
    'ai-500': '38 47% 62%',
    'ai-600': '36 42% 52%',
    'ai-900': '34 35% 22%',

    /* Warning — muted amber */
    'warning-300': '34 70% 68%',
    'warning-500': '32 65% 55%',
    'warning-900': '30 50% 22%',

    /* Critical — oxblood (desaturated, premium, not neon) */
    'critical-300': '8 55% 64%',
    'critical-500': '6 56% 50%',
    'critical-700': '4 55% 42%',
    'critical-900': '6 45% 20%',

    /* Info / low — warm neutral taupe (adds no extra hue) */
    'info-500': '40 10% 60%',
    'info-900': '40 10% 22%',
  },
  light: {
    /* Surfaces — warm paper */
    'bg-base': '40 30% 97%', //     warm ivory paper
    'bg-elevated': '40 24% 94%',
    'bg-overlay': '40 22% 91%',
    'surface-glass': '40 30% 99%',
    'surface-grid': '40 12% 10%',

    'fg-primary': '40 14% 11%', //  near-black warm ink
    'fg-secondary': '38 10% 30%',
    'fg-tertiary': '38 8% 46%',
    'fg-disabled': '38 8% 66%',

    'border-subtle': '40 14% 88%',
    'border-default': '40 14% 82%',
    'border-strong': '40 12% 66%',

    'brand-50': '40 50% 95%',
    'brand-100': '40 48% 88%',
    'brand-200': '39 46% 80%',
    'brand-300': '38 46% 70%',
    'brand-400': '37 44% 58%',
    'brand-500': '34 44% 46%', // deeper gold for contrast on paper
    'brand-600': '32 44% 40%',
    'brand-700': '30 42% 34%',
    'brand-800': '28 40% 28%',
    'brand-900': '26 38% 22%',

    'magenta-500': '30 42% 40%',
    'magenta-600': '28 42% 34%',

    'verified-300': '150 28% 44%',
    'verified-500': '150 34% 32%',
    'verified-600': '150 36% 26%',
    'verified-900': '150 30% 14%',

    'ai-300': '36 44% 54%',
    'ai-500': '34 44% 44%',
    'ai-600': '32 44% 38%',
    'ai-900': '30 38% 20%',

    'warning-300': '34 70% 52%',
    'warning-500': '30 72% 42%',
    'warning-900': '28 56% 20%',

    'critical-300': '8 60% 52%',
    'critical-500': '6 62% 44%',
    'critical-700': '4 62% 36%',
    'critical-900': '6 48% 18%',

    'info-500': '40 8% 44%',
    'info-900': '40 10% 20%',
  },
} as const;

/**
 * Gradient presets — composed in CSS but expressed here for portability.
 * The signature gradient is a restrained champagne→bronze sheen, not a hue jump.
 */
export const gradients = {
  /** Signature accent gradient — hero emphasis text and primary CTAs. */
  brand:
    'linear-gradient(100deg, hsl(40 52% 72%) 0%, hsl(36 47% 58%) 45%, hsl(31 44% 46%) 100%)',
  /** Ambient glow under floating cards. */
  glow:
    'radial-gradient(60% 50% at 50% 0%, hsl(38 47% 60% / 0.16) 0%, transparent 70%)',
  /** Mesh gradient for full-bleed hero backgrounds — gold + bronze + faint jade. */
  mesh: [
    'radial-gradient(at 20% 10%, hsl(38 47% 60% / 0.12), transparent 42%)',
    'radial-gradient(at 82% 0%, hsl(31 44% 46% / 0.10), transparent 46%)',
    'radial-gradient(at 50% 100%, hsl(150 26% 46% / 0.06), transparent 52%)',
  ].join(', '),
  /** Verified pill — jade. */
  verified:
    'linear-gradient(135deg, hsl(150 26% 46%) 0%, hsl(165 28% 42%) 100%)',
  /** AI / remediation framing — champagne. */
  ai: 'linear-gradient(135deg, hsl(40 48% 68%) 0%, hsl(34 44% 50%) 100%)',
} as const;

export type ColorTheme = keyof typeof colors;
export type ColorToken = keyof typeof colors.dark;
