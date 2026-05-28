'use client';

import { useState } from 'react';
import { AlertCircle, MessageSquareText, SendHorizonal } from 'lucide-react';
import type { AskResponse, AuditEntry, ClusterSnapshot, Incident } from '@devforge/core';
import { useClusterFeed } from '@/hooks/useClusterFeed';
import { ReasoningStream } from '@/components/incidents/reasoning-stream';
import { Sparkline } from '@/components/ui/sparkline';
import { ActivityRail } from '@/components/activity-rail';
import { HealthRing } from '@/components/health-ring';
import { IncidentFeed } from '@/components/incident-feed';
import { StatCards } from '@/components/stat-cards';
import { TopBar } from '@/components/topbar';
import { Sidebar, type ViewKey } from '@/components/shell/sidebar';
import { ClusterMap } from '@/components/topology/cluster-map';
import { SettingsView } from '@/components/views/settings-view';
import { LabView } from '@/components/views/lab-view';
import { API_URL, CLUSTER_NAME, TENANT_ID } from '@/lib/config';
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
  lab: {
    kicker: 'Hands-on',
    title: 'Incident lab',
    sub: 'Run a single real diagnosis on a chosen workload and watch the AI investigate live.',
  },
  settings: {
    kicker: 'Configuration',
    title: 'Settings',
    sub: 'Tune the remediation policy that governs the self-healing loop, and connect your cluster.',
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
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-400/80">
                {meta.kicker}
              </span>
              <ModePill mode={feed.mode} />
            </div>
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
              <TrendsPanel healthHistory={feed.healthHistory} stats={feed.stats} snapshot={snapshot} />
              <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                <IncidentFeed
                  incidents={feed.incidents}
                  onApprove={feed.approveIncident}
                  onRunDemo={feed.runDemo}
                  demoRunning={feed.demoRunning}
                  reasoning={feed.reasoning}
                  tools={feed.tools}
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
                reasoning={feed.reasoning}
                tools={feed.tools}
              />
              <ActivityRail remediations={feed.remediations} audit={feed.audit} />
            </div>
          )}

          {view === 'ask' && <AskView ask={feed.ask} />}
          {view === 'cost' && <CostView snapshot={snapshot} incidents={feed.incidents} />}
          {view === 'security' && <SecurityView snapshot={snapshot} incidents={feed.incidents} />}
          {view === 'audit' && <AuditView audit={feed.audit} />}
          {view === 'lab' && <LabView diagnoseOne={feed.diagnoseOne} />}
          {view === 'settings' && (
            <SettingsView
              fetchSettings={feed.fetchSettings}
              saveSettings={feed.saveSettings}
              apiUrl={API_URL}
              tenant={TENANT_ID}
              cluster={CLUSTER_NAME}
            />
          )}

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

function TrendsPanel({
  healthHistory,
  stats,
  snapshot,
}: {
  healthHistory: number[];
  stats: { total: number; resolved: number };
  snapshot: ClusterSnapshot | null;
}) {
  const healRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 100;
  const cur = healthHistory.length
    ? healthHistory[healthHistory.length - 1]
    : (snapshot?.health_score ?? 100);
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground-tertiary">
          Cluster health · live trend
        </span>
        <span className="font-mono text-[11px] text-foreground-tertiary">
          {healthHistory.length} readings
        </span>
      </div>
      <div className="mt-3 flex items-center gap-6">
        <div className="font-display text-[2rem] font-semibold leading-none tabular-nums">
          {Math.round(cur)}
          <span className="text-base text-foreground-tertiary">%</span>
        </div>
        <div className="min-w-0 flex-1">
          <Sparkline data={healthHistory} height={48} color="hsl(var(--verified-500))" min={0} max={100} />
        </div>
        <div className="text-right">
          <div className="font-display text-[1.5rem] font-semibold tabular-nums text-brand-400">
            {healRate}%
          </div>
          <div className="text-[11px] text-foreground-tertiary">auto-heal rate</div>
        </div>
      </div>
    </div>
  );
}

function ModePill({ mode }: { mode: string }) {
  const live = mode === 'live';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        live
          ? 'border-verified/30 bg-verified/10 text-verified'
          : 'border-subtle bg-elevated/60 text-foreground-tertiary'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-verified' : 'bg-foreground-tertiary'}`} />
      {live ? 'live cluster' : 'simulated'}
    </span>
  );
}

const ASK_SUGGESTIONS = [
  'Why are payments crashing?',
  'What did you fix recently?',
  'Where is the cost waste?',
  'Any security risks right now?',
];

function AskView({ ask }: { ask: (q: string) => Promise<AskResponse> }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<AskResponse | null>(null);
  const [asked, setAsked] = useState('');

  const submit = async (question?: string) => {
    const text = (question ?? q).trim();
    if (!text || loading) return;
    setAsked(text);
    setQ(text);
    setLoading(true);
    setResp(null);
    try {
      setResp(await ask(text));
    } catch {
      setResp({
        answer: 'Could not reach the control plane. Start it and try again.',
        sources: [],
        model_used: '',
        provider: '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="panel p-5">
        <div className="flex items-center gap-2 rounded-xl border border-subtle bg-background/60 px-4 py-3">
          <span className="font-mono text-brand-400">›</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Ask anything about your cluster…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-tertiary"
          />
          <button
            onClick={() => submit()}
            disabled={loading || !q.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-background transition hover:opacity-95 disabled:opacity-40"
          >
            <SendHorizonal className="h-3.5 w-3.5" />
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ASK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="rounded-full border border-subtle bg-elevated/60 px-3 py-1 text-xs text-foreground-secondary transition hover:border-brand-500/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {(loading || resp) && (
        <div className="panel p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-tertiary">
            {asked}
          </p>
          {loading ? (
            <p className="text-sm text-foreground-tertiary">
              <span className="mr-2 inline-block h-3.5 w-1.5 animate-pulse bg-brand-400 align-middle" />
              consulting cluster state…
            </p>
          ) : resp ? (
            <ReasoningStream text={resp.answer} active model={resp.model_used || null} />
          ) : null}
          {resp && resp.sources.length > 0 && (
            <p className="mt-3 font-mono text-[11px] text-foreground-tertiary">
              sources: {resp.sources.length} incident(s)
            </p>
          )}
        </div>
      )}

      {!loading && !resp && (
        <div className="panel flex flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-400">
            <MessageSquareText className="h-7 w-7" />
          </div>
          <p className="max-w-md text-sm text-foreground-tertiary">
            GPT answers over live cluster state, citing the incidents it used. Try a suggestion
            above.
          </p>
        </div>
      )}
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
