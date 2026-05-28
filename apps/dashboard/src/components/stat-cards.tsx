'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, DollarSign, ShieldAlert, Wand2, type LucideIcon } from 'lucide-react';
import type { ClusterSnapshot, IncidentStats } from '@devforge/core';

interface StatCardsProps {
  stats: IncidentStats;
  snapshot: ClusterSnapshot | null;
}

interface Stat {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  accent: string;
}

export function StatCards({ stats, snapshot }: StatCardsProps) {
  const cards: Stat[] = [
    {
      label: 'Active incidents',
      value: String(stats.open),
      sub: `${stats.suggested} awaiting approval`,
      icon: AlertTriangle,
      accent: 'text-brand-400',
    },
    {
      label: 'Auto-healed',
      value: String(stats.resolved),
      sub: 'by DevForge OS',
      icon: Wand2,
      accent: 'text-verified',
    },
    {
      label: 'Monthly cost',
      value: snapshot ? `$${Math.round(snapshot.monthly_cost_usd)}` : '—',
      sub: snapshot ? `$${Math.round(snapshot.monthly_waste_usd)} waste detected` : 'no data',
      icon: DollarSign,
      accent: 'text-ai',
    },
    {
      label: 'Security findings',
      value: snapshot ? String(snapshot.security_findings) : '—',
      sub: 'misconfigurations',
      icon: ShieldAlert,
      accent: 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="panel p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-tertiary">{c.label}</span>
              <Icon className={`h-4 w-4 ${c.accent}`} />
            </div>
            <div className="mt-2 font-display text-3xl font-bold tabular-nums">{c.value}</div>
            <div className="mt-0.5 text-xs text-foreground-tertiary">{c.sub}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
