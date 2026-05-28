/**
 * Typed client for the DevForge control plane — REST + live WebSocket stream.
 * Isomorphic: uses the global `fetch` / `WebSocket` (browser, and Node ≥ 18).
 */

import type {
  AskResponse,
  AuditEntry,
  ClusterSnapshotInput,
  DiagnoseResponse,
  Incident,
  IncidentContext,
  Overview,
  Remediation,
  RemediateReport,
  RemediationPolicySettings,
  SettingsResponse,
  StreamEvent,
} from "./types";

export interface DevForgeClientOptions {
  baseUrl: string;
  tenantId?: string;
  apiKey?: string;
}

export type StreamStatus = "open" | "closed" | "error";

export class DevForgeClient {
  readonly baseUrl: string;
  readonly tenantId: string;
  private readonly apiKey?: string;

  constructor(opts: DevForgeClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.tenantId = opts.tenantId ?? "demo";
    this.apiKey = opts.apiKey;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-Id": this.tenantId,
    };
    if (this.apiKey) h["X-API-Key"] = this.apiKey;
    return h;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
    return (await res.json()) as T;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
    return (await res.json()) as T;
  }

  private async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path} -> ${res.status}`);
    return (await res.json()) as T;
  }

  // ── REST ───────────────────────────────────────────────────────────────────
  getOverview(): Promise<Overview> {
    return this.get<Overview>("/v1/k8s/overview");
  }

  listIncidents(limit = 100, status?: string): Promise<Incident[]> {
    const q = status ? `?limit=${limit}&status=${encodeURIComponent(status)}` : `?limit=${limit}`;
    return this.get<Incident[]>(`/v1/k8s/incidents${q}`);
  }

  getIncident(id: string): Promise<Incident> {
    return this.get<Incident>(`/v1/k8s/incidents/${id}`);
  }

  listRemediations(limit = 100): Promise<Remediation[]> {
    return this.get<Remediation[]>(`/v1/k8s/remediations?limit=${limit}`);
  }

  listAudit(limit = 100): Promise<AuditEntry[]> {
    return this.get<AuditEntry[]>(`/v1/k8s/audit?limit=${limit}`);
  }

  diagnose(ctx: IncidentContext): Promise<DiagnoseResponse> {
    return this.post<DiagnoseResponse>("/v1/k8s/diagnose", ctx);
  }

  reportRemediation(report: RemediateReport): Promise<{ ok: boolean; detail: string }> {
    return this.post("/v1/k8s/remediate", report);
  }

  snapshot(input: ClusterSnapshotInput): Promise<{ ok: boolean; detail: string }> {
    return this.post("/v1/k8s/snapshot", input);
  }

  /** Natural-language Q&A over live cluster state ("Ask your cluster"). */
  ask(question: string): Promise<AskResponse> {
    return this.post<AskResponse>("/v1/k8s/ask", { question });
  }

  /** AI status + the tenant's remediation policy. */
  getSettings(): Promise<SettingsResponse> {
    return this.get<SettingsResponse>("/v1/k8s/settings");
  }

  /** Update the remediation policy (partial). */
  putSettings(policy: Partial<RemediationPolicySettings>): Promise<SettingsResponse> {
    return this.put<SettingsResponse>("/v1/k8s/settings", policy);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  // ── Live stream ──────────────────────────────────────────────────────────────
  streamUrl(): string {
    const url = new URL(this.baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${url.origin}/v1/k8s/stream?tenant=${encodeURIComponent(this.tenantId)}`;
  }

  connectStream(
    onEvent: (event: StreamEvent) => void,
    onStatus?: (status: StreamStatus) => void,
  ): WebSocket {
    const ws = new WebSocket(this.streamUrl());
    ws.onopen = () => onStatus?.("open");
    ws.onclose = () => onStatus?.("closed");
    ws.onerror = () => onStatus?.("error");
    ws.onmessage = (ev: MessageEvent) => {
      try {
        onEvent(JSON.parse(ev.data as string) as StreamEvent);
      } catch {
        /* ignore malformed frames */
      }
    };
    return ws;
  }
}
