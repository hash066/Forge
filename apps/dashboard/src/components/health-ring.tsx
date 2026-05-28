'use client';

import { motion } from 'framer-motion';

interface HealthRingProps {
  score: number; // 0..100
  pods: { total: number; healthy: number };
}

function ringColor(score: number): string {
  if (score >= 90) return 'hsl(var(--verified-500))';
  if (score >= 70) return 'hsl(var(--warning-500))';
  return 'hsl(var(--critical-500))';
}

export function HealthRing({ score, pods }: HealthRingProps) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c * (1 - pct / 100);
  const color = ringColor(pct);

  return (
    <div className="panel flex flex-col items-center justify-center p-6">
      <div className="relative h-[180px] w-[180px]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke="hsl(var(--border-subtle))"
            strokeWidth="12"
          />
          <motion.circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: 'spring', stiffness: 60, damping: 18 }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={Math.round(pct)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl font-bold tabular-nums"
            style={{ color }}
          >
            {Math.round(pct)}
          </motion.span>
          <span className="text-xs font-medium text-foreground-tertiary">cluster health</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="font-mono text-sm text-foreground-secondary">
          <span className="text-verified">{pods.healthy}</span>
          <span className="text-foreground-tertiary"> / {pods.total} pods healthy</span>
        </div>
      </div>
    </div>
  );
}
