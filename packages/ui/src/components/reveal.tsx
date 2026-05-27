'use client';
import * as React from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { cn } from '../lib/cn';

interface RevealProps {
  children: React.ReactNode;
  /** Direction of reveal. `up` is default, suitable for vertical scroll. */
  from?: 'up' | 'down' | 'left' | 'right' | 'fade';
  /** Delay in seconds (after element enters viewport). */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Trigger only once vs. every time element enters viewport. */
  once?: boolean;
  /** Viewport margin — start animation slightly before element is in view. */
  margin?: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Scroll-triggered reveal wrapper. Drop-in around any block; it fades + slides
 * in when in view. Uses framer-motion's `useInView` with sane defaults.
 */
export function Reveal({
  children,
  from = 'up',
  delay = 0,
  duration = 0.6,
  once = true,
  margin = '0px 0px -10% 0px',
  className,
  as = 'div',
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: margin as `${number}${'px' | '%'}` });

  const offsets: Record<RevealProps['from'] & string, { x: number; y: number }> = {
    up: { x: 0, y: 24 },
    down: { x: 0, y: -24 },
    left: { x: 24, y: 0 },
    right: { x: -24, y: 0 },
    fade: { x: 0, y: 0 },
  };
  const { x, y } = offsets[from];

  const variants: Variants = {
    hidden: { opacity: 0, x, y },
    visible: { opacity: 1, x: 0, y: 0 },
  };

  const MotionTag = motion[as as keyof typeof motion] as React.ElementType;

  return (
    <MotionTag
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}
