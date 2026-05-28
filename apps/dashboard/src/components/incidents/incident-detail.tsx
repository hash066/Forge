'use client';

import { useState } from 'react';
import { Check, RefreshCw, Terminal } from 'lucide-react';
import type { Incident, ToolStep } from '@devforge/core';
import { Drawer } from '@/components/ui/drawer';
import { Select } from '@/components/ui/form';
import { ReasoningStream } from './reasoning-stream';
import { actionLabel, severityPalette, statusMeta, timeAgo } from '@/lib/format';

const ACTIONS = [
  'restart_pod',
  'rollback',
  'set_resources',
  'scale',
  'patch_image',
  'adjust_probe',
  'add_limits',
  'cordon_drain',
];

interface Plan {
  action?: string;
  target?: string;
  rationale?: string;
  commands?: string[];
}

interface IncidentDetailProps {
  incident: Incident | null;
  open: boolean;
  onClose: () => void;
  reasoning?: string;
  tools?: ToolStep[];
  onApprove: (i: Incident) => void;
  onReject: (i: Incident) => void;
  onOverride: (i: Incident, action: string) => void;
  onReDiagnose: (i: Incident) => void;
}

export function IncidentDetail({
  incident,
  open,
  onClose,
  reasoning,
  tools,
  onApprove,
  onReject,
  onOverride,
  onReDiagnose,
}: IncidentDetailProps) {
  const [override, setOverride] = useState('rollback');
  if (!incident) return null;

  const sev = severityPalette(incident.severity);
  const status = statusMeta(incident.status);
  const plan = (incident.remediation ?? {}) as Plan;
  const resolved = incident.status === 'resolved';
  const evidence = (incident.evidence ?? []) as unknown[];

  const title = (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`font-mono text-sm font-semibold ${sev.text}`}>{incident.reason}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${status.palette.bg} ${status.palette.border} ${status.palette.text}`}
        >
          {status.label}
        </span>
      </div>
      <p className="mt-0.5 truncate font-mono text-xs text-foreground-tertiary">
        {incident.namespace}/{incident.name}
      </p>
    </div>
  );

  return (
    <Drawer open={open} onClose={onClose} title={title}>
      <p className="text-sm text-foreground-secondary">{incident.summary}</p>

      <div className="mt-4">
        <ReasoningStream
          text={reasoning || incident.root_cause}
          tools={tools}
          active={false}
          model={incident.model_used}
          confidence={incident.confidence}
        />
      </div>

      <div className="mt-4 rounded-lg border border-subtle bg-background/40 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-tertiary">
          Proposed remediation
        </p>
        <p className="mt-1.5 text-sm font-semibold text-foreground">{actionLabel(plan.action ?? 'none')}</p>
        {plan.rationale && (
          <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">{plan.rationale}</p>
        )}
        {plan.commands?.[0] && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-subtle/60 bg-background/70 px-2.5 py-1.5">
            <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-tertiary" />
            <code className="font-mono text-[11px] leading-relaxed text-verified-300">
              {plan.commands[0]}
            </code>
          </div>
        )}
      </div>

      {evidence.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-tertiary">
            Evidence
          </p>
          <ul className="mt-1.5 space-y-1">
            {evidence.slice(0, 6).map((e, i) => (
              <li key={i} className="font-mono text-[11px] leading-relaxed text-foreground-secondary">
                • {String(e)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 border-t border-subtle pt-4">
        {!resolved && (
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(incident)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-background transition hover:opacity-95"
            >
              <Check className="h-4 w-4" />
              Approve &amp; apply
            </button>
            <button
              onClick={() => onReject(incident)}
              className="rounded-lg border border-subtle px-3 py-2 text-sm text-foreground-secondary transition hover:border-critical/40 hover:text-critical"
            >
              Reject
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={override}
              onChange={setOverride}
              options={ACTIONS.map((a) => ({ value: a, label: actionLabel(a) }))}
            />
          </div>
          <button
            onClick={() => onOverride(incident, override)}
            className="rounded-lg border border-subtle px-3 py-2 text-sm text-foreground-secondary transition hover:border-brand-500/40 hover:text-foreground"
          >
            Override
          </button>
        </div>
        <button
          onClick={() => onReDiagnose(incident)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-subtle px-3 py-2 text-sm text-foreground-secondary transition hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Re-diagnose with AI
        </button>
        <p className="mt-1 font-mono text-[10px] text-foreground-tertiary">
          {timeAgo(incident.detected_at)}
          {incident.model_used ? ` · ${incident.model_used}` : ''}
        </p>
      </div>
    </Drawer>
  );
}
