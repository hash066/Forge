'use client';
import * as React from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { HelpCircle, Sparkles } from 'lucide-react';
import { cn } from '../lib/cn';
import { GlassCard } from './glass-card';

interface MentorBubbleProps extends MotionProps {
  /** The header above the question, e.g. "DevForge asks:" or "Mentor". */
  speaker?: string;
  /** Speaker icon variant. */
  icon?: 'help' | 'sparkles';
  /** The body text — usually a Socratic question. */
  message: React.ReactNode;
  /** Optional inline meta (e.g. timestamp or "Verified by Claude Sonnet 4"). */
  meta?: React.ReactNode;
  className?: string;
}

/**
 * Mentor chat bubble — the floating "SocraticDev asks: ..." card in the hero.
 * Visually distinct from regular cards by virtue of the icon chip on the left
 * and the AI-tinted border.
 */
export const MentorBubble = React.forwardRef<HTMLDivElement, MentorBubbleProps>(
  ({ speaker = 'DevForge asks', icon = 'help', message, meta, className, ...motionProps }, ref) => {
    const IconCmp = icon === 'help' ? HelpCircle : Sparkles;

    return (
      <motion.div ref={ref} className={cn('relative', className)} {...motionProps}>
        <GlassCard tone="ai" padding="md" className="max-w-md">
          <div className="flex gap-3">
            {/* Icon chip */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ai-500/15 ring-1 ring-ai-500/30">
              <IconCmp className="h-4 w-4 text-ai-300" aria-hidden />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-caption font-semibold text-ai-300">
                {speaker}:
              </div>
              <div className="text-body-md text-foreground">{message}</div>
              {meta && (
                <div className="mt-2 text-caption text-foreground-tertiary">{meta}</div>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  },
);
MentorBubble.displayName = 'MentorBubble';
