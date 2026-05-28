import type { Metadata, Viewport } from 'next';
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

// Display serif — hero copy + big stat numbers
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

// Body / UI grotesque
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Mono — k8s identifiers, code
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DevForge OS — Self-Healing Kubernetes',
  description:
    'The autonomous AI SRE for Kubernetes. DevForge OS watches your cluster, diagnoses incidents with GPT, and remediates them automatically — with policy gates and a full audit trail.',
  applicationName: 'DevForge OS',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0B0A09',
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
      <body className="min-h-screen bg-background font-sans text-foreground antialiased bg-app-grid">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
