import type { Metadata, Viewport } from 'next';
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://devforge.io';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'DevForge OS — Self-healing Kubernetes, powered by OpenAI',
    template: '%s · DevForge OS',
  },
  description:
    'DevForge OS is the autonomous AI SRE for Kubernetes. It watches your cluster, diagnoses incidents with GPT, and remediates them automatically — under policy gates, with least-privilege RBAC and a full audit trail.',
  applicationName: 'DevForge OS',
  authors: [{ name: 'DevForge' }],
  keywords: [
    'Kubernetes',
    'AI SRE',
    'self-healing infrastructure',
    'incident remediation',
    'Kubernetes operator',
    'OpenAI',
    'GPT',
    'site reliability engineering',
    'cloud-native platform',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'DevForge OS',
    title: 'DevForge OS — Self-healing Kubernetes, powered by OpenAI',
    description:
      'The autonomous AI SRE for Kubernetes. Detect, diagnose with GPT, and auto-remediate incidents — with policy gates and a full audit trail.',
    images: [
      { url: '/og.png', width: 1200, height: 630, alt: 'DevForge OS — self-healing Kubernetes' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevForge OS — Self-healing Kubernetes, powered by OpenAI',
    description:
      'The autonomous AI SRE for Kubernetes. Detect, diagnose with GPT, and auto-remediate incidents.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: '/favicon.svg', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B0A09' },
    { media: '(prefers-color-scheme: light)', color: '#F7F3EC' },
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
      className={`${fraunces.variable} ${hanken.variable} ${jetbrains.variable}`}
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
