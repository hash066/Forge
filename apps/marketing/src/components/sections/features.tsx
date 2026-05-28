'use client';
import * as React from 'react';
import { Container, GlassCard, Reveal, VerifiedBadge, GradientText } from '@devforge/ui';
import {
  Activity,
  BrainCircuit,
  ShieldCheck,
  Coins,
  ShieldAlert,
  LayoutDashboard,
  ScrollText,
  Boxes,
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
    icon: Activity,
    title: 'Autonomous remediation',
    blurb:
      "DevForge OS doesn't just alert — it acts. Crash loops, OOM kills, failed rollouts and stuck pods are detected, diagnosed, and fixed by the in-cluster operator in seconds, often before the pager even fires.",
    badge: { tone: 'verified', label: 'Self-healing' },
    span: 'col-span-2',
  },
  {
    icon: BrainCircuit,
    title: 'GPT root-cause analysis',
    blurb:
      'Every incident goes to OpenAI with full context — events, logs, container status, the spec. You get the actual root cause and a concrete fix with a confidence score. Not "pod is down". Why it is down.',
    badge: { tone: 'ai', label: 'gpt-5.5' },
  },
  {
    icon: ShieldCheck,
    title: 'Policy gates & approvals',
    blurb:
      'A RemediationPolicy CRD decides what auto-applies and what waits for a human. Low-risk fixes heal themselves; anything risky lands in an approval queue. You set the blast radius.',
    badge: { tone: 'brand', label: 'RemediationPolicy CRD' },
  },
  {
    icon: Coins,
    title: 'Cost & right-sizing',
    blurb:
      'Over-provisioned requests and idle headroom are surfaced with the dollar figure attached. DevForge proposes right-sized resources so you reclaim spend without risking stability.',
    badge: { tone: 'brand', label: 'FinOps built-in' },
    span: 'col-span-2',
  },
  {
    icon: ShieldAlert,
    title: 'Security guardian',
    blurb:
      'Privileged containers, hostPath mounts, missing limits, root users — caught the moment they hit the cluster, each with a least-invasive patch to lock it down.',
    badge: { tone: 'critical', label: 'Misconfig scan' },
  },
  {
    icon: LayoutDashboard,
    title: 'Live command center',
    blurb:
      'A real-time dashboard streams every incident, AI diagnosis, and remediation over WebSocket. Watch cluster health climb back to 100% as DevForge works.',
  },
  {
    icon: ScrollText,
    title: 'Multi-tenant & audited',
    blurb:
      'Every row is tenant-scoped and every action is written to an immutable audit log. Built for platform teams running many clusters under one control plane.',
    badge: { tone: 'verified', label: 'Audit trail' },
  },
  {
    icon: Boxes,
    title: 'Runs anywhere',
    blurb:
      'One Helm install onto kind, EKS, GKE, or AKS. A Python kopf operator with least-privilege RBAC — no sidecars, no mesh, no lock-in.',
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-24 sm:py-32">
      <Container size="xl">
        <Reveal from="up" className="mx-auto max-w-3xl text-center">
          <span className="text-micro font-semibold text-brand-400">Features</span>
          <h2 className="mt-3 text-display-lg font-bold tracking-tight">
            Eight ways DevForge OS keeps your cluster{' '}
            <GradientText variant="brand">healthy</GradientText>.
          </h2>
          <p className="mt-5 text-body-lg text-foreground-secondary">
            Every capability runs through one OpenAI-powered control plane — multi-tenant,
            audited, and policy-gated from line one. None of it is hand-waved.
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
