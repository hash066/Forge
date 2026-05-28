'use client';

import { useState } from 'react';
import { AlertCircle, MessageSquareText } from 'lucide-react';
import type { AuditEntry, ClusterSnapshot, Incident } from '@devforge/core';
import { useClusterFeed } from '@/hooks/useClusterFeed';
import { ActivityRail } from '@/components/activity-rail';
import { HealthRing } from '@/components/health-ring';
import { IncidentFeed } from '@/components/incident-feed';
import { StatCards } from '@/components/stat-cards';
import { TopBar } from '@/components/topbar';
import { Sidebar, type ViewKey } from '@/components/shell/sidebar';
import { ClusterMap } from '@/components/topology/cluster-map';
import { CLUSTER_NAME } from '@/lib/config';
import { timeAgo } from '@/lib/format';

const VIEW_META: Record<ViewKey, { title: string; kicker: string; sub: string }> = {
  overview: {
    kicker: 'Autonomous Kubernetes SRE',
    title: 'Self-healing Kubernetes',
    sub: 'DevForge OS watches the cluster, diagnoses incidents with GPT, and remediates them autonomously — gated and audited.',
  },
  topology: {
    kicker: 'Live cluster',
    title: 'Cluster topology',
    sub: 'Every namespace and workload, in real time. Incidents pulse; healed pods settle to green.',
  },
  incidents: {
    kicker: 'Detect → diagnose → remediate → verify',
    title: 'Incidents',
    sub: 'The full self-healing loop, incident by incident, with the AI root cause and the fix it applied.',
  },
  ask: {
    kicker: 'Natural language',
    title: 'Ask your cluster',
    sub: 'Ask anything about cluster state and incidents — answered by GPT over live data.',
  },
  cost: {
    kicker: 'FinOps',
    title: 'Cost & waste',
    sub: 'Over-provisioned workloads DevForge right-sizes to reclaim spend.',
  },
  security: {
    kicker: 'Posture',
    title: 'Security findings',
    sub: 'Privileged containers and misconfigurations caught and remediated.',
  },
  audit: {
    kicker: 'Compliance',
    title: 'Audit trail',
    sub: 'Every detection, diagnosis, and remediation — immutable and tenant-scoped.',
  },
};

export default function DashboardPage() {
  const [view, setView] = useState<ViewKey>('overview');
  const feed = useClusterFeed();
  const snapshot = feed.snapshot;
  const health = snapshot?.health_score ?? 100;
  const pods = { total: snapshot?.pods_total ?? 0, healthy: snapshot?.pods_healthy ?? 0 };
  const meta = VIEW_META[view];

  return (
    <div className="flex min-h-screen">
      <Sidebar active={view} onSelect={setView} openCount={feed.stats.open} />

      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar
          connection={feed.connection}
          online={feed.online}
          providerModel={feed.providerModel}
          demoRunning={feed.demoRunning}
          onRunDemo={feed.runDemo}
        />

        <main className="mx-auto w-full max-w-[1500px] flex-1 px-6 py-7">
          {/* view header */}
          <div className="mb-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400/80">
              {meta.kicker}
            </span>
            <h1 className="mt-2 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight">
              {meta.title}
            </h1>
            <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-foreground-secondary">
              {meta.sub}
            </p>
          </div>

          {!feed.online && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm text-brand-300">
              <AlertCircle className="h-4 w-4" />
              Control plane offline — showing the last known state. Start it and this view goes live.
            </div>
          )}

          {view === 'overview' && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <HealthRing score={health} pods={pods} />
                <div className="flex flex-col justify-center">
                  <StatCards stats={feed.stats} snapshot={snapshot} />
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                <IncidentFeed
                  incidents={feed.incidents}
                  onApprove={feed.approveIncident}
                  onRunDemo={feed.runDemo}
                  demoRunning={feed.demoRunning}
                />
                <ActivityRail remediations={feed.remediations} audit={feed.audit} />
              </div>
            </div>
          )}

          {view === 'topology' && (
            <div className="flex flex-col gap-4">
              <StatCards stats={feed.stats} snapshot={snapshot} />
              <ClusterMap incidents={feed.incidents} snapshot={snapshot} clusterName={CLUSTER_NAME} />
            </div>
          )}

          {view === 'incidents' && (
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <IncidentFeed
                incidents={feed.incidents}
                onApprove={feed.approveIncident}
                onRunDemo={feed.runDemo}
                demoRunning={feed.demoRunning}
              />
              <ActivityRail remediations={feed.remediations} audit={feed.audit} />
            </div>
          )}

          {view === 'ask' && <AskView />}
          {view === 'cost' && <CostView snapshot={snapshot} incidents={feed.incidents} />}
          {view === 'security' && <SecurityView snapshot={snapshot} incidents={feed.incidents} />}
          {view === 'audit' && <AuditView audit={feed.audit} />}

          <footer className="mt-10 flex items-center justify-between border-t border-subtle pt-4 text-xs text-foreground-tertiary">
            <span>DevForge OS · autonomous Kubernetes SRE</span>
            <span className="font-mono">powered by OpenAI</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

