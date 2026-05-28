'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full',
    'text-body-sm font-medium transition-all duration-base ease-out-expo',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        /* Primary CTA — champagne gradient with dark ink text (the luxe pairing). */
        primary: [
          'relative overflow-hidden text-background font-semibold',
          'bg-[linear-gradient(100deg,hsl(40_52%_72%)_0%,hsl(var(--brand-500))_50%,hsl(var(--magenta-500))_100%)]',
          'shadow-[0_0_0_1px_hsl(var(--brand-500)/0.35),0_8px_32px_-10px_hsl(var(--brand-500)/0.45)] hover:shadow-[0_0_0_1px_hsl(var(--brand-400)/0.6),0_0_44px_-8px_hsl(var(--brand-500)/0.6)]',
          'hover:-translate-y-px active:translate-y-0',
        ],
        /* Secondary CTA — outlined on dark glass. "Book Demo" in the hero. */
        secondary: [
          'bg-elevated/60 backdrop-blur-md text-foreground',
          'border border-border-default hover:border-border-strong',
          'hover:bg-elevated',
        ],
        /* Ghost — minimal, used in nav. */
        ghost: 'text-foreground-secondary hover:text-foreground hover:bg-elevated/60',
        /* Danger / destructive */
        danger: 'bg-critical-500 text-white hover:bg-critical-700',
        /* Link-style */
        link: 'text-brand-400 hover:text-brand-300 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-caption',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-body-md',
        /* Hero CTA size */
        xl: 'h-14 px-8 text-body-md font-semibold',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a Slot — used to compose with `next/link` etc. */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
