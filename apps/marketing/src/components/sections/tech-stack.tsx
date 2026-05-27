'use client';
import { Container, GlassCard, GradientText, Reveal } from '@devforge/ui';

const STACK = [
  {
    layer: 'AI Reasoning',
    items: ['AWS Bedrock', 'Claude Sonnet 4', 'Versioned prompts'],
    tone: 'ai',
  },
  {
    layer: 'Control Plane',
    items: ['FastAPI', 'Pydantic v2', 'Async by default'],
    tone: 'brand',
  },
  {
    layer: 'Data',
    items: ['Postgres + RLS', 'Redis (ElastiCache)', 'S3 blueprints'],
    tone: 'verified',
  },
  {
    layer: 'Code Analysis',
    items: ['tree-sitter', 'NetworkX graphs', 'Multi-language'],
    tone: 'ai',
  },
  {
    layer: 'Surfaces',
    items: ['VS Code extension', 'Kiro extension', 'Rust CLI'],
    tone: 'brand',
  },
  {
    layer: 'Infrastructure',
    items: ['AWS CDK', 'Fargate', 'API Gateway WS'],
    tone: 'verified',
  },
] as const;

export function TechStack() {
  return (
    <section id="tech-stack" className="relative scroll-mt-24 py-24 sm:py-32">
      <Container size="xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-micro font-semibold text-brand-400">The stack</span>
          <h2 className="mt-3 text-display-lg font-bold tracking-tight">
            No magic.{' '}
            <GradientText variant="brand">Just engineering you&rsquo;d recognise.</GradientText>
          </h2>
          <p className="mt-5 text-body-lg text-foreground-secondary">
            We chose components your team has used in production. Every layer is replaceable; the
            value is in how they compose.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((layer, i) => (
            <Reveal key={layer.layer} from="up" delay={i * 0.05}>
              <GlassCard tone="neutral" padding="lg" className="h-full">
                <div className="text-micro font-semibold text-foreground-tertiary">
                  {layer.layer}
                </div>
                <ul className="mt-4 space-y-2 font-mono text-body-sm text-foreground">
                  {layer.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full ${
                          layer.tone === 'brand'
                            ? 'bg-brand-500'
                            : layer.tone === 'ai'
                              ? 'bg-ai-500'
                              : 'bg-verified-500'
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
