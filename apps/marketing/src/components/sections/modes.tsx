'use client';
import { Container, GlassCard, GradientText, Reveal, VerifiedBadge } from '@devforge/ui';
import { Check, GraduationCap, Building2 } from 'lucide-react';

const MODES = [
  {
    id: 'student',
    icon: GraduationCap,
    tone: 'ai' as const,
    title: 'Student mode',
    tagline: 'Learn architecture while you build it.',
    description:
      'For interns, juniors, and bootcamp grads. Every AI-generated block triggers a comprehension check. Six skill dimensions tracked over time. LeetCode patterns surface in your own code so practice maps to your domain.',
    features: [
      'Comprehension quiz after AI code generation',
      'Skill radar across six dimensions',
      'LeetCode pattern detection in your real code',
      'Algorithmic improvement suggestions (O-class warnings)',
      'Argue-with-me mode forces you to justify decisions',
      'Anti-vibe critic flags non-idiomatic usage',
    ],
  },
  {
    id: 'developer',
    icon: Building2,
    tone: 'brand' as const,
    title: 'Developer mode',
    tagline: 'Architecture discipline for the people who deploy.',
    description:
      'For seniors, staff, and the teams behind production systems. Drift detection, cost guardrails, scale collapse prediction, security gates, and an audit trail your compliance team will actually approve of.',
    features: [
      'Real-time architecture drift detection',
      'Live AWS cost estimation with budget alerts',
      'Scale collapse predictor — find the bottleneck early',
      'Security gates with auto-fix suggestions',
      'CI/CD agent integration (Phase 4)',
      'Multi-tenant orgs, RBAC, audit log',
    ],
  },
];

export function Modes() {
  return (
    <section id="modes" className="relative scroll-mt-24 py-24 sm:py-32">
      <Container size="xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-micro font-semibold text-brand-400">Two modes, one product</span>
          <h2 className="mt-3 text-display-lg font-bold tracking-tight">
            Built for the engineer you are{' '}
            <GradientText variant="brand">today</GradientText> — and the one you&rsquo;re becoming.
          </h2>
          <p className="mt-5 text-body-lg text-foreground-secondary">
            Pick a mode on install. Toggle anytime. The backend is the same; the affordances meet
            you where you are.
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
