'use client';
import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Button,
  Container,
  FloatingCodeCard,
  GradientText,
  GridBackground,
  MentorBubble,
  VerifiedBadge,
  tokenStyles,
  type CodeLine,
} from '@devforge/ui';
import { ArrowRight, Download, Sparkles } from 'lucide-react';

/**
 * Pre-tokenised demo code. Hand-coloured against the design system tokens —
 * realistic enough to feel alive without dragging in a real syntax highlighter.
 *
 * This snippet is intentionally chosen to look like infrastructure code that
 * DevForge would analyse (Terraform-style resource, the architectural domain).
 */
const HERO_CODE: CodeLine[] = [
  {
    tokens: [
      { text: 'resource', className: tokenStyles.keyword },
      { text: ' ' },
      { text: '"aws_db_instance"', className: tokenStyles.string },
      { text: ' ' },
      { text: '"primary"', className: tokenStyles.string },
      { text: ' ' },
      { text: '{', className: tokenStyles.punctuation },
    ],
  },
  {
    tokens: [
      { text: '  identifier        ', className: tokenStyles.variable },
      { text: '= ', className: tokenStyles.operator },
      { text: '"devforge-prod"', className: tokenStyles.string },
    ],
  },
  {
    tokens: [
      { text: '  engine            ', className: tokenStyles.variable },
      { text: '= ', className: tokenStyles.operator },
      { text: '"postgres"', className: tokenStyles.string },
    ],
  },
  {
    tokens: [
      { text: '  instance_class    ', className: tokenStyles.variable },
      { text: '= ', className: tokenStyles.operator },
      { text: '"db.r6g.xlarge"', className: tokenStyles.string },
    ],
  },
  {
    tokens: [
      { text: '  allocated_storage ', className: tokenStyles.variable },
      { text: '= ', className: tokenStyles.operator },
      { text: '500', className: tokenStyles.number },
    ],
  },
  {
    tokens: [
      { text: '  multi_az          ', className: tokenStyles.variable },
      { text: '= ', className: tokenStyles.operator },
      { text: 'true', className: tokenStyles.keyword },
    ],
  },
  {
    tokens: [
      { text: '  storage_encrypted ', className: tokenStyles.variable },
      { text: '= ', className: tokenStyles.operator },
      { text: 'true', className: tokenStyles.keyword },
    ],
  },
  {
    tokens: [
      { text: '  ', className: tokenStyles.variable },
      { text: '// DevForge: cost ≈ $387/mo, matches blueprint v4', className: tokenStyles.comment },
    ],
  },
  {
    tokens: [{ text: '}', className: tokenStyles.punctuation }],
  },
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden pt-12 pb-24 sm:pt-20 sm:pb-32 lg:pt-24"
    >
      <GridBackground glow drift className="absolute inset-0 -z-10" />

      <Container size="xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* LEFT — copy + CTAs */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-elevated/60 px-3 py-1 backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-400" aria-hidden />
              <span className="text-caption font-medium text-foreground-secondary">
                Now in private beta · For VS Code &amp; Kiro
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="text-display-2xl font-black tracking-tight text-foreground"
            >
              Stop shipping code.{' '}
              <GradientText animate variant="brand">
                Start architecting it.
              </GradientText>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="mt-6 max-w-xl text-body-lg text-foreground-secondary"
            >
              DevForge is the IDE extension that holds you to your own design. Real-time drift
              detection, AWS cost guardrails, security gates that block the bad commits, and a
              mentor that asks the questions a senior engineer would.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild size="xl" className="group">
                <a
                  href={process.env.NEXT_PUBLIC_VSCODE_EXTENSION_URL ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="h-4 w-4" />
                  Install for VS Code
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
              <Button asChild size="xl" variant="secondary">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              <VerifiedBadge tone="verified">Bedrock Claude Sonnet 4</VerifiedBadge>
              <VerifiedBadge tone="ai">11 analysis endpoints</VerifiedBadge>
              <span className="text-caption text-foreground-tertiary">
                Free for individuals · SOC 2 in progress
              </span>
            </motion.div>
          </div>

          {/* RIGHT — floating code card + mentor bubble overlay */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Subtle floating animation on the whole composition */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full max-w-[560px]"
            >
              <FloatingCodeCard
                filename="infra/primary-db.tf"
                language="terraform"
                lines={HERO_CODE}
                badges={[
                  { tone: 'verified', label: 'No drift' },
                  { tone: 'brand', label: '$387/mo' },
                  { tone: 'ai', label: 'Reviewed by Claude' },
                ]}
                initial={{ opacity: 0, y: 32, rotateX: 4 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />

              {/* Mentor bubble — floats over the code card, lower-left */}
              <MentorBubble
                speaker="DevForge asks"
                icon="help"
                message={
                  <>
                    Why <span className="font-mono text-ai-300">db.r6g.xlarge</span> for a service
                    with <span className="font-semibold">peak 40 RPS</span>? A{' '}
                    <span className="font-mono text-ai-300">db.t4g.medium</span> would save
                    $310/month.
                  </>
                }
                meta="Verified against blueprint v4 · 2s ago"
                className="absolute -bottom-12 -left-6 hidden w-[340px] sm:block lg:-left-16 lg:w-[380px]"
                initial={{ opacity: 0, x: -16, y: 16 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              />
            </motion.div>
          </div>
        </div>

        {/* Logo strip — credibility */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-24 sm:mt-32"
        >
          <p className="text-center text-micro font-semibold text-foreground-tertiary">
            Built on the stack you already trust
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-body-sm text-foreground-tertiary">
            <span className="font-mono">AWS Bedrock</span>
            <span aria-hidden>·</span>
            <span className="font-mono">Claude Sonnet 4</span>
            <span aria-hidden>·</span>
            <span className="font-mono">Postgres + RLS</span>
            <span aria-hidden>·</span>
            <span className="font-mono">VS Code</span>
            <span aria-hidden>·</span>
            <span className="font-mono">Kiro</span>
            <span aria-hidden>·</span>
            <span className="font-mono">tree-sitter</span>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
