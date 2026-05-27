'use client';
import * as React from 'react';
import { cn } from '../lib/cn';

interface GridBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the grid drifts diagonally over time. Default true for hero usage,
   * false on dense pages where motion would compete.
   */
  drift?: boolean;
  /** Override the radial vignette mask. Useful for full-bleed sections. */
  mask?: 'radial' | 'top' | 'bottom' | 'none';
  /** Adds a brand-coloured radial glow behind the grid. */
  glow?: boolean;
}

/**
 * Animated grid background. The signature DevForge texture — appears under
 * hero, feature, and CTA sections. Pure CSS (no canvas), GPU-accelerated.
 *
 * Layered composition:
 *   1. Mesh gradient (subtle brand wash)
 *   2. Grid pattern (drifting if enabled)
 *   3. Radial vignette mask (fades grid at edges)
 *   4. Optional ambient glow
 */
export function GridBackground({
  drift = true,
  mask = 'radial',
  glow = false,
  className,
  children,
  ...rest
}: GridBackgroundProps) {
  const maskClasses: Record<NonNullable<GridBackgroundProps['mask']>, string> = {
    radial:
      '[mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,#000_40%,transparent_100%)]',
    top: '[mask-image:linear-gradient(to_bottom,#000_0%,#000_60%,transparent_100%)]',
    bottom:
      '[mask-image:linear-gradient(to_top,#000_0%,#000_60%,transparent_100%)]',
    none: '',
  };

  return (
    <div className={cn('relative isolate overflow-hidden', className)} {...rest}>
      {/* Mesh gradient — far background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-30 bg-mesh-hero"
      />

      {/* Grid pattern */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 -z-20 bg-grid-pattern',
          maskClasses[mask],
          drift && 'animate-grid-drift',
        )}
        style={{ backgroundSize: '48px 48px' }}
      />

      {/* Optional ambient glow under hero content */}
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[1200px] -translate-x-1/2 -translate-y-1/3 bg-glow-radial blur-3xl"
        />
      )}

      {children}
    </div>
  );
}