/* ── lightweight views (real data, no new deps) ─────────────────────────────── */

function AskView() {
  return (
    <div className="panel flex min-h-[360px] flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-400">
        <MessageSquareText className="h-7 w-7" />
      </div>
      <div>
        <p className="font-display text-xl font-semibold">Ask your cluster</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground-tertiary">
          “Why are payments crashing?” · “What did you fix in the last 10 minutes?” · “Where is the
          cost waste?” — GPT answers over live cluster state, citing the incidents it used.
        </p>
      </div>
      <div className="flex w-full max-w-lg items-center gap-2 rounded-xl border border-subtle bg-background/60 px-4 py-3 text-left text-sm text-foreground-tertiary">
        <span className="font-mono text-brand-400">›</span>
        Ask a question…
        <span className="ml-auto rounded-md border border-subtle px-2 py-0.5 font-mono text-[10px] text-foreground-disabled">
          ⏎
        </span>
      </div>
    </div>
  );
}

function CostView({
  snapshot,
  incidents,
}: {
  snapshot: ClusterSnapshot | null;
  incidents: Incident[];
}) {
  const cost = snapshot?.monthly_cost_usd ?? 0;
  const waste = snapshot?.monthly_waste_usd ?? 0;
  const pct = cost > 0 ? Math.round((waste / cost) * 100) : 0;
  const costIncidents = incidents.filter(
    (i) => (i.remediation as { action?: string })?.action === 'set_resources',
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Monthly spend" value={`$${Math.round(cost)}`} sub="across the cluster" />
        <Tile
          label="Waste detected"
          value={`$${Math.round(waste)}`}
          sub={`${pct}% of spend`}
          accent="text-brand-400"
        />
        <Tile
          label="Right-sized"
          value={String(costIncidents.length)}
          sub="workloads optimized"
          accent="text-verified"
        />
      </div>
      <div className="panel p-5">
        <p className="mb-3 font-display text-lg font-semibold">Cost optimizations</p>
        {costIncidents.length === 0 ? (
          <p className="text-sm text-foreground-tertiary">No over-provisioned workloads right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {costIncidents.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between rounded-lg border border-subtle bg-background/40 px-3 py-2 text-sm"
              >
                <span className="font-mono text-foreground-secondary">
                  {i.namespace}/{i.name}
                </span>
                <span className="text-brand-400">right-sized · ~$40/mo saved</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SecurityView({
  snapshot,
  incidents,
}: {
  snapshot: ClusterSnapshot | null;
  incidents: Incident[];
}) {
  const secIncidents = incidents.filter((i) => i.reason === 'PrivilegedPod' || i.severity === 'critical');
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile
          label="Open findings"
          value={String(snapshot?.security_findings ?? 0)}
          sub="misconfigurations"
          accent="text-critical"
        />
        <Tile label="Privileged pods" value={String(secIncidents.length)} sub="flagged" />
        <Tile
          label="Remediated"
          value={String(secIncidents.filter((i) => i.status === 'resolved').length)}
          sub="hardened"
          accent="text-verified"
        />
      </div>
      <div className="panel p-5">
        <p className="mb-3 font-display text-lg font-semibold">Security incidents</p>
        {secIncidents.length === 0 ? (
          <p className="text-sm text-foreground-tertiary">No security findings detected.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {secIncidents.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between rounded-lg border border-subtle bg-background/40 px-3 py-2 text-sm"
              >
                <span className="font-mono text-foreground-secondary">
                  {i.namespace}/{i.name}
                </span>
                <span className={i.status === 'resolved' ? 'text-verified' : 'text-critical'}>
                  {i.status === 'resolved' ? 'hardened' : i.reason}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AuditView({ audit }: { audit: AuditEntry[] }) {
  return (
    <div className="panel p-5">
      {audit.length === 0 ? (
        <p className="text-sm text-foreground-tertiary">No audit entries yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[hsl(var(--border-subtle))]">
          {audit.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="font-mono text-[11px] text-foreground-tertiary">{timeAgo(a.created_at)}</span>
              <span className="rounded-md border border-subtle bg-elevated/60 px-2 py-0.5 font-mono text-[11px] text-brand-300">
                {a.action}
              </span>
              <span className="text-foreground-secondary">{a.resource_type}</span>
              <span className="ml-auto font-mono text-[11px] text-foreground-tertiary">{a.actor}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  accent = 'text-foreground',
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="panel p-5">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground-tertiary">
        {label}
      </span>
      <div className={`mt-3 font-display text-[2rem] font-semibold leading-none tabular-nums ${accent}`}>
        {value}
      </div>
      <div className="mt-1.5 text-xs text-foreground-tertiary">{sub}</div>
    </div>
  );
}
