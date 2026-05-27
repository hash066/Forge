'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

export interface RailItem {
  /** Anchor target — must match an `id` on the page. */
  id: string;
  /** Tooltip label, shown on hover. */
  label: string;
  /** Icon component (lucide-react preferred). */
  icon: React.ComponentType<{ className?: string }>;
}

interface RightRailNavProps {
  items: RailItem[];
  className?: string;
}

/**
 * Vertical anchor nav on the right edge of long landing pages — the icon stack
 * in the SocraticDev reference. Uses IntersectionObserver to highlight the
 * active section as the user scrolls.
 */
export function RightRailNav({ items, className }: RightRailNavProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const observers: IntersectionObserver[] = [];

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(item.id);
        },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  return (
    <nav
      aria-label="Page sections"
      className={cn(
        'pointer-events-none fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 lg:block',
        className,
      )}
    >
      <ul className="pointer-events-auto flex flex-col gap-1 rounded-full border border-border-subtle bg-elevated/70 p-1.5 backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-label={item.label}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'group relative flex h-10 w-10 items-center justify-center rounded-full',
                  'transition-all duration-base ease-out-expo',
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/40'
                    : 'text-foreground-tertiary hover:bg-elevated hover:text-foreground',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="rail-indicator-glow"
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-brand-500/10"
                  />
                )}
                <Icon className="relative h-4 w-4" />

                {/* Tooltip */}
                <span
                  role="tooltip"
                  className={cn(
                    'pointer-events-none absolute right-full mr-3 origin-right whitespace-nowrap rounded-md',
                    'border border-border-subtle bg-overlay px-2.5 py-1.5 text-caption text-foreground',
                    'opacity-0 scale-95 transition-all duration-fast group-hover:opacity-100 group-hover:scale-100',
                  )}
                >
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
