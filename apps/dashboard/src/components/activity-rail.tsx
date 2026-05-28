'use client';

import { motion } from 'framer-motion';
import { History, Wrench } from 'lucide-react';
import type { AuditEntry, Remediation } from '@devforge/core';
import { actionLabel, riskPalette, timeAgo } from '@/lib/format';

interface ActivityRailProps {
  remediations: Remediation[];
  audit: AuditEntry[];
}

function remediationStatusColor(status: string): string {
  switch (status) {
    case 'applied':
      return 'text-verified';
    case 'failed':
      return 'text-critical';
    case 'approved':
      return 'text-ai';
    case 'skipped':
      return 'text-foreground-tertiary';
    default:
      return 'text-warning';
  }
}

export function ActivityRail({ remediations, audit }: ActivityRailProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Remediation timeline */}
      <section className="panel p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
          <Wrench className="h-4 w-4 text-brand-400" />
          Remediation timeline
        </h2>
        {remediations.length === 0 ? (
          <p className="py-4 text-center text-sm text-foreground-tertiary">No remediations yet.</p>
        ) : (
          <ol className="relative ml-1 flex flex-col gap-3 border-l border-subtle pl-4">
            {remediations.slice(0, 12).map((r, i) => {
              const risk = riskPalette(r.risk);
              return (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="relative"
                >
                  <span
                    className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${risk.dot} ring-4 ring-background`}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{actionLabel(r.action)}</span>
                    <span className={`text-[11px] font-semibold ${remediationStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-foreground-tertiary">{r.target}</span>
                    <span className="font-mono text-[11px] text-foreground-tertiary">
                      {timeAgo(r.created_at)}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Audit log */}
      <section className="panel p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
          <History className="h-4 w-4 text-ai" />
          Audit log
          <span className="ml-auto rounded-full border border-subtle bg-elevated/60 px-2 py-0.5 font-mono text-[10px] text-foreground-tertiary">
            immutable
          </span>
        </h2>
        {audit.length === 0 ? (
          <p className="py-4 text-center text-sm text-foreground-tertiary">No audit entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {audit.slice(0, 14).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 truncate">
                  <span className="font-mono text-foreground-secondary">{a.action}</span>
                  <span className="truncate text-foreground-tertiary">{a.actor}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-foreground-tertiary">
                  {timeAgo(a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
