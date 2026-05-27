import * as React from 'react';
import { cn } from '../lib/cn';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'prose';
}

/**
 * Page-level max-width wrapper. Five sizes:
 *   - prose: long-form reading (65ch)
 *   - sm: 720px (single-column docs)
 *   - md: 960px (default content)
 *   - lg: 1200px (most marketing sections)
 *   - xl: 1440px (full hero, dashboards)
 */
export function Container({ size = 'lg', className, ...props }: ContainerProps) {
  const sizes = {
    sm: 'max-w-[720px]',
    md: 'max-w-[960px]',
    lg: 'max-w-[1200px]',
    xl: 'max-w-[1440px]',
    prose: 'max-w-[65ch]',
  };

  return <div className={cn('mx-auto w-full px-6 md:px-8', sizes[size], className)} {...props} />;
}
