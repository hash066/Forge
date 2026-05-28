'use client';

import { useState } from 'react';
import { FlaskConical, Sparkles } from 'lucide-react';
import type { DiagnoseResponse, IncidentContext } from '@devforge/core';
import { SCENARIO } from '@/lib/scenario';
import { ReasoningStream } from '@/components/incidents/reasoning-stream';
import { actionLabel } from '@/lib/format';

interface LabViewProps {
  diagnoseOne: (ctx: IncidentContext) => Promise<DiagnoseResponse | null>;
}

export function LabView({ diagnoseOne }: LabViewProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnoseResponse | null>(null);

  const run = async (ctx: IncidentContext) => {
    setBusy(ctx.name);
    setResult(null);
    const r = await diagnoseOne(ctx);
    setResult(r);
    setBusy(null);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-brand-400" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground-tertiary">
            Pick a failing workload
          </span>
        </div>
        <p className="mt-2 text-sm text-foreground-tertiary">
          Run a single real diagnosis and watch the AI investigate. It also streams into Incidents
          and Topology.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {SCENARIO.map((ctx) => (
            <button
              key={ctx.name}
              onClick={() => run(ctx)}
              disabled={busy !== null}
              className="flex items-center justify-between gap-3 rounded-lg border border-subtle bg-background/40 px-3 py-2.5 text-left text-sm transition hover:border-brand-500/40 disabled:opacity-50"
            >
              <span className="min-w-0">
                <span className="font-mono text-brand-400">{ctx.reason}</span>{' '}
                <span className="text-foreground-tertiary">
                  {ctx.namespace}/{ctx.name}
                </span>
              </span>
              <span className="shrink-0 text-xs text-foreground-tertiary">
                {busy === ctx.name ? 'diagnosing…' : 'diagnose →'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        {result ? (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-foreground-tertiary">
              {result.rca.summary}
            </p>
            <div className="mt-3">
              <ReasoningStream
                text={result.rca.root_cause}
                active
                model={result.model_used}
                confidence={result.rca.confidence}
              />
            </div>
            <div className="mt-3 rounded-lg border border-subtle bg-background/40 p-3">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-brand-400" />
                {actionLabel(result.rca.remediation.action)}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground-secondary">
                {result.rca.remediation.rationale}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center text-center text-sm text-foreground-tertiary">
            Select a workload to run a live diagnosis.
          </div>
        )}
      </div>
    </div>
  );
}
