'use client';
import * as React from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button, Container, cn } from '@devforge/ui';
import { ArrowRight, Download } from 'lucide-react';
import { Logo } from './logo';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#modes', label: 'Modes' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/enterprise', label: 'Enterprise' },
];

export function TopNav() {
  const { scrollY } = useScroll();
  /**
   * Background opacity ramps up as the user scrolls — same trick as the
   * SocraticDev reference: nav is nearly transparent at top, fully blurred
   * glass once you've scrolled past the hero.
   */
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <motion.header
      className="sticky top-0 z-40"
      style={{
        backgroundColor: 'transparent',
      }}
    >
      {/* Background layer — animated opacity */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 backdrop-blur-xl backdrop-saturate-150"
        style={{
          backgroundColor: 'hsl(var(--bg-base) / 0.7)',
          opacity: bgOpacity,
        }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-px bg-border-subtle"
        style={{ opacity: borderOpacity }}
      />

      <Container size="xl">
        <nav className="flex h-16 items-center justify-between gap-6">
          <Link href="/" aria-label="DevForge home" className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="text-heading-sm font-semibold tracking-tight">DevForge</span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'rounded-full px-3 py-2 text-body-sm text-foreground-secondary',
                    'transition-colors duration-fast hover:bg-elevated/60 hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a
                href={process.env.NEXT_PUBLIC_DEMO_URL ?? '/demo'}
                target="_blank"
                rel="noreferrer"
              >
                Book demo
              </a>
            </Button>
            <Button asChild size="sm">
              <a
                href={process.env.NEXT_PUBLIC_VSCODE_EXTENSION_URL ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="group"
              >
                <Download className="h-4 w-4" />
                Install
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Button>
          </div>
        </nav>
      </Container>
    </motion.header>
  );
}
