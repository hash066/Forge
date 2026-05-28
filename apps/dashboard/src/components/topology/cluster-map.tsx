'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ClusterSnapshot, Incident } from '@devforge/core';

interface ClusterMapProps {
  incidents: Incident[];
  snapshot: ClusterSnapshot | null;
  clusterName: string;
}

type PodState = 'healthy' | 'active' | 'resolved' | 'failed' | 'critical';

interface PodNode {
  id: string;
  label: string;
  state: PodState;
  x: number;
  y: number;
}

interface NsNode {
  name: string;
  x: number;
  y: number;
  pods: PodNode[];
}

const W = 920;
const H = 560;
const CX = W / 2;
const CY = H / 2;
const NS_RADIUS = 196;
const POD_RADIUS = 62;

const DEFAULT_NAMESPACES = ['shop', 'ml', 'platform', 'observability'];

function podState(status: string): PodState {
  if (status === 'resolved') return 'resolved';
  if (status === 'failed') return 'failed';
  if (status === 'detected') return 'critical';
  return 'active'; // diagnosing | remediating | suggested
}

function colorFor(state: PodState): string {
  switch (state) {
    case 'resolved':
      return 'hsl(var(--verified-500))';
    case 'failed':
    case 'critical':
      return 'hsl(var(--critical-500))';
    case 'active':
      return 'hsl(var(--brand-500))';
    default:
      return 'hsl(var(--fg-tertiary))';
  }
}

export function ClusterMap({ incidents, snapshot, clusterName }: ClusterMapProps) {
  const { namespaces } = useMemo(() => {
    // group incidents by namespace
    const byNs = new Map<string, Incident[]>();
    for (const inc of incidents) {
      const arr = byNs.get(inc.namespace) ?? [];
      arr.push(inc);
      byNs.set(inc.namespace, arr);
    }
    // ensure a full-looking constellation
    const names = Array.from(
      new Set([...byNs.keys(), ...DEFAULT_NAMESPACES]),
    ).slice(0, 6);

    const nsNodes: NsNode[] = names.map((name, i) => {
      const angle = (i / names.length) * Math.PI * 2 - Math.PI / 2;
      const nx = CX + NS_RADIUS * Math.cos(angle);
      const ny = CY + NS_RADIUS * Math.sin(angle);

      const incs = byNs.get(name) ?? [];
      const pods: PodNode[] = [];
      // incident pods (named, prominent)
      incs.slice(0, 4).forEach((inc, j, all) => {
        const pa = angle + ((j - (all.length - 1) / 2) * 0.5);
        pods.push({
          id: inc.id,
          label: inc.name.split('-').slice(0, 2).join('-'),
          state: podState(inc.status),
          x: nx + POD_RADIUS * Math.cos(pa),
          y: ny + POD_RADIUS * Math.sin(pa),
        });
      });
      // a couple of healthy filler pods so namespaces never look empty
      const fillers = Math.max(0, 3 - pods.length);
      for (let f = 0; f < fillers; f++) {
        const pa = angle + Math.PI + (f - 0.5) * 0.55;
        pods.push({
          id: `${name}-ok-${f}`,
          label: '',
          state: 'healthy',
          x: nx + (POD_RADIUS - 8) * Math.cos(pa),
          y: ny + (POD_RADIUS - 8) * Math.sin(pa),
        });
      }
      return { name, x: nx, y: ny, pods };
    });

    return { namespaces: nsNodes };
  }, [incidents]);

  const health = snapshot?.health_score ?? 100;
  const coreColor =
    health >= 90
      ? 'hsl(var(--verified-500))'
      : health >= 70
        ? 'hsl(var(--brand-500))'
        : 'hsl(var(--critical-500))';

  return (
    <div className="panel relative overflow-hidden p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full max-h-[560px] w-full">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={coreColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={coreColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* edges: core → namespace → pods */}
        {namespaces.map((ns) => (
          <g key={`edges-${ns.name}`}>
            <line
              x1={CX}
              y1={CY}
              x2={ns.x}
              y2={ns.y}
              stroke="hsl(var(--border-strong))"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
            {ns.pods.map((p) => (
              <line
                key={`e-${p.id}`}
                x1={ns.x}
                y1={ns.y}
                x2={p.x}
                y2={p.y}
                stroke="hsl(var(--border-default))"
                strokeWidth={1}
                strokeOpacity={0.4}
              />
            ))}
          </g>
        ))}

        {/* cluster core */}
        <circle cx={CX} cy={CY} r={120} fill="url(#coreGlow)" />
        <circle
          cx={CX}
          cy={CY}
          r={46}
          fill="hsl(var(--bg-elevated))"
          stroke={coreColor}
          strokeWidth={2}
        />
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          className="fill-foreground"
          style={{ font: '600 22px var(--font-display)' }}
        >
          {Math.round(health)}
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          className="fill-foreground-tertiary"
          style={{ font: "500 9px var(--font-mono)", letterSpacing: '0.12em' }}
        >
          HEALTH
        </text>

        {/* namespaces + pods */}
        {namespaces.map((ns) => (
          <g key={ns.name}>
            <circle
              cx={ns.x}
              cy={ns.y}
              r={13}
              fill="hsl(var(--bg-overlay))"
              stroke="hsl(var(--border-strong))"
              strokeWidth={1.5}
            />
            <text
              x={ns.x}
              y={ns.y - 22}
              textAnchor="middle"
              className="fill-foreground-secondary"
              style={{ font: '500 11px var(--font-mono)' }}
            >
              {ns.name}
            </text>

            {ns.pods.map((p) => {
              const c = colorFor(p.state);
              const isActive = p.state === 'active' || p.state === 'critical';
              return (
                <g key={p.id}>
                  {isActive && (
                    <motion.circle
                      cx={p.x}
                      cy={p.y}
                      r={7}
                      fill={c}
                      initial={{ opacity: 0.5, scale: 1 }}
                      animate={{ opacity: 0, scale: 2.6 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={p.state === 'healthy' ? 4 : 7}
                    fill={c}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    style={
                      p.state !== 'healthy'
                        ? { filter: `drop-shadow(0 0 6px ${c})` }
                        : undefined
                    }
                  />
                  {p.label && (
                    <text
                      x={p.x}
                      y={p.y + 18}
                      textAnchor="middle"
                      className="fill-foreground-tertiary"
                      style={{ font: '400 8px var(--font-mono)' }}
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </svg>

      {/* legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg border border-subtle bg-background/70 px-3 py-2 backdrop-blur">
        {[
          ['healthy', 'healthy'],
          ['active', 'remediating'],
          ['critical', 'incident'],
          ['resolved', 'healed'],
        ].map(([state, label]) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-foreground-tertiary">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: colorFor(state as PodState) }}
            />
            {label}
          </span>
        ))}
      </div>

      <div className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground-tertiary">
        {clusterName} · {snapshot?.pods_total ?? 0} pods · {namespaces.length} namespaces
      </div>
    </div>
  );
}
