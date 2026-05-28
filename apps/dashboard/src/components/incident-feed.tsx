'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Search, ShieldCheck } from 'lucide-react';
import type { Incident, ToolStep } from '@devforge/core';
import { IncidentCard } from './incident-card';

interface IncidentFeedProps {
  incidents: Incident[];
  onApprove: (incident: Incident) => void;
  onRunDemo: () => void;
  demoRunning: boolean;
  reasoning?: Record<string, string>;
  tools?: Record<string, ToolStep[]>;
  onOpen?: (incident: Incident) => void;
  filterable?: boolean;
}

export function IncidentFeed({
  incidents,
  onApprove,
  onRunDemo,
  demoRunning,
  reasoning,
  tools,
  onOpen,
  filterable,
}: IncidentFeedProps) {
  const open = incidents.filter((i) => i.status !== 'resolved');
  const [query, setQuery] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [sevF, setSevF] = useState('all');
  const visible = useMemo(() => {
    if (!filterable) return incidents;
    const q = query.trim().toLowerCase();
    return incidents.filter(
      (i) =>
        (statusF === 'all' || i.status === statusF) &&
        (sevF === 'all' || i.severity === sevF) &&
        (q === '' || `${i.namespace} ${i.name} ${i.reason}`.toLowerCase().includes(q)),
    );
  }, [incidents, filterable, query, statusF, sevF]);

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

      {filterable && incidents.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-subtle bg-background/60 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-foreground-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search incidents…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-tertiary"
            />
          </div>
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            className="cursor-pointer rounded-lg border border-subtle bg-background/60 px-2 py-1.5 text-xs text-foreground-secondary outline-none"
          >
            <option value="all">All statuses</option>
            <option value="detected">Detected</option>
            <option value="diagnosing">Diagnosing</option>
            <option value="remediating">Remediating</option>
            <option value="suggested">Awaiting approval</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={sevF}
            onChange={(e) => setSevF(e.target.value)}
            className="cursor-pointer rounded-lg border border-subtle bg-background/60 px-2 py-1.5 text-xs text-foreground-secondary outline-none"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}

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
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-foreground-tertiary">
          No incidents match your filters.
        </p>
      ) : (
        <motion.div layout className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {visible.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onApprove={onApprove}
                onOpen={onOpen}
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
