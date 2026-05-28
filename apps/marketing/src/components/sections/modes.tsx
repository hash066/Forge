'use client';
import { Container, GlassCard, GradientText, Reveal, VerifiedBadge } from '@devforge/ui';
import { Check, UserCheck, Rocket } from 'lucide-react';

const MODES = [
  {
    id: 'co-pilot',
    icon: UserCheck,
    tone: 'ai' as const,
    title: 'Co-pilot mode',
    tagline: 'DevForge diagnoses and proposes. You approve.',
    description:
      'The safe default for production. Every incident gets a full GPT root-cause analysis and a concrete fix — but nothing changes until you click approve. Perfect for teams introducing autonomy gradually.',
    features: [
      'Full root-cause + remediation shown before any action',
      'One-click approve, straight from the dashboard or IDE',
      'Nothing mutates the cluster without sign-off',
      'Equivalent kubectl command shown for every fix',
      'Ideal for regulated and high-stakes environments',
      'Every proposal and approval is audit-logged',
    ],
  },
  {
    id: 'autopilot',
    icon: Rocket,
    tone: 'brand' as const,
    title: 'Autopilot mode',
    tagline: 'Low-risk incidents heal themselves.',
    description:
      'Cap the risk you trust DevForge with via the RemediationPolicy CRD, and it handles the rest — restarts, rollbacks, resource bumps — in seconds. Anything above the cap, or in an excluded namespace, escalates to a human.',
    features: [
      'Auto-applies fixes up to your maxRiskAuto threshold',
      'MTTR measured in seconds, not pages',
      'Excluded namespaces are never touched',
      'Higher-risk actions still escalate for approval',
      'Per-tenant, per-namespace policy control',
      'Full audit trail of every autonomous action',
    ],
  },
];

export function Modes() {
  return (
    <section id="modes" className="relative scroll-mt-24 py-24 sm:py-32">
      <Container size="xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-micro font-semibold text-brand-400">Two modes, one operator</span>
          <h2 className="mt-3 text-display-lg font-bold tracking-tight">
            From co-pilot to{' '}
            <GradientText variant="brand">autopilot</GradientText> — you choose how much it does.
          </h2>
          <p className="mt-5 text-body-lg text-foreground-secondary">
            Set the policy per tenant and namespace. Start in co-pilot, earn trust, then let
            DevForge OS take the wheel on the incidents you&rsquo;re comfortable automating.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {MODES.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <Reveal key={mode.id} from={i === 0 ? 'left' : 'right'} delay={i * 0.08}>
                <GlassCard
                  tone={mode.tone === 'brand' ? 'brand' : 'ai'}
                  padding="lg"
                  className="h-full"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${
                        mode.tone === 'brand'
                          ? 'bg-brand-500/10 ring-brand-500/30'
                          : 'bg-ai-500/10 ring-ai-500/30'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          mode.tone === 'brand' ? 'text-brand-300' : 'text-ai-300'
                        }`}
                      />
                    </div>
                    <VerifiedBadge tone={mode.tone}>{mode.id.toUpperCase()}</VerifiedBadge>
                  </div>

                  <h3 className="mt-6 text-heading-xl font-bold text-foreground">{mode.title}</h3>
                  <p className="mt-2 text-body-lg text-foreground">{mode.tagline}</p>
                  <p className="mt-4 text-body-sm text-foreground-secondary">{mode.description}</p>

                  <ul className="mt-6 space-y-3">
                    {mode.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-body-sm">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            mode.tone === 'brand'
                              ? 'bg-brand-500/15 text-brand-300'
                              : 'bg-ai-500/15 text-ai-300'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-foreground-secondary">{f}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
