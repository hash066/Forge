import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devforge.io';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DevForge — Architecture-first AI for engineers who ship',
    template: '%s · DevForge',
  },
  description:
    'DevForge is the IDE extension that enforces architectural discipline. Real-time drift detection, AWS cost tracking, security gates, and an AI mentor that asks the right questions — built for engineers and the teams behind them.',
  applicationName: 'DevForge',
  authors: [{ name: 'DevForge' }],
  keywords: [
    'IDE extension',
    'software architecture',
    'AI code review',
    'AWS cost estimation',
    'architecture drift detection',
    'developer tools',
    'VS Code extension',
    'Kiro extension',
    'enterprise developer platform',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'DevForge',
    title: 'DevForge — Architecture-first AI for engineers who ship',
    description:
      'Real-time drift detection, AWS cost tracking, security gates, and a mentor that asks the right questions. Built for engineers — and the teams behind them.',
    images: [
      { url: '/og.png', width: 1200, height: 630, alt: 'DevForge — architecture-first AI' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevForge — Architecture-first AI for engineers who ship',
    description:
      'Real-time drift detection, AWS cost tracking, security gates, and a mentor that asks the right questions.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: '/favicon.svg', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0B' },
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
  ],
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
