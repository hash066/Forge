'use client';
import Link from 'next/link';
import {
  Button,
  Container,
  GlassCard,
  GradientText,
  GridBackground,
  Reveal,
} from '@devforge/ui';
import { ArrowRight, Github, Terminal } from 'lucide-react';

export function CTASection() {
  return (
    <section id="cta" className="relative scroll-mt-24 py-24 sm:py-32">
      <Container size="lg">
        <Reveal>
          <GlassCard
            tone="brand"
            padding="none"
            className="relative overflow-hidden text-center"
          >
            <GridBackground mask="radial" glow className="px-6 py-20 sm:px-12">
              <h2 className="mx-auto max-w-2xl text-display-xl font-bold tracking-tight text-foreground">
                Ready to make 3am pages{' '}
                <GradientText variant="brand">a thing of the past</GradientText>?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-body-lg text-foreground-secondary">
                Install the operator, set your policy, and let DevForge OS detect, diagnose, and
                heal — while you sleep.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="xl" className="group">
                  <Link href="#how-it-works">
                    <Terminal className="h-4 w-4" />
                    Install the operator
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="secondary">
                  <a href="https://github.com/hash066/Forge" target="_blank" rel="noreferrer">
                    <Github className="h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
              </div>

              <p className="mt-6 text-caption text-foreground-tertiary">
                Open install via Helm. Enterprise: SSO, multi-cluster, audit log, SOC 2 ready.
              </p>
            </GridBackground>
          </GlassCard>
        </Reveal>
      </Container>
    </section>
  );
}
