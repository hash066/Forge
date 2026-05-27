import Link from 'next/link';
import { Container } from '@devforge/ui';
import { Logo } from './logo';
import { Github, Twitter, Linkedin } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Modes', href: '#modes' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API reference', href: '/docs/api' },
    { label: 'CLI guide', href: '/docs/cli' },
    { label: 'Blog', href: '/blog' },
    { label: 'Case studies', href: '/case-studies' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Enterprise', href: '/enterprise' },
  ],
  Legal: [
    { label: 'Terms', href: '/legal/terms' },
    { label: 'Privacy', href: '/legal/privacy' },
    { label: 'Security', href: '/security' },
    { label: 'DPA', href: '/legal/dpa' },
  ],
} as const;

const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/devforge', icon: Github },
  { label: 'Twitter', href: 'https://twitter.com/devforge', icon: Twitter },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/devforge', icon: Linkedin },
];

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-border-subtle">
      <Container size="xl" className="py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand block */}
          <div className="col-span-2">
            <Link href="/" aria-label="DevForge home" className="inline-flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="text-heading-sm font-semibold tracking-tight">DevForge</span>
            </Link>
            <p className="mt-4 max-w-xs text-body-sm text-foreground-secondary">
              Architecture-first AI for engineers who ship. Drift detection, cost guardrails,
              and a mentor that asks the right questions.
            </p>
            <div className="mt-6 flex gap-1">
              {SOCIAL_LINKS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-tertiary transition-colors hover:bg-elevated hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-micro font-semibold text-foreground-tertiary">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-foreground-secondary transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border-subtle pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-caption text-foreground-tertiary">
            © {new Date().getFullYear()} DevForge. All rights reserved.
          </p>
          <p className="text-caption text-foreground-tertiary">
            Made for engineers who measure twice and cut once.
          </p>
        </div>
      </Container>
    </footer>
  );
}
