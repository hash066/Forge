'use client';

import { motion } from 'framer-motion';
import { Check, ChevronRight, Sparkles, Terminal } from 'lucide-react';
import type { Incident } from '@devforge/core';
import { ReasoningStream } from './incidents/reasoning-stream';
import { actionLabel, riskPalette, severityPalette, statusMeta, timeAgo } from '@/lib/format';

function buildToolTrace(incident: Incident): { tool: string; arg: string; result: string }[] {
  const ev = (incident.evidence ?? []) as unknown[];
  const trim = (s: string) => (s.length > 52 ? `${s.slice(0, 49)}…` : s);
  const steps = [
    {
      tool: 'get_events',
      arg: `${incident.namespace}/${incident.name}`,
      result: trim(String(ev[0] ?? incident.reason)),
    },
  ];
  if (ev[1]) steps.push({ tool: 'get_pod_logs', arg: incident.name, result: trim(String(ev[1])) });
  if (ev[2]) steps.push({ tool: 'describe_pod', arg: incident.name, result: trim(String(ev[2])) });
  return steps;
}

interface IncidentCardProps {
  incident: Incident;
  onApprove: (incident: Incident) => void;
}

interface Plan {
  action?: string;
  target?: string;
  rationale?: string;
  risk?: string;
  mode?: string;
  commands?: string[];
}

export function IncidentCard({ incident, onApprove }: IncidentCardProps) {
  const sev = severityPalette(incident.severity);
  const status = statusMeta(incident.status);
  const plan = (incident.remediation ?? {}) as Plan;
  const risk = riskPalette(plan.risk ?? 'low');
  const isResolved = incident.status === 'resolved';
  const isSuggested = incident.status === 'suggested';
  const command = plan.commands?.[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className={`panel overflow-hidden ${isResolved ? 'opacity-80' : ''}`}
    >
      {/* status accent bar */}
      <div className={`h-0.5 w-full ${status.palette.dot}`} />

      <div className="p-4">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${sev.dot}`} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-sm font-semibold ${sev.text}`}>
                  {incident.reason}
                </span>
                <span className="text-xs text-foreground-tertiary">
                  {incident.namespace}/{incident.name}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground-secondary">{incident.summary}</p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.palette.bg} ${status.palette.border} ${status.palette.text}`}
          >
            {status.label}
          </span>
        </div>

        {/* AI investigation + reasoning (typewriter while active) */}
        <div className="mt-3">
          <ReasoningStream
            text={incident.root_cause}
            tools={buildToolTrace(incident)}
            active={incident.status !== 'resolved' && incident.status !== 'failed'}
            model={incident.model_used}
            confidence={incident.confidence}
          />
        </div>

        {/* remediation */}
        <div className="mt-3 flex flex-col gap-2.5 rounded-lg border border-subtle bg-background/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-brand-400" />
              {actionLabel(plan.action ?? 'none')}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${risk.bg} ${risk.border} ${risk.text}`}>
              {plan.risk ?? 'low'} risk
            </span>
            <span className="rounded-full border border-subtle bg-elevated/60 px-2 py-0.5 text-[10px] font-medium uppercase text-foreground-tertiary">
              {plan.mode === 'auto' ? 'auto-apply' : 'gated'}
            </span>
          </div>
          {plan.rationale && (
            <p className="text-xs leading-relaxed text-foreground-secondary">{plan.rationale}</p>
          )}
          {command && (
            <div className="flex items-start gap-2 rounded-md border border-subtle/60 bg-background/70 px-2.5 py-1.5">
              <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-tertiary" />
              <code className="font-mono text-[11px] leading-relaxed text-verified-300">
                {command}
              </code>
            </div>
          )}

          {/* action footer */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="font-mono text-[11px] text-foreground-tertiary">
              {timeAgo(incident.detected_at)}
              {incident.model_used ? ` · ${incident.model_used}` : ''}
            </span>
            {isResolved ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-verified">
                <Check className="h-4 w-4" /> Healed
              </span>
            ) : isSuggested ? (
              <button
                onClick={() => onApprove(incident)}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-400 transition hover:bg-brand-500/20"
              >
                Approve & apply
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ai">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full text-ai">
                  <span className="block h-1.5 w-1.5 rounded-full bg-current" />
                </span>
                Remediating
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
