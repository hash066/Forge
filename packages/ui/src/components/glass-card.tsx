'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const glassCardVariants = cva(
  [
    'relative rounded-2xl border backdrop-blur-xl backdrop-saturate-150',
    'shadow-xl transition-shadow duration-300',
    'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300',
    'before:bg-[linear-gradient(135deg,hsl(var(--surface-grid)/0.08)_0%,transparent_50%)]',
    'hover:before:opacity-100',
  ],
  {
    variants: {
      tone: {
        neutral:
          'bg-elevated/60 border-border-subtle hover:border-border-default',
        brand:
          'bg-elevated/60 border-brand-500/30 shadow-glow-brand hover:border-brand-500/50',
        verified:
          'bg-elevated/60 border-verified-500/30 hover:border-verified-500/50',
        ai: 'bg-elevated/60 border-ai-500/30 hover:border-ai-500/50',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:-translate-y-0.5 transition-transform',
        false: '',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      padding: 'md',
      interactive: false,
    },
  },
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

/**
 * Glass-morphism card. The SocraticDev floating-card primitive — used for the
 * hero code card, demo overlays, feature highlights. Strong backdrop blur,
 * subtle interior highlight on hover, theme-aware border.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, tone, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(glassCardVariants({ tone, padding, interactive }), className)}
      {...props}
    />
  ),
);
GlassCard.displayName = 'GlassCard';

export { glassCardVariants };
