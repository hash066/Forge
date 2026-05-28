'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Play, ShieldCheck } from 'lucide-react';
import type { Incident, ToolStep } from '@devforge/core';
import { IncidentCard } from './incident-card';

interface IncidentFeedProps {
  incidents: Incident[];
  onApprove: (incident: Incident) => void;
  onRunDemo: () => void;
  demoRunning: boolean;
  reasoning?: Record<string, string>;
  tools?: Record<string, ToolStep[]>;
}

export function IncidentFeed({
  incidents,
  onApprove,
  onRunDemo,
  demoRunning,
  reasoning,
  tools,
}: IncidentFeedProps) {
  const open = incidents.filter((i) => i.status !== 'resolved');

  return (
    <section className="panel flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          Incident feed
          <span className="rounded-full border border-subtle bg-elevated/60 px-2 py-0.5 font-mono text-[11px] text-foreground-tertiary">
            {open.length} active · {incidents.length} total
          </span>
        </h2>
        {incidents.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-verified">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full text-verified">
              <span className="block h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            live
          </span>
        )}
      </div>

      {incidents.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-verified/10">
            <ShieldCheck className="h-7 w-7 text-verified" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Cluster is healthy</p>
            <p className="mt-1 max-w-sm text-sm text-foreground-tertiary">
              No active incidents. Trigger the demo to watch DevForge OS detect, diagnose with AI,
              and auto-heal a wave of failures in real time.
            </p>
          </div>
          <button
            onClick={onRunDemo}
            disabled={demoRunning}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-background transition hover:opacity-95 disabled:opacity-50"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            {demoRunning ? 'Running…' : 'Run live demo'}
          </button>
        </div>
      ) : (
        <motion.div layout className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onApprove={onApprove}
                streamedReasoning={reasoning?.[incident.id]}
                streamedTools={tools?.[incident.id]}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
