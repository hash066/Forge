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
import { ArrowRight, Sparkles, Terminal } from 'lucide-react';

/**
 * Hero code card — a live DevForge OS incident: a Kubernetes pod fault, the GPT
 * root-cause analysis, and the auto-applied remediation. This is the product in
 * one glance.
 */
const HERO_CODE: CodeLine[] = [
  {
    tokens: [{ text: '# devforge-operator: incident detected', className: tokenStyles.comment }],
  },
  {
    tokens: [
      { text: 'reason', className: tokenStyles.variable },
      { text: ':     ', className: tokenStyles.operator },
      { text: 'OOMKilled', className: tokenStyles.keyword },
      { text: '  # exit 137', className: tokenStyles.comment },
    ],
  },
  {
    tokens: [
      { text: 'target', className: tokenStyles.variable },
      { text: ':     ', className: tokenStyles.operator },
      { text: 'shop/cart-api', className: tokenStyles.string },
    ],
  },
  { tokens: [{ text: '' }] },
  {
    tokens: [{ text: '# ── AI root cause · gpt-5.5 ──', className: tokenStyles.comment }],
  },
  {
    tokens: [
      { text: 'cause', className: tokenStyles.variable },
      { text: ':      ', className: tokenStyles.operator },
      { text: 'memory limit 256Mi < working set', className: tokenStyles.string },
    ],
  },
  {
    tokens: [
      { text: 'fix', className: tokenStyles.variable },
      { text: ':        ', className: tokenStyles.operator },
      { text: 'set_resources', className: tokenStyles.keyword },
      { text: ' → ', className: tokenStyles.operator },
      { text: '384Mi', className: tokenStyles.number },
    ],
  },
  {
    tokens: [
      { text: 'risk', className: tokenStyles.variable },
      { text: ':       ', className: tokenStyles.operator },
      { text: 'low', className: tokenStyles.string },
      { text: ' · auto-applied', className: tokenStyles.comment },
    ],
  },
  {
    tokens: [
      { text: 'status', className: tokenStyles.variable },
      { text: ':     ', className: tokenStyles.operator },
      { text: '✓ healed in 2.4s', className: tokenStyles.string },
    ],
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
                The autonomous AI SRE for Kubernetes · powered by OpenAI
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="text-display-2xl font-black tracking-tight text-foreground"
            >
              Kubernetes that{' '}
              <GradientText animate variant="brand">
                heals itself.
              </GradientText>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="mt-6 max-w-xl text-body-lg text-foreground-secondary"
            >
              DevForge OS is an in-cluster operator that watches your workloads, diagnoses every
              incident with GPT — crash loops, OOM kills, bad rollouts, cost waste, security holes —
              and remediates them automatically. With policy gates and a full audit trail.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild size="xl" className="group">
                <Link href="#how-it-works">
                  <Terminal className="h-4 w-4" />
                  Install the operator
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="secondary">
                <Link href="#how-it-works">Watch it heal</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              <VerifiedBadge tone="ai">OpenAI · GPT-5.5</VerifiedBadge>
              <VerifiedBadge tone="verified">Autonomous remediation</VerifiedBadge>
              <span className="text-caption text-foreground-tertiary">
                Helm install · RBAC least-priv · SOC 2 in progress
              </span>
            </motion.div>
          </div>

          {/* RIGHT — floating incident card + AI diagnosis bubble */}
          <div className="relative flex justify-center lg:justify-end">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full max-w-[560px]"
            >
              <FloatingCodeCard
                filename="incident · shop/cart-api"
                language="yaml"
                lines={HERO_CODE}
                badges={[
                  { tone: 'brand', label: 'OOMKilled' },
                  { tone: 'ai', label: 'gpt-5.5' },
                  { tone: 'verified', label: 'healed' },
                ]}
                initial={{ opacity: 0, y: 32, rotateX: 4 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />

              <MentorBubble
                speaker="DevForge OS"
                icon="help"
                message={
                  <>
                    <span className="font-mono text-ai-300">cart-api</span> was OOM-killed — the
                    memory limit is below its working set. Raising it to{' '}
                    <span className="font-semibold">384Mi</span> and rolling out now.
                  </>
                }
                meta="Auto-remediated · audit logged · 2.4s ago"
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
            Runs on the stack you already trust
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-body-sm text-foreground-tertiary">
            <span className="font-mono">OpenAI</span>
            <span aria-hidden>·</span>
            <span className="font-mono">Kubernetes</span>
            <span aria-hidden>·</span>
            <span className="font-mono">kopf operator</span>
            <span aria-hidden>·</span>
            <span className="font-mono">Helm</span>
            <span aria-hidden>·</span>
            <span className="font-mono">FastAPI</span>
            <span aria-hidden>·</span>
            <span className="font-mono">App Runner</span>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
