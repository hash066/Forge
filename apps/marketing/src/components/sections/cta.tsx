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
import { ArrowRight, Download } from 'lucide-react';

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
                Ready to make your architecture{' '}
                <GradientText variant="brand">non-negotiable</GradientText>?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-body-lg text-foreground-secondary">
                Install the extension, define your blueprint, and ship knowing the next bug won&rsquo;t
                be architectural.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="xl" className="group">
                  <a
                    href={process.env.NEXT_PUBLIC_VSCODE_EXTENSION_URL ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="h-4 w-4" />
                    Install DevForge
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Button>
                <Button asChild size="xl" variant="secondary">
                  <Link href="/enterprise">Talk to sales</Link>
                </Button>
              </div>

              <p className="mt-6 text-caption text-foreground-tertiary">
                Free for individuals. Enterprise: SSO, audit log, dedicated tenancy, SOC 2 ready.
              </p>
            </GridBackground>
          </GlassCard>
        </Reveal>
      </Container>
    </section>
  );
}
