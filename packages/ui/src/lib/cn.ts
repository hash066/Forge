import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind-aware class joiner. Handles conflicts (`p-4 p-8` → `p-8`) and
 * accepts the usual conditional patterns.
 *
 * @example cn('text-sm', isActive && 'text-brand', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
