'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DevForgeClient,
  type AuditEntry,
  type ClusterSnapshot,
  type Incident,
  type IncidentStats,
  type Remediation,
  type StreamEvent,
  type ToolStep,
} from '@devforge/core';
import { API_URL, CLUSTER_NAME, TENANT_ID } from '@/lib/config';
import { BASELINE, SCENARIO } from '@/lib/scenario';

const EMPTY_STATS: IncidentStats = {
  total: 0,
  open: 0,
  resolved: 0,
  detected: 0,
  remediating: 0,
  suggested: 0,
};

export type ConnState = 'connecting' | 'open' | 'closed' | 'error';

export interface FeedState {
  connection: ConnState;
  online: boolean;
  providerModel: string | null;
  incidents: Incident[];
  remediations: Remediation[];
  audit: AuditEntry[];
  snapshot: ClusterSnapshot | null;
  stats: IncidentStats;
  demoRunning: boolean;
  reasoning: Record<string, string>;
  tools: Record<string, ToolStep[]>;
}

function computeStats(incidents: Incident[]): IncidentStats {
  const s: IncidentStats = { ...EMPTY_STATS };
  for (const i of incidents) {
    s.total++;
    if (i.status === 'resolved') s.resolved++;
    if (i.status === 'detected') s.detected++;
    if (i.status === 'remediating') s.remediating++;
    if (i.status === 'suggested') s.suggested++;
  }
  s.open = s.total - s.resolved;
  return s;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useClusterFeed() {
  const clientRef = useRef<DevForgeClient | null>(null);
  if (clientRef.current === null) {
    clientRef.current = new DevForgeClient({ baseUrl: API_URL, tenantId: TENANT_ID });
  }
  const client = clientRef.current;

  const incidentsRef = useRef<Map<string, Incident>>(new Map());
  const remediationByIncident = useRef<Map<string, string>>(new Map());
  const reasoningRef = useRef<Record<string, string>>({});
  const toolsRef = useRef<Record<string, ToolStep[]>>({});
  const mounted = useRef(true);

  const [state, setState] = useState<FeedState>({
    connection: 'connecting',
    online: false,
    providerModel: null,
    incidents: [],
    remediations: [],
    audit: [],
    snapshot: null,
    stats: EMPTY_STATS,
    demoRunning: false,
    reasoning: {},
    tools: {},
  });

  const flushIncidents = useCallback(() => {
    const list = Array.from(incidentsRef.current.values()).sort(
      (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime(),
    );
    setState((s) => ({ ...s, incidents: list, stats: computeStats(list) }));
  }, []);

  const upsertIncident = useCallback(
    (incident: Incident) => {
      incidentsRef.current.set(incident.id, incident);
      flushIncidents();
    },
    [flushIncidents],
  );

  const refreshSideData = useCallback(async () => {
    try {
      const [rems, audit] = await Promise.all([client.listRemediations(40), client.listAudit(40)]);
      if (!mounted.current) return;
      setState((s) => ({ ...s, remediations: rems, audit }));
    } catch {
      /* non-fatal */
    }
  }, [client]);

  // Initial load + WebSocket subscription
  useEffect(() => {
    mounted.current = true;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const handle = (event: StreamEvent) => {
      if (event.type === 'incident.diagnosed') {
        if (event.remediation_id) {
          remediationByIncident.current.set(event.incident.id, event.remediation_id);
        }
        upsertIncident(event.incident);
        setState((s) => ({ ...s, providerModel: event.incident.model_used ?? s.providerModel }));
        void refreshSideData();
      } else if (event.type === 'incident.remediated') {
        upsertIncident(event.incident);
        void refreshSideData();
      } else if (event.type === 'incident.detected') {
        reasoningRef.current[event.incident.id] = '';
        toolsRef.current[event.incident.id] = [];
        upsertIncident(event.incident);
        setState((s) => ({
          ...s,
          reasoning: { ...reasoningRef.current },
          tools: { ...toolsRef.current },
        }));
      } else if (event.type === 'reasoning.chunk') {
        reasoningRef.current[event.incident_id] = event.text;
        setState((s) => ({ ...s, reasoning: { ...reasoningRef.current } }));
      } else if (event.type === 'tool.call') {
        const prev = toolsRef.current[event.incident_id] ?? [];
        toolsRef.current[event.incident_id] = [
          ...prev,
          { tool: event.tool, arg: event.arg, result: event.result },
        ].slice(-3);
        setState((s) => ({ ...s, tools: { ...toolsRef.current } }));
      } else if (event.type === 'snapshot') {
        setState((s) => ({ ...s, snapshot: event.snapshot }));
      }
    };

    const connect = () => {
      if (!mounted.current) return;
      setState((s) => ({ ...s, connection: 'connecting' }));
      ws = client.connectStream(handle, (status) => {
        if (!mounted.current) return;
        setState((s) => ({ ...s, connection: status }));
        if (status === 'closed' || status === 'error') {
          reconnectTimer = setTimeout(connect, 2500);
        }
      });
    };

    (async () => {
      const online = await client.isHealthy();
      if (!mounted.current) return;
      setState((s) => ({ ...s, online }));
      try {
        const ov = await client.getOverview();
        if (!mounted.current) return;
        for (const i of ov.recent_incidents) incidentsRef.current.set(i.id, i);
        flushIncidents();
        setState((s) => ({
          ...s,
          snapshot: ov.snapshot,
          remediations: ov.recent_remediations,
          providerModel:
            ov.recent_incidents.find((i) => i.model_used)?.model_used ?? s.providerModel,
        }));
        void refreshSideData();
      } catch {
        /* control plane may be offline; UI still renders */
      }
      connect();
    })();

    return () => {
      mounted.current = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [client, flushIncidents, refreshSideData, upsertIncident]);

  // One-click in-browser demo: drives the control plane through a full
  // detect → diagnose → heal cycle. The WebSocket feed animates the UI.
  const runDemo = useCallback(async () => {
    setState((s) => ({ ...s, demoRunning: true }));
    const total = BASELINE.pods_total;
    const broken = SCENARIO.length;
    try {
      // 1) cluster degraded
      await client.snapshot({
        cluster: CLUSTER_NAME,
        nodes: BASELINE.nodes,
        pods_total: total,
        pods_healthy: total - broken,
        namespaces: BASELINE.namespaces,
        health_score: Math.round((100 * (total - broken)) / total),
        monthly_cost_usd: BASELINE.monthly_cost_usd,
        monthly_waste_usd: 120,
        security_findings: 2,
      });

      // 2) diagnose each incident
      const responses = [];
      for (const ctx of SCENARIO) {
        try {
          responses.push(await client.diagnose(ctx));
        } catch {
          /* keep going */
        }
        await sleep(1100);
      }

      // 3) heal each
      let healthy = total - broken;
      let waste = 120;
      let findings = 2;
      for (const resp of responses) {
        await sleep(1300);
        const plan = resp.rca.remediation;
        if (plan.mode !== 'auto') {
          await client.reportRemediation({
            incident_id: resp.incident_id,
            remediation_id: resp.remediation_id,
            action: plan.action,
            target: plan.target,
            status: 'approved',
            detail: 'operator: approved',
          });
          await sleep(500);
        }
        await client.reportRemediation({
          incident_id: resp.incident_id,
          remediation_id: resp.remediation_id,
          action: plan.action,
          target: plan.target,
          status: 'applied',
          detail: 'devforge-operator: remediated and verified healthy',
        });
        healthy++;
        if (plan.action === 'patch_image') findings = Math.max(0, findings - 1);
        if (plan.action === 'set_resources' || plan.action === 'add_limits')
          waste = Math.max(0, waste - 40);
        await client.snapshot({
          cluster: CLUSTER_NAME,
          nodes: BASELINE.nodes,
          pods_total: total,
          pods_healthy: healthy,
          namespaces: BASELINE.namespaces,
          health_score: Math.round((100 * healthy) / total),
          monthly_cost_usd: BASELINE.monthly_cost_usd,
          monthly_waste_usd: waste,
          security_findings: findings,
        });
      }
    } finally {
      if (mounted.current) setState((s) => ({ ...s, demoRunning: false }));
    }
  }, [client]);

  const approveIncident = useCallback(
    async (incident: Incident) => {
      const plan = (incident.remediation ?? {}) as { action?: string; target?: string };
      const remId = remediationByIncident.current.get(incident.id);
      await client.reportRemediation({
        incident_id: incident.id,
        remediation_id: remId,
        action: plan.action,
        target: plan.target,
        status: 'applied',
        detail: 'operator: approved from dashboard',
      });
    },
    [client],
  );

  const ask = useCallback((question: string) => client.ask(question), [client]);

  return { ...state, runDemo, approveIncident, ask };
}
