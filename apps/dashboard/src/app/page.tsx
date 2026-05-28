'use client';

import { AlertCircle } from 'lucide-react';
import { useClusterFeed } from '@/hooks/useClusterFeed';
import { ActivityRail } from '@/components/activity-rail';
import { HealthRing } from '@/components/health-ring';
import { IncidentFeed } from '@/components/incident-feed';
import { StatCards } from '@/components/stat-cards';
import { TopBar } from '@/components/topbar';

export default function DashboardPage() {
  const feed = useClusterFeed();
  const snapshot = feed.snapshot;
  const health = snapshot?.health_score ?? 100;
  const pods = {
    total: snapshot?.pods_total ?? 0,
    healthy: snapshot?.pods_healthy ?? 0,
  };

  return (
    <div className="min-h-screen">
      <TopBar
        connection={feed.connection}
        online={feed.online}
        providerModel={feed.providerModel}
        demoRunning={feed.demoRunning}
        onRunDemo={feed.runDemo}
      />

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Self-healing <span className="text-brand-gradient">Kubernetes</span>
          </h1>
          <p className="mt-1 text-sm text-foreground-tertiary">
            DevForge OS watches the cluster, diagnoses incidents with GPT, and remediates them
            autonomously — with policy gates and a full audit trail.
          </p>
        </div>

        {!feed.online && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-critical/30 bg-critical/10 px-4 py-3 text-sm text-critical">
            <AlertCircle className="h-4 w-4" />
            Control plane not reachable at the configured API URL. Start it, then this view goes
            live automatically.
          </div>
        )}

        {/* Top row: health + KPIs */}
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <HealthRing score={health} pods={pods} />
          <div className="flex flex-col justify-center">
            <StatCards stats={feed.stats} snapshot={snapshot} />
          </div>
        </div>

        {/* Main: feed + activity */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <IncidentFeed
            incidents={feed.incidents}
            onApprove={feed.approveIncident}
            onRunDemo={feed.runDemo}
            demoRunning={feed.demoRunning}
          />
          <ActivityRail remediations={feed.remediations} audit={feed.audit} />
        </div>

        <footer className="mt-8 flex items-center justify-between border-t border-subtle pt-4 text-xs text-foreground-tertiary">
          <span>DevForge OS · autonomous Kubernetes SRE</span>
          <span className="font-mono">powered by OpenAI</span>
        </footer>
      </main>
    </div>
  );
}
