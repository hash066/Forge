'use client';
import { Container, GlassCard, GradientText, Reveal, VerifiedBadge } from '@devforge/ui';
import { FileCode2, Brain, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    icon: FileCode2,
    title: 'Declare your architecture',
    blurb:
      'Define scale, budget, team size, and the architectural constraints that matter. DevForge generates a visual blueprint in seconds — components, connections, cost estimate, scaling forecast.',
    chip: { tone: 'brand' as const, label: 'Blueprint generated < 10s' },
  },
  {
    n: '02',
    icon: Brain,
    title: 'Code with a watchful mentor',
    blurb:
      'DevForge runs in the background — tree-sitter parsing every change, comparing against your blueprint, scoring risk in four dimensions, asking questions in plain English when something feels off.',
    chip: { tone: 'ai' as const, label: 'Claude Sonnet 4 · live' },
  },
  {
    n: '03',
    icon: ShieldCheck,
    title: 'Ship with gates that hold',
    blurb:
      'Critical issues — hardcoded secrets, cost blowouts, drift — become blocking modals. Pass the gates, ship the code. Audit log keeps the receipts. The CI/CD agent (Phase 4) opens the PR fix.',
    chip: { tone: 'verified' as const, label: 'Audit-trail backed' },
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 py-24 sm:py-32">
      <Container size="xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-micro font-semibold text-brand-400">How it works</span>
          <h2 className="mt-3 text-display-lg font-bold tracking-tight">
            Three steps from blueprint to <GradientText variant="brand">production</GradientText>.
          </h2>
          <p className="mt-5 text-body-lg text-foreground-secondary">
            No agents to configure, no rules to write. DevForge installs as a single extension and
            reads your code, your blueprint, and your repo history.
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
