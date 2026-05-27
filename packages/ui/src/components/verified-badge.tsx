'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium',
  {
    variants: {
      tone: {
        verified: 'bg-verified-500/10 text-verified-300 border border-verified-500/30',
        ai: 'bg-ai-500/10 text-ai-300 border border-ai-500/30',
        brand: 'bg-brand-500/10 text-brand-300 border border-brand-500/30',
        warning: 'bg-warning-500/10 text-warning-300 border border-warning-500/30',
        critical: 'bg-critical-500/10 text-critical-300 border border-critical-500/30',
        neutral: 'bg-elevated text-foreground-secondary border border-border-subtle',
      },
      withDot: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      tone: 'verified',
      withDot: true,
    },
  },
);

export interface VerifiedBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Override the dot colour explicitly. Defaults to tone-matched. */
  dotColor?: string;
}

/**
 * Trust-signal pill — green dot + label. The "Verified" indicator on the
 * SocraticDev demo cards. Used wherever we want to communicate "this output
 * was validated" (drift checks passed, security scan clean, etc).
 */
export const VerifiedBadge = React.forwardRef<HTMLSpanElement, VerifiedBadgeProps>(
  ({ className, tone, withDot, dotColor, children, ...props }, ref) => {
    const defaultDotColor: Record<NonNullable<VerifiedBadgeProps['tone']>, string> = {
      verified: 'bg-verified-500 shadow-[0_0_8px_hsl(var(--verified-500))]',
      ai: 'bg-ai-500 shadow-[0_0_8px_hsl(var(--ai-500))]',
      brand: 'bg-brand-500 shadow-[0_0_8px_hsl(var(--brand-500))]',
      warning: 'bg-warning-500 shadow-[0_0_8px_hsl(var(--warning-500))]',
      critical: 'bg-critical-500 shadow-[0_0_8px_hsl(var(--critical-500))]',
      neutral: 'bg-foreground-tertiary',
    };

    return (
      <span ref={ref} className={cn(badgeVariants({ tone, withDot }), className)} {...props}>
        {withDot && (
          <span
            aria-hidden
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              dotColor ?? defaultDotColor[tone ?? 'verified'],
            )}
          />
        )}
        {children}
      </span>
    );
  },
);
VerifiedBadge.displayName = 'VerifiedBadge';
