'use client';
import * as React from 'react';
import { Container, GlassCard, Reveal, VerifiedBadge, GradientText } from '@devforge/ui';
import {
  GitCompareArrows,
  ShieldAlert,
  Coins,
  MessageSquareCode,
  LayoutDashboard,
  Network,
  TrendingDown,
  BrainCircuit,
} from 'lucide-react';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  /** Optional inline metric or chip displayed in the corner */
  badge?: { tone: 'verified' | 'brand' | 'ai' | 'warning' | 'critical'; label: string };
  /** Optional grid span — used to compose bento layout. */
  span?: 'col-span-1' | 'col-span-2' | 'row-span-2';
}

const FEATURES: Feature[] = [
  {
    icon: GitCompareArrows,
    title: 'Real-time drift detection',
    blurb:
      'Every keystroke is compared to your architectural blueprint. The moment your code diverges — wrong database, missing service, layer violation — DevForge says so. Not after deployment. Not after a postmortem. Now.',
    badge: { tone: 'verified', label: 'Live AST diff' },
    span: 'col-span-2',
  },
  {
    icon: ShieldAlert,
    title: 'Security gates that block',
    blurb:
      'Hardcoded secrets, SQL injection, missing encryption, exposed endpoints — flagged the instant they hit your buffer. Critical findings become blocking modals: you fix it or you explain it.',
    badge: { tone: 'critical', label: 'OWASP coverage' },
  },
  {
    icon: Coins,
    title: 'AWS cost whisperer',
    blurb:
      'Status bar tells you the monthly bill before the bill arrives. AWS Price List API on every save. Budget alerts before you ship the resource that doubles your AWS spend.',
    badge: { tone: 'brand', label: 'Updates < 5s' },
  },
  {
    icon: MessageSquareCode,
    title: 'A mentor, not autocomplete',
    blurb:
      'Bedrock Claude Sonnet 4 — running in a Socratic mode. It asks the questions a principal engineer would ask before they touched their keyboard.',
    badge: { tone: 'ai', label: 'Argue mode' },
    span: 'col-span-2',
  },
  {
    icon: LayoutDashboard,
    title: 'Risk dashboard',
    blurb:
      'Scalability, over-engineering, security, consistency. Four numbers that say where your architecture is fragile. Track them over time. Watch them improve.',
  },
  {
    icon: Network,
    title: 'Blueprint generator',
    blurb:
      'Define scale, budget, team size. Get an architecture diagram, AWS service picks, cost estimate, and a scaling forecast — in under 10 seconds.',
  },
  {
    icon: TrendingDown,
    title: 'Scale collapse predictor',
    blurb:
      'Tells you exactly which component breaks at 50k users, and what to swap in before then. No more "we\'ll figure it out at scale."',
    badge: { tone: 'warning', label: 'Failure timeline' },
  },
  {
    icon: BrainCircuit,
    title: 'Comprehension validator',
    blurb:
      'Student mode quiz after every AI generation. If you can\'t explain it, you don\'t ship it. Tracks your skill across six dimensions over time.',
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-24 sm:py-32">
      <Container size="xl">
        <Reveal from="up" className="mx-auto max-w-3xl text-center">
          <span className="text-micro font-semibold text-brand-400">Features</span>
          <h2 className="mt-3 text-display-lg font-bold tracking-tight">
            Eight ways DevForge keeps your architecture{' '}
            <GradientText variant="brand">honest</GradientText>.
          </h2>
          <p className="mt-5 text-body-lg text-foreground-secondary">
            Every feature is wired to the same control plane — AWS Bedrock for reasoning,
            Postgres for state, multi-tenant from line one. None of it is hand-waved.
          </p>
        </Reveal>

        <div className="mt-16 grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <Reveal
                key={feat.title}
                from="up"
                delay={i * 0.05}
                className={feat.span ?? 'col-span-1'}
              >
                <GlassCard
                  tone="neutral"
                  padding="lg"
                  className="group relative h-full overflow-hidden"
                >
                  {/* Top-right badge */}
                  {feat.badge && (
                    <div className="absolute right-4 top-4">
                      <VerifiedBadge tone={feat.badge.tone}>{feat.badge.label}</VerifiedBadge>
                    </div>
                  )}

                  {/* Icon chip */}
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 ring-1 ring-brand-500/20 transition-colors group-hover:bg-brand-500/15">
                    <Icon className="h-5 w-5 text-brand-300" aria-hidden />
                  </div>

                  <h3 className="text-heading-md font-semibold text-foreground">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-body-sm text-foreground-secondary">{feat.blurb}</p>

                  {/* Hover gradient sweep */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--brand-500)/0.5)_50%,transparent_100%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
