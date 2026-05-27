/**
 * Motion tokens for Framer Motion + CSS transitions.
 *
 * Three families:
 *   - durations: timing primitives
 *   - easings: named curves (no jerk, all chosen for the "premium" feel)
 *   - presets: full Framer-style animation configs for common patterns
 */
export const durations = {
  instant: 0,
  /** Micro-interactions: button presses, hover state changes. */
  fast: 0.12,
  /** Default transitions for most UI changes. */
  base: 0.24,
  /** Reveal-style transitions on scroll. */
  moderate: 0.5,
  /** Hero choreography, page transitions. */
  slow: 0.8,
  /** Ambient loops (pulse, glow). */
  ambient: 2.4,
} as const;

/**
 * Cubic-bezier curves chosen for premium feel.
 * `out-expo` is the default for outgoing animations; `in-out-quart` for crosses.
 */
export const easings = {
  linear: [0, 0, 1, 1] as [number, number, number, number],
  'out-quart': [0.25, 1, 0.5, 1] as [number, number, number, number],
  'out-expo': [0.16, 1, 0.3, 1] as [number, number, number, number],
  'in-out-quart': [0.76, 0, 0.24, 1] as [number, number, number, number],
  /** Spring-flavoured for chip/badge entrances. */
  'back-out': [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  /** Used by the brand pulse-glow loop. */
  'in-out-sine': [0.37, 0, 0.63, 1] as [number, number, number, number],
} as const;

/**
 * Reusable Framer Motion variants. Import + spread in any component.
 *
 * @example
 * ```tsx
 * import { motionPresets } from '@devforge/tokens';
 * <motion.div {...motionPresets.fadeUp} />
 * ```
 */
export const motionPresets = {
  fadeUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: durations.moderate, ease: easings['out-expo'] },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: durations.base, ease: easings['out-quart'] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: durations.base, ease: easings['out-expo'] },
  },
  /** Use on hero code cards — slight parallax-y entrance. */
  heroCard: {
    initial: { opacity: 0, y: 32, rotateX: 8 },
    animate: { opacity: 1, y: 0, rotateX: 0 },
    transition: { duration: durations.slow, ease: easings['out-expo'], delay: 0.15 },
  },
  /** Staggered child reveal for feature grids. */
  staggerContainer: {
    initial: {},
    animate: {
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  },
  staggerChild: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: durations.moderate, ease: easings['out-expo'] },
  },
} as const;

/**
 * CSS keyframes exposed for use in tailwind.config (extend.animation).
 */
export const keyframes = {
  'pulse-glow': {
    '0%, 100%': { boxShadow: '0 0 0 0 hsl(10 100% 60% / 0.55)' },
    '50%': { boxShadow: '0 0 0 12px hsl(10 100% 60% / 0)' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  'grid-drift': {
    '0%': { transform: 'translate3d(0, 0, 0)' },
    '100%': { transform: 'translate3d(40px, 40px, 0)' },
  },
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-6px)' },
  },
} as const;

export const animations = {
  'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
  shimmer: 'shimmer 2.4s linear infinite',
  'grid-drift': 'grid-drift 18s linear infinite',
  float: 'float 4s ease-in-out infinite',
} as const;
