'use client';
import * as React from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { cn } from '../lib/cn';
import { GlassCard } from './glass-card';
import { VerifiedBadge } from './verified-badge';

export interface CodeLine {
  /** Raw text content. Tokens are emitted as <span> with className. */
  tokens: Array<{ text: string; className?: string }>;
}

interface FloatingCodeCardProps extends MotionProps {
  /** Filename shown in the title chrome (mimics editor tab). */
  filename: string;
  /** Language label (small, for context). */
  language?: string;
  /** Pre-tokenised code lines. We don't ship a syntax highlighter here —
   *  callers pass tokens classed against the design system. */
  lines: CodeLine[];
  /** Footer badges (e.g. "Verified", "O(log n) complexity"). */
  badges?: Array<{ tone?: 'verified' | 'ai' | 'brand' | 'neutral'; label: string }>;
  /** Adds a hover float + slight scale, used on interactive demos. */
  interactive?: boolean;
  className?: string;
}

/**
 * The hero code card. macOS-style window chrome + filename tab + tokenised
 * code + footer badge strip. Static — animation is the parent's responsibility
 * via framer-motion props.
 *
 * The look matches the SocraticDev reference card: dark surface with
 * red/yellow/green dots, code in JetBrains Mono, gradient glow around card,
 * "Verified" pill at the bottom-left.
 */
export const FloatingCodeCard = React.forwardRef<HTMLDivElement, FloatingCodeCardProps>(
  ({ filename, language, lines, badges, interactive, className, ...motionProps }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('group relative', className)}
        {...motionProps}
      >
        {/* Ambient glow behind card */}
        <div
          aria-hidden
          className="absolute -inset-x-12 -inset-y-8 -z-10 rounded-[2rem] bg-glow-radial blur-2xl opacity-80"
        />

        <GlassCard
          padding="none"
          tone="neutral"
          interactive={interactive ?? false}
          className="overflow-hidden shadow-2xl"
        >
          {/* Chrome — traffic lights + filename */}
          <div className="flex items-center gap-3 border-b border-border-subtle bg-overlay/60 px-4 py-3">
            <div className="flex gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
              <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
              <span className="h-3 w-3 rounded-full bg-[#28C840]" />
            </div>
            <span className="font-mono text-code-sm text-foreground-tertiary">
              {filename}
            </span>
            {language && (
              <span className="ml-auto rounded-md bg-elevated px-2 py-0.5 text-micro font-medium text-foreground-tertiary">
                {language}
              </span>
            )}
          </div>

          {/* Code body */}
          <div className="px-5 py-4 font-mono text-code-md leading-relaxed">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span
                  aria-hidden
                  className="mr-4 w-6 select-none text-right text-foreground-disabled"
                >
                  {i + 1}
                </span>
                <span className="flex-1 whitespace-pre">
                  {line.tokens.map((tok, j) => (
                    <span key={j} className={tok.className}>
                      {tok.text}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>

          {/* Footer badges */}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle bg-overlay/30 px-4 py-3">
              {badges.map((b, i) => (
                <VerifiedBadge key={i} tone={b.tone ?? 'verified'}>
                  {b.label}
                </VerifiedBadge>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    );
  },
);
FloatingCodeCard.displayName = 'FloatingCodeCard';

/**
 * Token classes for highlighting. Keep these aligned with the design tokens
 * so colour changes propagate.
 */
export const tokenStyles = {
  keyword: 'text-magenta-500',
  string: 'text-verified-300',
  function: 'text-ai-300',
  number: 'text-brand-300',
  comment: 'text-foreground-disabled italic',
  operator: 'text-foreground-tertiary',
  punctuation: 'text-foreground-secondary',
  variable: 'text-foreground',
  type: 'text-info-500',
} as const;
