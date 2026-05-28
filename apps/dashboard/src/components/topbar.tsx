'use client';

import { Activity, Cpu, Play, Sparkles } from 'lucide-react';
import type { ConnState } from '@/hooks/useClusterFeed';
import { CLUSTER_NAME } from '@/lib/config';

interface TopBarProps {
  connection: ConnState;
  online: boolean;
  providerModel: string | null;
  demoRunning: boolean;
  onRunDemo: () => void;
}

function connectionLabel(connection: ConnState, online: boolean): { text: string; color: string } {
  if (connection === 'open') return { text: 'Live', color: 'text-verified' };
  if (connection === 'connecting') return { text: 'Connecting', color: 'text-warning' };
  if (!online) return { text: 'Control plane offline', color: 'text-critical' };
  return { text: 'Reconnecting', color: 'text-warning' };
}

export function TopBar({ connection, online, providerModel, demoRunning, onRunDemo }: TopBarProps) {
  const conn = connectionLabel(connection, online);
  const isOpenAI = providerModel && providerModel !== 'deterministic';
  const providerText = !providerModel
    ? 'AI: standby'
    : isOpenAI
      ? `OpenAI · ${providerModel}`
      : 'Rule engine (offline)';

  return (
    <header className="sticky top-0 z-30 border-b border-subtle bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-3.5">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-[0_0_24px_-6px_hsl(var(--brand-500)/0.7)]">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold tracking-tight">
              DevForge <span className="text-brand-gradient">OS</span>
            </div>
            <div className="font-mono text-[11px] text-foreground-tertiary">
              autonomous kubernetes sre
            </div>
          </div>
        </div>

        <div className="mx-1 hidden h-8 w-px bg-border/60 sm:block" />

        {/* Cluster + provider */}
        <div className="hidden items-center gap-2 md:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-elevated/60 px-2.5 py-1 font-mono text-[11px] text-foreground-secondary">
            <Cpu className="h-3.5 w-3.5 text-foreground-tertiary" />
            {CLUSTER_NAME}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ai/30 bg-ai/10 px-2.5 py-1 font-mono text-[11px] text-ai">
            <Sparkles className="h-3.5 w-3.5" />
            {providerText}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Connection badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-subtle bg-elevated/60 px-3 py-1.5 text-xs font-medium">
            <span className={`live-dot inline-block h-2 w-2 rounded-full ${conn.color}`}>
              <span className="block h-2 w-2 rounded-full bg-current" />
            </span>
            <span className={conn.color}>{conn.text}</span>
          </span>

          {/* Run demo */}
          <button
            onClick={onRunDemo}
            disabled={demoRunning}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-8px_hsl(var(--brand-500)/0.8)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            {demoRunning ? 'Healing…' : 'Run live demo'}
          </button>
        </div>
      </div>
    </header>
  );
}
