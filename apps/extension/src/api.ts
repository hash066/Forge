/**
 * Typed API client for the DevForge control plane.
 *
 * Uses node-native fetch (Node 18+ which VS Code 1.85+ uses). One method per
 * endpoint, all returning typed shapes that mirror the backend Pydantic
 * schemas in services/control-plane/app/schemas.
 */
import { getConfig } from './config';

// ── Response types (mirror backend schemas) ──────────────────────────────
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface Violation {
  severity: Severity;
  category: string;
  title: string;
  description: string;
  file?: string | null;
  line_start?: number | null;
  line_end?: number | null;
  recommendation?: string | null;
  auto_fix_available: boolean;
}

export interface RiskScores {
  scalability: number;
  over_engineering: number;
  security: number;
  consistency: number;
}

export interface AnalysisResponse {
  summary: string;
  severity: Severity;
  violations: Violation[];
  risk_scores: RiskScores | null;
  recommendations: string[];
  metadata: { request_id: string; tenant_id: string; latency_ms: number };
}

export interface SecurityFinding {
  id: string;
  severity: Severity;
  title: string;
  cwe?: string | null;
  line?: number | null;
  snippet: string;
  recommendation: string;
}

export interface SecurityResponse {
  scan_passed: boolean;
  findings: SecurityFinding[];
  summary: Record<string, number>;
  metadata: { latency_ms: number };
}

export interface CostEstimateResource {
  type: string;
  configuration: Record<string, unknown>;
}

export interface CostResponse {
  region: string;
  monthly_total: number;
  daily_total: number;
  annual_total: number;
  estimates: { type: string; monthly_cost: number; breakdown: Record<string, number> }[];
  metadata: { latency_ms: number };
}

export interface RiskResponse {
  scores: RiskScores;
  rationale: Record<string, string>;
  metadata: { latency_ms: number };
}

// ── Kubernetes (DevForge OS) ─────────────────────────────────────────────────
export interface K8sRemediation {
  action: string;
  target: string;
  rationale?: string;
  risk?: string;
  mode?: string;
  commands?: string[];
}

export interface K8sIncident {
  id: string;
  namespace: string;
  kind: string;
  name: string;
  reason: string;
  severity: Severity;
  status: string;
  summary: string;
  root_cause: string;
  confidence: number;
  remediation: K8sRemediation;
  model_used: string | null;
  detected_at: string;
}

// ── Client ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const cfg = getConfig();
  const url = `${cfg.apiUrl}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': cfg.apiKey,
        'X-Tenant-Id': cfg.tenantId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(`${res.status} ${res.statusText}`, res.status, text);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function getRequest<T>(path: string): Promise<T> {
  const cfg = getConfig();
  const res = await fetch(`${cfg.apiUrl}${path}`, {
    headers: { 'X-API-Key': cfg.apiKey, 'X-Tenant-Id': cfg.tenantId },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new ApiError(`${res.status} ${res.statusText}`, res.status, await res.text());
  }
  return (await res.json()) as T;
}

export const api = {
  analyzeCode: (code: string, language: string, blueprintId?: string) =>
    request<AnalysisResponse>('/v1/analysis', {
      code,
      language,
      blueprint_id: blueprintId ?? null,
    }),

  scanSecurity: (content: string, type: string) =>
    request<SecurityResponse>('/v1/security/scan', {
      scan_type: 'code',
      target: { content, type },
    }),

  estimateCost: (resources: CostEstimateResource[], region = 'eu-north-1') =>
    request<CostResponse>('/v1/cost', { resources, region }),

  scoreRisk: (architecture: Record<string, unknown>, context?: Record<string, unknown>) =>
    request<RiskResponse>('/v1/risk', { architecture, context: context ?? null }),

  listIncidents: (limit = 50) =>
    getRequest<K8sIncident[]>(`/v1/k8s/incidents?limit=${limit}`),

  health: async (): Promise<boolean> => {
    const cfg = getConfig();
    try {
      const res = await fetch(`${cfg.apiUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  },
};
