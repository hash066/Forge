import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevForge OS — Self-Healing Kubernetes',
  description:
    'The autonomous AI SRE for Kubernetes. DevForge OS watches your cluster, diagnoses incidents with GPT, and remediates them automatically — with policy gates and a full audit trail.',
  applicationName: 'DevForge OS',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0B',
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
      <body className="min-h-screen bg-background font-sans text-foreground antialiased bg-app-grid">
        {children}
      </body>
    </html>
  );
}
