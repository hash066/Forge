'use client';
import { Container, GlassCard, GradientText, Reveal, VerifiedBadge } from '@devforge/ui';
import { Boxes, Brain, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    icon: Boxes,
    title: 'Install the operator',
    blurb:
      'One Helm command installs the operator and control plane with least-privilege RBAC. It immediately starts watching every namespace you allow — no sidecars, no mesh, no rules to write.',
    chip: { tone: 'brand' as const, label: 'helm install · < 1 min' },
  },
  {
    n: '02',
    icon: Brain,
    title: 'It watches & diagnoses',
    blurb:
      'Deterministic detectors catch faults the instant they happen, then hand full context — events, logs, spec, metrics — to OpenAI for a root-cause analysis and a concrete fix, with a confidence score.',
    chip: { tone: 'ai' as const, label: 'gpt-5.5 · live' },
  },
  {
    n: '03',
    icon: ShieldCheck,
    title: 'It heals — you stay in control',
    blurb:
      'Low-risk fixes auto-apply; risky ones wait for one-click approval per your RemediationPolicy. Every action streams to the dashboard and lands in the immutable audit log.',
    chip: { tone: 'verified' as const, label: 'policy-gated · audited' },
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 py-24 sm:py-32">
      <Container size="xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-micro font-semibold text-brand-400">How it works</span>
          <h2 className="mt-3 text-display-lg font-bold tracking-tight">
            Three steps from pager storm to <GradientText variant="brand">calm</GradientText>.
          </h2>
          <p className="mt-5 text-body-lg text-foreground-secondary">
            No runbooks to maintain, no rules to write. DevForge OS installs once and reasons about
            your cluster the way a senior SRE would — then does the work.
          </p>
        </Reveal>

        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          {/* Connecting line — desktop only */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden h-px bg-[linear-gradient(90deg,transparent,hsl(var(--brand-500)/0.4),hsl(var(--magenta-500)/0.4),transparent)] md:block"
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.n} from="up" delay={i * 0.1}>
                <GlassCard tone="neutral" padding="lg" className="relative h-full">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 ring-1 ring-brand-500/30">
                      <Icon className="h-5 w-5 text-brand-300" />
                    </div>
                    <span className="font-mono text-display-lg font-black text-foreground-disabled">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="mt-5 text-heading-md font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-body-sm text-foreground-secondary">{step.blurb}</p>
                  <div className="mt-5">
                    <VerifiedBadge tone={step.chip.tone}>{step.chip.label}</VerifiedBadge>
                  </div>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
