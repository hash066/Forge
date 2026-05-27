'use client';
import * as React from 'react';
import { cn } from '../lib/cn';

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual variant. `brand` is coral→magenta, `ai` is violet→pink. */
  variant?: 'brand' | 'ai' | 'verified';
  /** Optional animation — slow shimmer across the gradient. Off by default. */
  animate?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Inline-gradient text for emphasis. Used on hero headlines for the one phrase
 * we want to ignite (e.g. the "Start Understanding" in the reference image).
 *
 * Animation is opt-in because it's distracting in body copy but magic on
 * a single hero word.
 */
export function GradientText({
  variant = 'brand',
  animate = false,
  as: Tag = 'span',
  className,
  children,
  ...props
}: GradientTextProps) {
  const variantClasses = {
    brand: 'bg-[linear-gradient(90deg,hsl(var(--brand-500))_0%,hsl(var(--magenta-500))_100%)]',
    ai: 'bg-[linear-gradient(135deg,hsl(var(--ai-500))_0%,hsl(280_90%_70%)_100%)]',
    verified:
      'bg-[linear-gradient(135deg,hsl(var(--verified-500))_0%,hsl(180_75%_50%)_100%)]',
  } as const;

  const ElementTag = Tag as React.ElementType;

  return (
    <ElementTag
      className={cn(
        'bg-clip-text text-transparent',
        variantClasses[variant],
        animate && 'animate-shimmer bg-[length:200%_100%]',
        className,
      )}
      {...props}
    >
      {children}
    </ElementTag>
  );
}
